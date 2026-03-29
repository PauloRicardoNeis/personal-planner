// Prevents additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;

/// Holds the sidecar child handle so we can kill it on window close.
struct SidecarHandle(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

/// Re-checks for updates and installs if one is available.
/// Called from the frontend when the user clicks "Install update".
#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    // Kill the sidecar before updating so the NSIS installer can overwrite planner-server.exe
    if let Some(handle) = app.try_state::<SidecarHandle>() {
        if let Some(child) = handle.0.lock().unwrap().take() {
            let _ = child.kill();
            println!("[desktop] sidecar killed before update install");
        }
    }

    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn check_for_updates(app: tauri::AppHandle) {
    use tauri_plugin_updater::UpdaterExt;
    let Ok(updater) = app.updater() else { return };
    let Ok(Some(update)) = updater.check().await else { return };
    let _ = app.emit(
        "update-available",
        serde_json::json!({ "version": update.version, "notes": update.body }),
    );
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![install_update])
        .setup(|app| {
            // Pass the OS user-data directory to the server so SQLite is stored
            // in a stable, writable location (e.g. %APPDATA%\planner-app\).
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Cannot resolve app data dir")
                .to_string_lossy()
                .to_string();

            match app.shell().sidecar("planner-server") {
                Ok(cmd) => {
                    let (_rx, child) = cmd
                        .env("DATA_DIR", &data_dir)
                        .env("PORT", "3001")
                        .spawn()
                        .expect("Failed to spawn planner-server sidecar");
                    app.manage(SidecarHandle(Mutex::new(Some(child))));
                    println!("[desktop] sidecar started — API at http://127.0.0.1:3001");
                }
                Err(e) => {
                    // Expected for the no-server build variant.
                    println!("[desktop] no sidecar configured: {e}");
                    app.manage(SidecarHandle(Mutex::new(None)));
                }
            }

            // Check for updates silently in background; emits "update-available" to frontend.
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                check_for_updates(handle).await;
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(handle) = window.app_handle().try_state::<SidecarHandle>() {
                    if let Some(child) = handle.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
