use axum::{extract::State, http::StatusCode, response::Response, Json};
use serde::Deserialize;

use crate::{
    db::{
        read_all_games, read_steam_library_settings, replace_games, write_steam_library_settings,
    },
    models::{Game, SteamLibrarySettings, SteamSyncResult},
    routes::{api_err, api_ok, now_iso},
    AppState,
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
        return api_err(
            StatusCode::BAD_REQUEST,
            "Salve a chave da Steam e o perfil antes de sincronizar.",
        );
    };

    let client = reqwest::Client::new();
    let resolved_steam_id =
        match resolve_steam_id(&client, &settings.api_key, &settings.profile).await {
            Ok(steam_id) => steam_id,
            Err(message) => return api_err(StatusCode::BAD_REQUEST, &message),
        };

    let owned_games = match fetch_owned_games(&client, &settings.api_key, &resolved_steam_id).await
    {
        Ok(response) => response,
        Err(message) => return api_err(StatusCode::BAD_GATEWAY, &message),
    };

    let synced_at = now_iso();
    let sync_result =
        match normalize_owned_games(owned_games, &synced_at, resolved_steam_id.clone()) {
            Ok(result) => result,
            Err(message) => return api_err(StatusCode::BAD_GATEWAY, &message),
        };

    {
        let db = state.db.lock().unwrap();
        replace_games(&db, &sync_result.games);
        write_steam_library_settings(
            &db,
            &SteamLibrarySettings {
                api_key: settings.api_key,
                profile: settings.profile,
                resolved_steam_id: Some(resolved_steam_id),
                last_synced_at: Some(sync_result.synced_at.clone()),
            },
        );
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
        if url
            .host_str()
            .unwrap_or_default()
            .contains("steamcommunity.com")
        {
            let parts: Vec<&str> = url.path_segments().into_iter().flatten().collect();
            if parts.len() >= 2
                && parts[0] == "profiles"
                && parts[1].chars().all(|c| c.is_ascii_digit())
            {
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

async fn resolve_steam_id(
    client: &reqwest::Client,
    api_key: &str,
    profile: &str,
) -> Result<String, String> {
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
                return Err(format!(
                    "Steam respondeu {} ao resolver o perfil.",
                    response.status()
                ));
            }

            let body: ResolveVanityEnvelope = response
                .json()
                .await
                .map_err(|e| format!("Resposta invalida ao resolver vanity URL: {e}"))?;

            if body.response.success == 1 {
                body.response.steamid.ok_or_else(|| {
                    "Steam nao retornou SteamID para o perfil informado.".to_string()
                })
            } else {
                Err(body.response.message.unwrap_or_else(|| {
                    "Nao foi possivel resolver o perfil Steam informado.".to_string()
                }))
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
        return Err(format!(
            "Steam respondeu {} ao buscar a biblioteca.",
            response.status()
        ));
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
            return Err(
                "A Steam nao retornou jogos visiveis. Confira a privacidade da biblioteca."
                    .to_string(),
            );
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{read_steam_library_settings, replace_games, write_steam_library_settings},
        routes::test_support::{response_json, test_state},
    };

    #[test]
    fn parse_steam_profile_accepts_ids_urls_and_vanity_names() {
        match parse_steam_profile("76561198000000000").unwrap() {
            ParsedSteamProfile::SteamId(value) => assert_eq!(value, "76561198000000000"),
            ParsedSteamProfile::Vanity(_) => panic!("expected steam id"),
        }

        match parse_steam_profile("https://steamcommunity.com/profiles/76561198000000001/").unwrap()
        {
            ParsedSteamProfile::SteamId(value) => assert_eq!(value, "76561198000000001"),
            ParsedSteamProfile::Vanity(_) => panic!("expected steam id"),
        }

        match parse_steam_profile("https://steamcommunity.com/id/planner-user/").unwrap() {
            ParsedSteamProfile::Vanity(value) => assert_eq!(value, "planner-user"),
            ParsedSteamProfile::SteamId(_) => panic!("expected vanity"),
        }

        match parse_steam_profile("@planner-user").unwrap() {
            ParsedSteamProfile::Vanity(value) => assert_eq!(value, "planner-user"),
            ParsedSteamProfile::SteamId(_) => panic!("expected vanity"),
        }

        assert!(parse_steam_profile("  ").is_none());
    }

    #[test]
    fn normalize_owned_games_filters_sorts_and_reports_empty_or_private_libraries() {
        let result = normalize_owned_games(
            OwnedGamesEnvelope {
                response: OwnedGamesResponse {
                    game_count: Some(5),
                    games: Some(vec![
                        OwnedGame {
                            appid: 10,
                            name: Some("B Game".to_string()),
                            playtime_forever: Some(100),
                            img_icon_url: Some("icon".to_string()),
                            img_logo_url: Some("".to_string()),
                        },
                        OwnedGame {
                            appid: 20,
                            name: Some("A Game".to_string()),
                            playtime_forever: Some(100),
                            img_icon_url: Some(" ".to_string()),
                            img_logo_url: Some("logo".to_string()),
                        },
                        OwnedGame {
                            appid: 30,
                            name: None,
                            playtime_forever: Some(200),
                            img_icon_url: None,
                            img_logo_url: None,
                        },
                        OwnedGame {
                            appid: 0,
                            name: Some("Invalid".to_string()),
                            playtime_forever: Some(300),
                            img_icon_url: None,
                            img_logo_url: None,
                        },
                        OwnedGame {
                            appid: 40,
                            name: Some("   ".to_string()),
                            playtime_forever: None,
                            img_icon_url: None,
                            img_logo_url: None,
                        },
                    ]),
                },
            },
            "2026-04-29T00:00:00.000Z",
            "765".to_string(),
        )
        .unwrap();

        assert_eq!(result.imported_count, 2);
        assert_eq!(result.games[0].name, "A Game");
        assert_eq!(result.games[1].name, "B Game");
        assert_eq!(result.games[1].icon_hash.as_deref(), Some("icon"));
        assert_eq!(result.games[0].logo_hash.as_deref(), Some("logo"));

        let empty = normalize_owned_games(
            OwnedGamesEnvelope {
                response: OwnedGamesResponse {
                    game_count: Some(0),
                    games: None,
                },
            },
            "2026-04-29T00:00:00.000Z",
            "765".to_string(),
        )
        .unwrap();
        assert!(empty.games.is_empty());

        let private = normalize_owned_games(
            OwnedGamesEnvelope {
                response: OwnedGamesResponse {
                    game_count: None,
                    games: None,
                },
            },
            "2026-04-29T00:00:00.000Z",
            "765".to_string(),
        );
        assert!(private.is_err());
    }

    #[tokio::test]
    async fn game_and_settings_handlers_cover_validation_and_persistence() {
        let state = test_state();

        let empty_settings = response_json(get_steam_settings(State(state.clone())).await).await;
        assert!(empty_settings["data"].is_null());

        let invalid = save_steam_settings(
            State(state.clone()),
            Json(SaveSteamSettingsBody {
                api_key: " ".to_string(),
                profile: "profile".to_string(),
            }),
        )
        .await;
        assert_eq!(invalid.status(), StatusCode::BAD_REQUEST);

        {
            let db = state.db.lock().unwrap();
            write_steam_library_settings(
                &db,
                &SteamLibrarySettings {
                    api_key: "key".to_string(),
                    profile: "profile".to_string(),
                    resolved_steam_id: Some("765".to_string()),
                    last_synced_at: Some("2026-04-29T00:00:00.000Z".to_string()),
                },
            );
        }

        let same = save_steam_settings(
            State(state.clone()),
            Json(SaveSteamSettingsBody {
                api_key: " key ".to_string(),
                profile: " profile ".to_string(),
            }),
        )
        .await;
        assert_eq!(same.status(), StatusCode::OK);
        {
            let db = state.db.lock().unwrap();
            let stored = read_steam_library_settings(&db).unwrap();
            assert_eq!(stored.resolved_steam_id.as_deref(), Some("765"));
            assert_eq!(
                stored.last_synced_at.as_deref(),
                Some("2026-04-29T00:00:00.000Z")
            );
        }

        let changed = save_steam_settings(
            State(state.clone()),
            Json(SaveSteamSettingsBody {
                api_key: "new-key".to_string(),
                profile: "profile".to_string(),
            }),
        )
        .await;
        assert_eq!(changed.status(), StatusCode::OK);
        {
            let db = state.db.lock().unwrap();
            let stored = read_steam_library_settings(&db).unwrap();
            assert_eq!(stored.api_key, "new-key");
            assert_eq!(stored.resolved_steam_id, None);
            replace_games(
                &db,
                &[Game {
                    id: "steam:10".to_string(),
                    source: "steam".to_string(),
                    steam_app_id: 10,
                    name: "Game".to_string(),
                    playtime_minutes: 50,
                    icon_hash: None,
                    logo_hash: None,
                    last_imported_at: "2026-04-29T00:00:00.000Z".to_string(),
                }],
            );
        }

        let games = response_json(get_games(State(state.clone())).await).await;
        assert_eq!(games["data"].as_array().unwrap().len(), 1);
    }

    #[tokio::test]
    async fn sync_steam_requires_saved_settings_before_network_call() {
        let state = test_state();
        let response = sync_steam(State(state.clone())).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn resolve_steam_id_returns_numeric_profiles_without_network() {
        let client = reqwest::Client::new();
        let steam_id = resolve_steam_id(&client, "key", "76561198000000000")
            .await
            .unwrap();

        assert_eq!(steam_id, "76561198000000000");
    }
}
