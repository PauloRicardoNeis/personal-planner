use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    AppState,
    db::{read_all_deveres, read_dever_by_id, write_dever},
    models::{Dever, DeverCompletion, Priority, RecurrenceConfig},
    routes::{api_err, api_ok, now_iso},
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
        CreateDeverBody::Once { title, fim, inicio, area, priority } => Dever::Once {
            id,
            title: title.trim().to_string(),
            area: area.and_then(|a| {
                let a = a.trim().to_string();
                if a.is_empty() { None } else { Some(a) }
            }),
            priority,
            active: true,
            inicio: Some(inicio.unwrap_or_else(|| created_at.clone())),
            created_at,
            completions: vec![],
            fim,
        },
        CreateDeverBody::Cyclic { title, recurrence, inicio, fim, area, priority } => Dever::Cyclic {
            id,
            title: title.trim().to_string(),
            area: area.and_then(|a| {
                let a = a.trim().to_string();
                if a.is_empty() { None } else { Some(a) }
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
        Dever::Once { id, mut title, mut area, mut priority, mut active, created_at, inicio, completions, fim } => {
            if let Some(t) = body.title { title = t; }
            if let Some(a) = body.area {
                area = if a.trim().is_empty() { None } else { Some(a) };
            }
            if let Some(p) = body.priority { priority = p; }
            if let Some(ac) = body.active { active = ac; }
            Dever::Once { id, title, area, priority, active, created_at, inicio, completions, fim }
        }
        Dever::Cyclic { id, mut title, mut area, mut priority, mut active, created_at, inicio, fim, completions, recurrence } => {
            if let Some(t) = body.title { title = t; }
            if let Some(a) = body.area {
                area = if a.trim().is_empty() { None } else { Some(a) };
            }
            if let Some(p) = body.priority { priority = p; }
            if let Some(ac) = body.active { active = ac; }
            Dever::Cyclic { id, title, area, priority, active, created_at, inicio, fim, completions, recurrence }
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
            Dever::Once { id, title, area, priority, active, created_at, inicio, fim, .. } => {
                Dever::Once { id, title, area, priority, active, created_at, inicio, completions: new_completions, fim }
            }
            Dever::Cyclic { id, title, area, priority, active, created_at, inicio, fim, recurrence, .. } => {
                Dever::Cyclic { id, title, area, priority, active, created_at, inicio, fim, completions: new_completions, recurrence }
            }
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
        Dever::Once { id, title, area, priority, active, created_at, inicio, fim, .. } => {
            Dever::Once { id, title, area, priority, active, created_at, inicio, completions: new_completions, fim }
        }
        Dever::Cyclic { id, title, area, priority, active, created_at, inicio, fim, recurrence, .. } => {
            Dever::Cyclic { id, title, area, priority, active, created_at, inicio, fim, completions: new_completions, recurrence }
        }
    };

    write_dever(&db, &updated);
    api_ok(updated)
}

// ── POST /deveres/:id/archive ─────────────────────────────────────────────────

pub async fn archive_dever(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(dever) = read_dever_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Dever not found: {id}"));
    };

    let updated = match dever {
        Dever::Once { id, title, area, priority, created_at, inicio, completions, fim, .. } => {
            Dever::Once { id, title, area, priority, active: false, created_at, inicio, completions, fim }
        }
        Dever::Cyclic { id, title, area, priority, created_at, inicio, fim, completions, recurrence, .. } => {
            Dever::Cyclic { id, title, area, priority, active: false, created_at, inicio, fim, completions, recurrence }
        }
    };

    write_dever(&db, &updated);
    api_ok(serde_json::Value::Null)
}
