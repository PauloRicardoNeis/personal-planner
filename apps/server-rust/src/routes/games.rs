use axum::{
    extract::State,
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;

use crate::{
    AppState,
    db::{read_all_games, read_steam_library_settings, replace_games, write_steam_library_settings},
    models::{Game, SteamLibrarySettings, SteamSyncResult},
    routes::{api_err, api_ok, now_iso},
};

pub async fn get_games(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    api_ok(read_all_games(&db))
}

pub async fn get_steam_settings(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    match read_steam_library_settings(&db) {
        Some(settings) => api_ok(settings),
        None => api_ok(serde_json::Value::Null),
    }
}

#[derive(Deserialize)]
pub struct SaveSteamSettingsBody {
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub profile: String,
}

pub async fn save_steam_settings(
    State(state): State<AppState>,
    Json(body): Json<SaveSteamSettingsBody>,
) -> Response {
    let api_key = body.api_key.trim().to_string();
    let profile = body.profile.trim().to_string();
    if api_key.is_empty() || profile.is_empty() {
        return api_err(StatusCode::BAD_REQUEST, "apiKey e profile sao obrigatorios");
    }

    let db = state.db.lock().unwrap();
    let current = read_steam_library_settings(&db);
    let same_credentials = current
        .as_ref()
        .map(|settings| settings.api_key == api_key && settings.profile == profile)
        .unwrap_or(false);

    let next = SteamLibrarySettings {
        api_key,
        profile,
        resolved_steam_id: if same_credentials {
            current.and_then(|settings| settings.resolved_steam_id)
        } else {
            None
        },
        last_synced_at: if same_credentials {
            read_steam_library_settings(&db).and_then(|settings| settings.last_synced_at)
        } else {
            None
        },
    };

    write_steam_library_settings(&db, &next);
    api_ok(next)
}

pub async fn sync_steam(State(state): State<AppState>) -> Response {
    let settings = {
        let db = state.db.lock().unwrap();
        read_steam_library_settings(&db)
    };

    let Some(settings) = settings else {
        return api_err(StatusCode::BAD_REQUEST, "Salve a chave da Steam e o perfil antes de sincronizar.");
    };

    let client = reqwest::Client::new();
    let resolved_steam_id = match resolve_steam_id(&client, &settings.api_key, &settings.profile).await {
        Ok(steam_id) => steam_id,
        Err(message) => return api_err(StatusCode::BAD_REQUEST, &message),
    };

    let owned_games = match fetch_owned_games(&client, &settings.api_key, &resolved_steam_id).await {
        Ok(response) => response,
        Err(message) => return api_err(StatusCode::BAD_GATEWAY, &message),
    };

    let synced_at = now_iso();
    let sync_result = match normalize_owned_games(owned_games, &synced_at, resolved_steam_id.clone()) {
        Ok(result) => result,
        Err(message) => return api_err(StatusCode::BAD_GATEWAY, &message),
    };

    {
        let db = state.db.lock().unwrap();
        replace_games(&db, &sync_result.games);
        write_steam_library_settings(&db, &SteamLibrarySettings {
            api_key: settings.api_key,
            profile: settings.profile,
            resolved_steam_id: Some(resolved_steam_id),
            last_synced_at: Some(sync_result.synced_at.clone()),
        });
    }

    api_ok(sync_result)
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

async fn fetch_owned_games(
    client: &reqwest::Client,
    api_key: &str,
    steam_id: &str,
) -> Result<OwnedGamesEnvelope, String> {
    let response = client
        .get("https://partner.steam-api.com/IPlayerService/GetOwnedGames/v1/")
        .query(&[
            ("key", api_key),
            ("steamid", steam_id),
            ("include_appinfo", "true"),
            ("include_played_free_games", "true"),
        ])
        .send()
        .await
        .map_err(|e| format!("Falha ao buscar biblioteca Steam: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Steam respondeu {} ao buscar a biblioteca.", response.status()));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Resposta invalida da biblioteca Steam: {e}"))
}

fn normalize_owned_games(
    payload: OwnedGamesEnvelope,
    synced_at: &str,
    resolved_steam_id: String,
) -> Result<SteamSyncResult, String> {
    let raw_games = match (payload.response.games, payload.response.game_count) {
        (Some(games), _) => games,
        (None, Some(0)) => Vec::new(),
        (None, _) => {
            return Err("A Steam nao retornou jogos visiveis. Confira a privacidade da biblioteca.".to_string());
        }
    };

    let mut games: Vec<Game> = raw_games
        .into_iter()
        .filter_map(|game| {
            let name = game.name?.trim().to_string();
            if game.appid == 0 || name.is_empty() {
                return None;
            }

            Some(Game {
                id: format!("steam:{}", game.appid),
                source: "steam".to_string(),
                steam_app_id: game.appid,
                name,
                playtime_minutes: game.playtime_forever.unwrap_or(0),
                icon_hash: game.img_icon_url.filter(|value| !value.trim().is_empty()),
                logo_hash: game.img_logo_url.filter(|value| !value.trim().is_empty()),
                last_imported_at: synced_at.to_string(),
            })
        })
        .collect();

    games.sort_by(|a, b| {
        b.playtime_minutes
            .cmp(&a.playtime_minutes)
            .then_with(|| a.name.cmp(&b.name))
    });

    Ok(SteamSyncResult {
        imported_count: games.len(),
        games,
        synced_at: synced_at.to_string(),
        resolved_steam_id,
    })
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

#[derive(Deserialize)]
struct OwnedGamesEnvelope {
    response: OwnedGamesResponse,
}

#[derive(Deserialize)]
struct OwnedGamesResponse {
    game_count: Option<u32>,
    games: Option<Vec<OwnedGame>>,
}

#[derive(Deserialize)]
struct OwnedGame {
    appid: u32,
    name: Option<String>,
    playtime_forever: Option<u32>,
    img_icon_url: Option<String>,
    img_logo_url: Option<String>,
}
