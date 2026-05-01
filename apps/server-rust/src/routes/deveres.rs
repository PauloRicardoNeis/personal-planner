use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    db::{read_all_deveres, read_dever_by_id, write_dever},
    models::{Dever, DeverCompletion, Priority, RecurrenceConfig},
    routes::{api_err, api_ok, now_iso},
    AppState,
};

// ── GET /deveres ──────────────────────────────────────────────────────────────

pub async fn get_deveres(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    api_ok(read_all_deveres(&db))
}

// ── POST /deveres ─────────────────────────────────────────────────────────────

/// Mirrors DeverInput from @planner/core — discriminated by "type".
#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum CreateDeverBody {
    #[serde(rename = "once")]
    Once {
        title: String,
        fim: Option<String>,
        inicio: Option<String>,
        area: Option<String>,
        priority: Priority,
    },
    #[serde(rename = "cyclic")]
    Cyclic {
        title: String,
        recurrence: RecurrenceConfig,
        inicio: Option<String>,
        fim: Option<String>,
        area: Option<String>,
        priority: Priority,
    },
}

pub async fn create_dever(
    State(state): State<AppState>,
    Json(body): Json<CreateDeverBody>,
) -> Response {
    let id = Uuid::new_v4().to_string();
    let created_at = now_iso();

    let dever = match body {
        CreateDeverBody::Once {
            title,
            fim,
            inicio,
            area,
            priority,
        } => Dever::Once {
            id,
            title: title.trim().to_string(),
            area: area.and_then(|a| {
                let a = a.trim().to_string();
                if a.is_empty() {
                    None
                } else {
                    Some(a)
                }
            }),
            priority,
            active: true,
            inicio: Some(inicio.unwrap_or_else(|| created_at.clone())),
            created_at,
            completions: vec![],
            fim,
        },
        CreateDeverBody::Cyclic {
            title,
            recurrence,
            inicio,
            fim,
            area,
            priority,
        } => Dever::Cyclic {
            id,
            title: title.trim().to_string(),
            area: area.and_then(|a| {
                let a = a.trim().to_string();
                if a.is_empty() {
                    None
                } else {
                    Some(a)
                }
            }),
            priority,
            active: true,
            inicio: Some(inicio.unwrap_or_else(|| created_at.clone())),
            created_at,
            completions: vec![],
            fim,
            recurrence,
        },
    };

    let db = state.db.lock().unwrap();
    write_dever(&db, &dever);
    api_ok(dever)
}

// ── PATCH /deveres/:id ────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateDeverBody {
    pub title: Option<String>,
    pub area: Option<String>,
    pub priority: Option<Priority>,
    pub active: Option<bool>,
}

pub async fn update_dever(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateDeverBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(dever) = read_dever_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Dever not found: {id}"));
    };

    let updated = match dever {
        Dever::Once {
            id,
            mut title,
            mut area,
            mut priority,
            mut active,
            created_at,
            inicio,
            completions,
            fim,
        } => {
            if let Some(t) = body.title {
                title = t;
            }
            if let Some(a) = body.area {
                area = if a.trim().is_empty() { None } else { Some(a) };
            }
            if let Some(p) = body.priority {
                priority = p;
            }
            if let Some(ac) = body.active {
                active = ac;
            }
            Dever::Once {
                id,
                title,
                area,
                priority,
                active,
                created_at,
                inicio,
                completions,
                fim,
            }
        }
        Dever::Cyclic {
            id,
            mut title,
            mut area,
            mut priority,
            mut active,
            created_at,
            inicio,
            fim,
            completions,
            recurrence,
        } => {
            if let Some(t) = body.title {
                title = t;
            }
            if let Some(a) = body.area {
                area = if a.trim().is_empty() { None } else { Some(a) };
            }
            if let Some(p) = body.priority {
                priority = p;
            }
            if let Some(ac) = body.active {
                active = ac;
            }
            Dever::Cyclic {
                id,
                title,
                area,
                priority,
                active,
                created_at,
                inicio,
                fim,
                completions,
                recurrence,
            }
        }
    };

    write_dever(&db, &updated);
    api_ok(updated)
}

// ── POST /deveres/:id/completions ─────────────────────────────────────────────

#[derive(Deserialize)]
pub struct MarkDeverDoneBody {
    #[serde(rename = "occurrenceDate")]
    pub occurrence_date: String,
}

pub async fn mark_dever_done(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<MarkDeverDoneBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(dever) = read_dever_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Dever not found: {id}"));
    };

    // Idempotent: only add if not already present.
    let already_done = dever
        .completions()
        .iter()
        .any(|c| c.occurrence_date == body.occurrence_date);

    let updated = if already_done {
        dever
    } else {
        let mut new_completions = dever.completions().clone();
        new_completions.push(DeverCompletion {
            occurrence_date: body.occurrence_date,
            completed_at: now_iso(),
        });
        match dever {
            Dever::Once {
                id,
                title,
                area,
                priority,
                active,
                created_at,
                inicio,
                fim,
                ..
            } => Dever::Once {
                id,
                title,
                area,
                priority,
                active,
                created_at,
                inicio,
                completions: new_completions,
                fim,
            },
            Dever::Cyclic {
                id,
                title,
                area,
                priority,
                active,
                created_at,
                inicio,
                fim,
                recurrence,
                ..
            } => Dever::Cyclic {
                id,
                title,
                area,
                priority,
                active,
                created_at,
                inicio,
                fim,
                completions: new_completions,
                recurrence,
            },
        }
    };

    write_dever(&db, &updated);
    api_ok(updated)
}

// ── DELETE /deveres/:id/completions/:occurrence_date ──────────────────────────

pub async fn unmark_dever_done(
    State(state): State<AppState>,
    Path((id, occurrence_date)): Path<(String, String)>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(dever) = read_dever_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Dever not found: {id}"));
    };

    let new_completions: Vec<DeverCompletion> = dever
        .completions()
        .iter()
        .filter(|c| c.occurrence_date != occurrence_date)
        .cloned()
        .collect();

    let updated = match dever {
        Dever::Once {
            id,
            title,
            area,
            priority,
            active,
            created_at,
            inicio,
            fim,
            ..
        } => Dever::Once {
            id,
            title,
            area,
            priority,
            active,
            created_at,
            inicio,
            completions: new_completions,
            fim,
        },
        Dever::Cyclic {
            id,
            title,
            area,
            priority,
            active,
            created_at,
            inicio,
            fim,
            recurrence,
            ..
        } => Dever::Cyclic {
            id,
            title,
            area,
            priority,
            active,
            created_at,
            inicio,
            fim,
            completions: new_completions,
            recurrence,
        },
    };

    write_dever(&db, &updated);
    api_ok(updated)
}

// ── POST /deveres/:id/archive ─────────────────────────────────────────────────

pub async fn archive_dever(State(state): State<AppState>, Path(id): Path<String>) -> Response {
    let db = state.db.lock().unwrap();
    let Some(dever) = read_dever_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Dever not found: {id}"));
    };

    let updated = match dever {
        Dever::Once {
            id,
            title,
            area,
            priority,
            created_at,
            inicio,
            completions,
            fim,
            ..
        } => Dever::Once {
            id,
            title,
            area,
            priority,
            active: false,
            created_at,
            inicio,
            completions,
            fim,
        },
        Dever::Cyclic {
            id,
            title,
            area,
            priority,
            created_at,
            inicio,
            fim,
            completions,
            recurrence,
            ..
        } => Dever::Cyclic {
            id,
            title,
            area,
            priority,
            active: false,
            created_at,
            inicio,
            fim,
            completions,
            recurrence,
        },
    };

    write_dever(&db, &updated);
    api_ok(serde_json::Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{read_all_deveres, read_dever_by_id, write_dever},
        routes::test_support::{cyclic_dever, once_dever, test_state},
    };

    #[tokio::test]
    async fn create_get_and_update_once_and_cyclic_deveres() {
        let state = test_state();

        let once_response = create_dever(
            State(state.clone()),
            Json(CreateDeverBody::Once {
                title: "  Pagar boleto  ".to_string(),
                fim: Some("2026-04-30".to_string()),
                inicio: None,
                area: Some("  ".to_string()),
                priority: Priority::Low,
            }),
        )
        .await;
        assert_eq!(once_response.status(), StatusCode::OK);

        let cyclic_response = create_dever(
            State(state.clone()),
            Json(CreateDeverBody::Cyclic {
                title: "  Treinar  ".to_string(),
                recurrence: RecurrenceConfig::Daily,
                inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
                fim: None,
                area: Some(" Saude ".to_string()),
                priority: Priority::High,
            }),
        )
        .await;
        assert_eq!(cyclic_response.status(), StatusCode::OK);
        assert_eq!(
            get_deveres(State(state.clone())).await.status(),
            StatusCode::OK
        );

        let ids: Vec<String> = {
            let db = state.db.lock().unwrap();
            read_all_deveres(&db)
                .into_iter()
                .map(|dever| {
                    match &dever {
                        Dever::Once {
                            title,
                            area,
                            inicio,
                            ..
                        } => {
                            assert_eq!(title, "Pagar boleto");
                            assert_eq!(area, &None);
                            assert!(inicio.is_some());
                        }
                        Dever::Cyclic { title, area, .. } => {
                            assert_eq!(title, "Treinar");
                            assert_eq!(area.as_deref(), Some("Saude"));
                        }
                    }
                    dever.id().to_string()
                })
                .collect()
        };

        let once_id = ids[0].clone();
        let cyclic_id = ids[1].clone();
        let once_update = update_dever(
            State(state.clone()),
            Path(once_id.clone()),
            Json(UpdateDeverBody {
                title: Some("Boleto editado".to_string()),
                area: Some("".to_string()),
                priority: Some(Priority::Medium),
                active: Some(false),
            }),
        )
        .await;
        assert_eq!(once_update.status(), StatusCode::OK);

        let cyclic_update = update_dever(
            State(state.clone()),
            Path(cyclic_id.clone()),
            Json(UpdateDeverBody {
                title: Some("Treino editado".to_string()),
                area: Some(" Corpo ".to_string()),
                priority: Some(Priority::Low),
                active: Some(true),
            }),
        )
        .await;
        assert_eq!(cyclic_update.status(), StatusCode::OK);

        let missing = update_dever(
            State(state.clone()),
            Path("missing".to_string()),
            Json(UpdateDeverBody {
                title: None,
                area: None,
                priority: None,
                active: None,
            }),
        )
        .await;
        assert_eq!(missing.status(), StatusCode::NOT_FOUND);

        let db = state.db.lock().unwrap();
        let updated_once = read_dever_by_id(&db, &once_id).unwrap();
        assert!(!updated_once.active());
        assert_eq!(updated_once.priority(), &Priority::Medium);

        let updated_cyclic = read_dever_by_id(&db, &cyclic_id).unwrap();
        assert_eq!(updated_cyclic.priority(), &Priority::Low);
    }

    #[tokio::test]
    async fn mark_unmark_and_archive_cover_once_cyclic_and_not_found() {
        let state = test_state();
        {
            let db = state.db.lock().unwrap();
            write_dever(&db, &once_dever("once-1", true, Some("2026-04-29")));
            write_dever(&db, &cyclic_dever("cyclic-1", true));
        }

        for id in ["once-1", "cyclic-1"] {
            let mark = mark_dever_done(
                State(state.clone()),
                Path(id.to_string()),
                Json(MarkDeverDoneBody {
                    occurrence_date: "2026-04-29".to_string(),
                }),
            )
            .await;
            assert_eq!(mark.status(), StatusCode::OK);

            let duplicate = mark_dever_done(
                State(state.clone()),
                Path(id.to_string()),
                Json(MarkDeverDoneBody {
                    occurrence_date: "2026-04-29".to_string(),
                }),
            )
            .await;
            assert_eq!(duplicate.status(), StatusCode::OK);

            {
                let db = state.db.lock().unwrap();
                let stored = read_dever_by_id(&db, id).unwrap();
                let count = stored
                    .completions()
                    .iter()
                    .filter(|completion| completion.occurrence_date == "2026-04-29")
                    .count();
                assert_eq!(count, 1);
            }

            let unmark = unmark_dever_done(
                State(state.clone()),
                Path((id.to_string(), "2026-04-29".to_string())),
            )
            .await;
            assert_eq!(unmark.status(), StatusCode::OK);

            let archive = archive_dever(State(state.clone()), Path(id.to_string())).await;
            assert_eq!(archive.status(), StatusCode::OK);

            let db = state.db.lock().unwrap();
            assert!(!read_dever_by_id(&db, id).unwrap().active());
        }

        let missing_mark = mark_dever_done(
            State(state.clone()),
            Path("missing".to_string()),
            Json(MarkDeverDoneBody {
                occurrence_date: "2026-04-29".to_string(),
            }),
        )
        .await;
        assert_eq!(missing_mark.status(), StatusCode::NOT_FOUND);

        let missing_unmark = unmark_dever_done(
            State(state.clone()),
            Path(("missing".to_string(), "2026-04-29".to_string())),
        )
        .await;
        assert_eq!(missing_unmark.status(), StatusCode::NOT_FOUND);

        let missing_archive =
            archive_dever(State(state.clone()), Path("missing".to_string())).await;
        assert_eq!(missing_archive.status(), StatusCode::NOT_FOUND);
    }
}
