use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    db::{
        delete_diary_entry, read_diary_entries_by_date, read_diary_entry_by_id, write_diary_entry,
    },
    models::{DiaryEntry, NutrientsPer100g},
    routes::{api_err, api_ok, now_iso},
    AppState,
};

// ── GET /diary?date=YYYY-MM-DD ───────────────────────────────────────────────

#[derive(Deserialize)]
pub struct DiaryQuery {
    pub date: String,
}

pub async fn get_diary(State(state): State<AppState>, Query(query): Query<DiaryQuery>) -> Response {
    if chrono::NaiveDate::parse_from_str(&query.date, "%Y-%m-%d").is_err() {
        return api_err(StatusCode::BAD_REQUEST, "date must be YYYY-MM-DD");
    }
    let db = state.db.lock().unwrap();
    api_ok(read_diary_entries_by_date(&db, &query.date))
}

// ── POST /diary ──────────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum CreateDiaryEntryBody {
    #[serde(rename = "food")]
    Food {
        date: String,
        #[serde(rename = "foodId")]
        food_id: String,
        grams: f64,
        meal: Option<String>,
    },
    #[serde(rename = "quick")]
    Quick {
        date: String,
        description: String,
        grams: f64,
        nutrients: NutrientsPer100g,
        meal: Option<String>,
    },
}

pub async fn create_diary_entry(
    State(state): State<AppState>,
    Json(body): Json<CreateDiaryEntryBody>,
) -> Response {
    let id = Uuid::new_v4().to_string();
    let created_at = now_iso();

    let entry = match body {
        CreateDiaryEntryBody::Food {
            date,
            food_id,
            grams,
            meal,
        } => DiaryEntry::Food {
            id,
            date,
            food_id,
            grams,
            meal,
            created_at,
        },
        CreateDiaryEntryBody::Quick {
            date,
            description,
            grams,
            nutrients,
            meal,
        } => DiaryEntry::Quick {
            id,
            date,
            description,
            grams,
            nutrients,
            meal,
            created_at,
        },
    };

    let db = state.db.lock().unwrap();
    write_diary_entry(&db, &entry);
    api_ok(entry)
}

// ── PATCH /diary/:id ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateDiaryEntryBody {
    pub grams: Option<f64>,
    pub meal: Option<String>,
}

pub async fn update_diary_entry(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateDiaryEntryBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(entry) = read_diary_entry_by_id(&db, &id) else {
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Diary entry not found: {id}"),
        );
    };

    let updated = match entry {
        DiaryEntry::Food {
            id,
            date,
            food_id,
            mut grams,
            mut meal,
            created_at,
        } => {
            if let Some(g) = body.grams {
                grams = g;
            }
            if let Some(m) = body.meal {
                meal = Some(m);
            }
            DiaryEntry::Food {
                id,
                date,
                food_id,
                grams,
                meal,
                created_at,
            }
        }
        DiaryEntry::Quick {
            id,
            date,
            description,
            mut grams,
            nutrients,
            mut meal,
            created_at,
        } => {
            if let Some(g) = body.grams {
                grams = g;
            }
            if let Some(m) = body.meal {
                meal = Some(m);
            }
            DiaryEntry::Quick {
                id,
                date,
                description,
                grams,
                nutrients,
                meal,
                created_at,
            }
        }
    };

    write_diary_entry(&db, &updated);
    api_ok(updated)
}

// ── DELETE /diary/:id ────────────────────────────────────────────────────────

pub async fn delete_diary_entry_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(_) = read_diary_entry_by_id(&db, &id) else {
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Diary entry not found: {id}"),
        );
    };
    delete_diary_entry(&db, &id);
    api_ok(serde_json::Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{read_diary_entries_by_date, read_diary_entry_by_id},
        routes::test_support::{nutrients, response_json, test_state},
    };

    #[tokio::test]
    async fn diary_handlers_create_filter_update_and_delete_entries() {
        let state = test_state();

        let invalid = get_diary(
            State(state.clone()),
            Query(DiaryQuery {
                date: "29-04-2026".to_string(),
            }),
        )
        .await;
        assert_eq!(invalid.status(), StatusCode::BAD_REQUEST);

        let created_food = create_diary_entry(
            State(state.clone()),
            Json(CreateDiaryEntryBody::Food {
                date: "2026-04-29".to_string(),
                food_id: "food-1".to_string(),
                grams: 120.0,
                meal: Some("lunch".to_string()),
            }),
        )
        .await;
        assert_eq!(created_food.status(), StatusCode::OK);

        let created_quick = create_diary_entry(
            State(state.clone()),
            Json(CreateDiaryEntryBody::Quick {
                date: "2026-04-29".to_string(),
                description: "Cafe".to_string(),
                grams: 80.0,
                nutrients: nutrients(),
                meal: None,
            }),
        )
        .await;
        assert_eq!(created_quick.status(), StatusCode::OK);

        let list = response_json(
            get_diary(
                State(state.clone()),
                Query(DiaryQuery {
                    date: "2026-04-29".to_string(),
                }),
            )
            .await,
        )
        .await;
        assert_eq!(list["data"].as_array().unwrap().len(), 2);

        let ids: Vec<String> = {
            let db = state.db.lock().unwrap();
            read_diary_entries_by_date(&db, "2026-04-29")
                .into_iter()
                .map(|entry| entry.id().to_string())
                .collect()
        };

        for id in &ids {
            let update = update_diary_entry(
                State(state.clone()),
                Path(id.clone()),
                Json(UpdateDiaryEntryBody {
                    grams: Some(200.0),
                    meal: Some("dinner".to_string()),
                }),
            )
            .await;
            assert_eq!(update.status(), StatusCode::OK);

            let db = state.db.lock().unwrap();
            match read_diary_entry_by_id(&db, id).unwrap() {
                DiaryEntry::Food { grams, meal, .. } | DiaryEntry::Quick { grams, meal, .. } => {
                    assert_eq!(grams, 200.0);
                    assert_eq!(meal.as_deref(), Some("dinner"));
                }
            }
        }

        let missing_update = update_diary_entry(
            State(state.clone()),
            Path("missing".to_string()),
            Json(UpdateDiaryEntryBody {
                grams: None,
                meal: None,
            }),
        )
        .await;
        assert_eq!(missing_update.status(), StatusCode::NOT_FOUND);

        let deleted = delete_diary_entry_handler(State(state.clone()), Path(ids[0].clone())).await;
        assert_eq!(deleted.status(), StatusCode::OK);
        {
            let db = state.db.lock().unwrap();
            assert!(read_diary_entry_by_id(&db, &ids[0]).is_none());
        }

        let missing_delete =
            delete_diary_entry_handler(State(state.clone()), Path("missing".to_string())).await;
        assert_eq!(missing_delete.status(), StatusCode::NOT_FOUND);
    }
}
