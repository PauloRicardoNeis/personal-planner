// Prevents additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;

/// Holds the sidecar child handle so we can kill it on window close.
struct SidecarHandle(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

/// Spawns the desktop build process and emits events when it finishes.
#[tauri::command]
async fn build_installer(app: tauri::AppHandle, with_server: bool) -> Result<(), String> {
    let project_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent() // desktop
        .and_then(|p| p.parent()) // apps
        .and_then(|p| p.parent()) // root
        .ok_or("Cannot resolve project root")?
        .to_path_buf();

    let script = if with_server {
        "build:desktop-with-server"
    } else {
        "build:desktop-no-server"
    };

    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let _ = handle.emit("build-status", serde_json::json!({ "stage": "running" }));

        let output = std::process::Command::new("cmd")
            .args(["/C", &format!("pnpm run {script}")])
            .current_dir(&project_root)
            .output();

        match output {
            Ok(out) if out.status.success() => {
                let _ = handle.emit("build-status", serde_json::json!({
                    "stage": "done",
                    "message": "Instalador gerado com sucesso!"
                }));
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                let _ = handle.emit("build-status", serde_json::json!({
                    "stage": "error",
                    "message": format!("Build falhou: {stderr}")
                }));
            }
            Err(e) => {
                let _ = handle.emit("build-status", serde_json::json!({
                    "stage": "error",
                    "message": format!("Erro ao iniciar build: {e}")
                }));
            }
        }
    });

    Ok(())
}

#[derive(Serialize)]
struct DesktopSteamSyncPayload {
    #[serde(rename = "resolvedSteamId")]
    resolved_steam_id: String,
    #[serde(rename = "ownedGamesResponse")]
    owned_games_response: serde_json::Value,
}

#[derive(Deserialize)]
struct ResolveVanityEnvelope {
    response: ResolveVanityResponse,
}

#[derive(Deserialize)]
struct ResolveVanityResponse {
    success: u32,
    steamid: Option<String>,
    message: Option<String>,
}

enum ParsedSteamProfile {
    SteamId(String),
    Vanity(String),
}

fn parse_steam_profile(profile: &str) -> Option<ParsedSteamProfile> {
    let trimmed = profile.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Ok(url) = reqwest::Url::parse(trimmed) {
        if url.host_str().unwrap_or_default().contains("steamcommunity.com") {
            let parts: Vec<&str> = url.path_segments().into_iter().flatten().collect();
            if parts.len() >= 2 && parts[0] == "profiles" && parts[1].chars().all(|c| c.is_ascii_digit()) {
                return Some(ParsedSteamProfile::SteamId(parts[1].to_string()));
            }
            if parts.len() >= 2 && parts[0] == "id" && !parts[1].is_empty() {
                return Some(ParsedSteamProfile::Vanity(parts[1].to_string()));
            }
        }
    }

    if trimmed.chars().all(|c| c.is_ascii_digit()) {
        return Some(ParsedSteamProfile::SteamId(trimmed.to_string()));
    }

    let vanity = trimmed.trim_start_matches('@').trim();
    if vanity.is_empty() {
        None
    } else {
        Some(ParsedSteamProfile::Vanity(vanity.to_string()))
    }
}

async fn resolve_steam_id(client: &reqwest::Client, api_key: &str, profile: &str) -> Result<String, String> {
    match parse_steam_profile(profile) {
        Some(ParsedSteamProfile::SteamId(steam_id)) => Ok(steam_id),
        Some(ParsedSteamProfile::Vanity(vanity)) => {
            let response = client
                .get("https://partner.steam-api.com/ISteamUser/ResolveVanityURL/v1/")
                .query(&[("key", api_key), ("vanityurl", vanity.as_str())])
                .send()
                .await
                .map_err(|e| format!("Falha ao resolver perfil Steam: {e}"))?;

            if !response.status().is_success() {
                return Err(format!("Steam respondeu {} ao resolver o perfil.", response.status()));
            }

            let body: ResolveVanityEnvelope = response
                .json()
                .await
                .map_err(|e| format!("Resposta invalida ao resolver vanity URL: {e}"))?;

            if body.response.success == 1 {
                body.response
                    .steamid
                    .ok_or_else(|| "Steam nao retornou SteamID para o perfil informado.".to_string())
            } else {
                Err(body
                    .response
                    .message
                    .unwrap_or_else(|| "Nao foi possivel resolver o perfil Steam informado.".to_string()))
            }
        }
        None => Err("Informe um perfil Steam valido.".to_string()),
    }
}

#[tauri::command]
async fn sync_steam_library(api_key: String, profile: String) -> Result<DesktopSteamSyncPayload, String> {
    let api_key = api_key.trim().to_string();
    let profile = profile.trim().to_string();
    if api_key.is_empty() || profile.is_empty() {
        return Err("Preencha a chave da Steam e o perfil antes de sincronizar.".to_string());
    }

    let client = reqwest::Client::new();
    let resolved_steam_id = resolve_steam_id(&client, &api_key, &profile).await?;

    let response = client
        .get("https://partner.steam-api.com/IPlayerService/GetOwnedGames/v1/")
        .query(&[
            ("key", api_key.as_str()),
            ("steamid", resolved_steam_id.as_str()),
            ("include_appinfo", "true"),
            ("include_played_free_games", "true"),
        ])
        .send()
        .await
        .map_err(|e| format!("Falha ao buscar biblioteca Steam: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Steam respondeu {} ao buscar a biblioteca.", response.status()));
    }

    let owned_games_response = response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Resposta invalida da biblioteca Steam: {e}"))?;

    Ok(DesktopSteamSyncPayload {
        resolved_steam_id,
        owned_games_response,
    })
}

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
        .invoke_handler(tauri::generate_handler![install_update, build_installer, sync_steam_library])
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
                    match cmd
                        .env("DATA_DIR", &data_dir)
                        .env("PORT", "3001")
                        .spawn()
                    {
                        Ok((_rx, child)) => {
                            app.manage(SidecarHandle(Mutex::new(Some(child))));
                            println!("[desktop] sidecar started — API at http://127.0.0.1:3001");
                        }
                        Err(e) => {
                            eprintln!("[desktop] failed to spawn sidecar: {e}");
                            app.manage(SidecarHandle(Mutex::new(None)));
                        }
                    }
                }
                Err(e) => {
                    // Expected for the no-server build variant or dev mode.
                    println!("[desktop] no sidecar configured: {e}");
                    app.manage(SidecarHandle(Mutex::new(None)));
                }
            }

            // Open devtools for debugging
            if let Some(w) = app.get_webview_window("main") {
                w.open_devtools();
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
