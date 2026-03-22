// Prevents additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

/// Holds the sidecar child handle so we can kill it on window close.
struct SidecarHandle(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
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
