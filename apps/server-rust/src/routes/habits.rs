use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use std::collections::HashMap;
use uuid::Uuid;

use crate::{
    db::{read_all_habits, read_habit_by_id, write_habit},
    models::{normalize_habit_times_per_day, normalize_habit_value_weights, Habit},
    routes::{api_err, api_ok, now_iso},
    AppState,
};

// ── GET /habits ───────────────────────────────────────────────────────────────

pub async fn get_habits(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    api_ok(read_all_habits(&db))
}

// ── POST /habits ──────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct CreateHabitBody {
    pub title: String,
    pub category: Option<String>,
    #[serde(rename = "timesPerDay")]
    pub times_per_day: Option<u32>,
    #[serde(rename = "valueWeights")]
    pub value_weights: Option<Vec<f64>>,
}

pub async fn create_habit(
    State(state): State<AppState>,
    Json(body): Json<CreateHabitBody>,
) -> Response {
    if body.title.trim().is_empty() {
        return api_err(StatusCode::BAD_REQUEST, "title is required");
    }
    let times_per_day = normalize_habit_times_per_day(body.times_per_day);
    let value_weights = normalize_habit_value_weights(times_per_day, body.value_weights);
    let habit = Habit {
        id: Uuid::new_v4().to_string(),
        title: body.title.trim().to_string(),
        category: body.category.and_then(|c| {
            let c = c.trim().to_string();
            if c.is_empty() {
                None
            } else {
                Some(c)
            }
        }),
        active: true,
        created_at: now_iso(),
        times_per_day,
        value_weights,
        completions: HashMap::new(),
    };
    let db = state.db.lock().unwrap();
    write_habit(&db, &habit);
    api_ok(habit)
}

// ── PATCH /habits/:id ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateHabitBody {
    pub title: Option<String>,
    pub category: Option<String>,
    pub active: Option<bool>,
    #[serde(rename = "timesPerDay")]
    pub times_per_day: Option<u32>,
    #[serde(rename = "valueWeights")]
    pub value_weights: Option<Vec<f64>>,
}

pub async fn update_habit(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateHabitBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut habit) = read_habit_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Habit not found: {id}"));
    };
    if let Some(title) = body.title {
        habit.title = title;
    }
    if let Some(category) = body.category {
        let c = category.trim().to_string();
        habit.category = if c.is_empty() { None } else { Some(c) };
    }
    if let Some(active) = body.active {
        habit.active = active;
    }
    if body.times_per_day.is_some() || body.value_weights.is_some() {
        let times_per_day =
            normalize_habit_times_per_day(body.times_per_day.or(Some(habit.times_per_day)));
        let value_weights = normalize_habit_value_weights(
            times_per_day,
            body.value_weights.or(Some(habit.value_weights.clone())),
        );
        habit.times_per_day = times_per_day;
        habit.value_weights = value_weights;
    }
    write_habit(&db, &habit);
    api_ok(habit)
}

// ── POST /habits/:id/completions ──────────────────────────────────────────────

#[derive(Deserialize)]
pub struct MarkDoneBody {
    pub date: String,
}

pub async fn mark_habit_done(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<MarkDoneBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut habit) = read_habit_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Habit not found: {id}"));
    };
    *habit.completions.entry(body.date).or_insert(0) += 1;
    write_habit(&db, &habit);
    api_ok(habit)
}

// ── DELETE /habits/:id/completions/:date ──────────────────────────────────────

pub async fn unmark_habit_done(
    State(state): State<AppState>,
    Path((id, date)): Path<(String, String)>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut habit) = read_habit_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Habit not found: {id}"));
    };
    match habit.completions.get_mut(&date) {
        Some(count) if *count > 1 => *count -= 1,
        Some(_) => {
            habit.completions.remove(&date);
        }
        None => {}
    }
    write_habit(&db, &habit);
    api_ok(habit)
}

// ── POST /habits/:id/archive ──────────────────────────────────────────────────

pub async fn archive_habit(State(state): State<AppState>, Path(id): Path<String>) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut habit) = read_habit_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Habit not found: {id}"));
    };
    habit.active = false;
    write_habit(&db, &habit);
    api_ok(serde_json::Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{init, read_all_habits, read_habit_by_id, write_habit};
    use rusqlite::Connection;
    use std::sync::{Arc, Mutex};

    fn test_state() -> AppState {
        let conn = Connection::open_in_memory().unwrap();
        init(&conn);
        AppState {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    #[tokio::test]
    async fn create_habit_persists_weighted_settings_above_one() {
        let state = test_state();

        let _ = create_habit(
            State(state.clone()),
            Json(CreateHabitBody {
                title: "Escovar os dentes".to_string(),
                category: None,
                times_per_day: Some(3),
                value_weights: Some(vec![5.0, 2.0, 1.0]),
            }),
        )
        .await;

        let db = state.db.lock().unwrap();
        let habits = read_all_habits(&db);
        assert_eq!(habits.len(), 1);
        assert_eq!(habits[0].times_per_day, 3);
        assert_eq!(habits[0].value_weights, vec![5.0, 2.0, 1.0]);
    }

    #[tokio::test]
    async fn update_habit_persists_weighted_settings_above_one() {
        let state = test_state();
        let habit = Habit {
            id: "habit-1".to_string(),
            title: "Anki".to_string(),
            category: None,
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            times_per_day: 1,
            value_weights: vec![1.0],
            completions: HashMap::new(),
        };

        {
            let db = state.db.lock().unwrap();
            write_habit(&db, &habit);
        }

        let _ = update_habit(
            State(state.clone()),
            Path("habit-1".to_string()),
            Json(UpdateHabitBody {
                title: None,
                category: None,
                active: None,
                times_per_day: Some(4),
                value_weights: Some(vec![2.0]),
            }),
        )
        .await;

        let db = state.db.lock().unwrap();
        let updated = read_habit_by_id(&db, "habit-1").unwrap();
        assert_eq!(updated.times_per_day, 4);
        assert_eq!(updated.value_weights, vec![2.0, 2.0, 2.0, 2.0]);
    }

    #[tokio::test]
    async fn mark_and_unmark_habit_changes_numeric_completion_counts() {
        let state = test_state();
        let habit = Habit {
            id: "habit-1".to_string(),
            title: "Anki".to_string(),
            category: None,
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            times_per_day: 3,
            value_weights: vec![5.0, 2.0, 1.0],
            completions: HashMap::new(),
        };

        {
            let db = state.db.lock().unwrap();
            write_habit(&db, &habit);
        }

        for _ in 0..3 {
            let _ = mark_habit_done(
                State(state.clone()),
                Path("habit-1".to_string()),
                Json(MarkDoneBody {
                    date: "2026-04-28".to_string(),
                }),
            )
            .await;
        }

        let _ = unmark_habit_done(
            State(state.clone()),
            Path(("habit-1".to_string(), "2026-04-28".to_string())),
        )
        .await;

        let db = state.db.lock().unwrap();
        let updated = read_habit_by_id(&db, "habit-1").unwrap();
        assert_eq!(updated.completions.get("2026-04-28"), Some(&2));
    }
}
