use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use std::collections::HashMap;

use crate::{
    AppState,
    db::{read_all_habits, read_habit_by_id, write_habit},
    models::Habit,
    routes::{api_err, api_ok, now_iso},
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
}

pub async fn create_habit(
    State(state): State<AppState>,
    Json(body): Json<CreateHabitBody>,
) -> Response {
    if body.title.trim().is_empty() {
        return api_err(StatusCode::BAD_REQUEST, "title is required");
    }
    let habit = Habit {
        id: Uuid::new_v4().to_string(),
        title: body.title.trim().to_string(),
        category: body.category.and_then(|c| {
            let c = c.trim().to_string();
            if c.is_empty() { None } else { Some(c) }
        }),
        active: true,
        created_at: now_iso(),
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
    habit.completions.insert(body.date, true);
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
    habit.completions.remove(&date);
    write_habit(&db, &habit);
    api_ok(habit)
}

// ── POST /habits/:id/archive ──────────────────────────────────────────────────

pub async fn archive_habit(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut habit) = read_habit_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Habit not found: {id}"));
    };
    habit.active = false;
    write_habit(&db, &habit);
    api_ok(serde_json::Value::Null)
}
