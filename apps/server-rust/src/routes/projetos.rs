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
    db::{read_all_projetos, read_projeto_by_id, write_projeto},
    models::{Etapa, EtapaStatus, Projeto, ProjetoStatus, Priority},
    routes::{api_err, api_ok, now_iso},
};

// ── GET /projetos ────────────────────────────────────────────────────────────

pub async fn get_projetos(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    api_ok(read_all_projetos(&db))
}

// ── POST /projetos ───────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct CreateProjetoBody {
    pub title: String,
    pub description: Option<String>,
    pub area: Option<String>,
    pub priority: Priority,
    pub inicio: Option<String>,
    pub fim: Option<String>,
    pub etapas: Option<Vec<CreateEtapaBody>>,
}

#[derive(Deserialize)]
pub struct CreateEtapaBody {
    pub title: String,
    pub description: Option<String>,
    pub deadline: Option<String>,
    #[serde(rename = "effortHours")]
    pub effort_hours: Option<f64>,
    #[serde(rename = "dependsOn")]
    pub depends_on: Option<Vec<String>>,
    pub order: Option<i32>,
}

pub async fn create_projeto(
    State(state): State<AppState>,
    Json(body): Json<CreateProjetoBody>,
) -> Response {
    let created_at = now_iso();
    let etapas: Vec<Etapa> = body
        .etapas
        .unwrap_or_default()
        .into_iter()
        .enumerate()
        .map(|(i, e)| Etapa {
            id: Uuid::new_v4().to_string(),
            title: e.title.trim().to_string(),
            description: e.description.filter(|s| !s.trim().is_empty()),
            status: EtapaStatus::Pending,
            order: e.order.unwrap_or(i as i32),
            deadline: e.deadline,
            effort_hours: e.effort_hours,
            depends_on: e.depends_on.filter(|v| !v.is_empty()),
            completed_at: None,
            created_at: created_at.clone(),
        })
        .collect();

    let projeto = Projeto {
        id: Uuid::new_v4().to_string(),
        title: body.title.trim().to_string(),
        description: body.description.filter(|s| !s.trim().is_empty()),
        area: body.area.and_then(|a| {
            let a = a.trim().to_string();
            if a.is_empty() { None } else { Some(a) }
        }),
        priority: body.priority,
        status: ProjetoStatus::Planning,
        created_at,
        inicio: body.inicio,
        fim: body.fim,
        etapas,
    };

    let db = state.db.lock().unwrap();
    write_projeto(&db, &projeto);
    api_ok(projeto)
}

// ── PATCH /projetos/:id ──────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateProjetoBody {
    pub title: Option<String>,
    pub description: Option<String>,
    pub area: Option<String>,
    pub priority: Option<Priority>,
    pub status: Option<ProjetoStatus>,
    pub inicio: Option<String>,
    pub fim: Option<String>,
}

pub async fn update_projeto(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateProjetoBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut projeto) = read_projeto_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Projeto not found: {id}"));
    };

    if let Some(t) = body.title { projeto.title = t; }
    if let Some(d) = body.description { projeto.description = if d.trim().is_empty() { None } else { Some(d) }; }
    if let Some(a) = body.area { projeto.area = if a.trim().is_empty() { None } else { Some(a) }; }
    if let Some(p) = body.priority { projeto.priority = p; }
    if let Some(s) = body.status { projeto.status = s; }
    if let Some(i) = body.inicio { projeto.inicio = Some(i); }
    if let Some(f) = body.fim { projeto.fim = Some(f); }

    write_projeto(&db, &projeto);
    api_ok(projeto)
}

// ── POST /projetos/:id/archive ───────────────────────────────────────────────

pub async fn archive_projeto(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut projeto) = read_projeto_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Projeto not found: {id}"));
    };
    projeto.status = ProjetoStatus::Archived;
    write_projeto(&db, &projeto);
    api_ok(serde_json::Value::Null)
}

// ── POST /projetos/:id/etapas ────────────────────────────────────────────────

pub async fn add_etapa(
    State(state): State<AppState>,
    Path(projeto_id): Path<String>,
    Json(body): Json<CreateEtapaBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut projeto) = read_projeto_by_id(&db, &projeto_id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Projeto not found: {projeto_id}"));
    };

    let max_order = projeto.etapas.iter().map(|e| e.order).max().unwrap_or(-1);
    let etapa = Etapa {
        id: Uuid::new_v4().to_string(),
        title: body.title.trim().to_string(),
        description: body.description.filter(|s| !s.trim().is_empty()),
        status: EtapaStatus::Pending,
        order: body.order.unwrap_or(max_order + 1),
        deadline: body.deadline,
        effort_hours: body.effort_hours,
        depends_on: body.depends_on.filter(|v| !v.is_empty()),
        completed_at: None,
        created_at: now_iso(),
    };
    projeto.etapas.push(etapa);

    write_projeto(&db, &projeto);
    api_ok(projeto)
}

// ── PATCH /projetos/:id/etapas/:etapa_id ─────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateEtapaBody {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<EtapaStatus>,
    pub deadline: Option<String>,
    #[serde(rename = "effortHours")]
    pub effort_hours: Option<f64>,
    pub order: Option<i32>,
    #[serde(rename = "dependsOn")]
    pub depends_on: Option<Vec<String>>,
}

pub async fn update_etapa(
    State(state): State<AppState>,
    Path((projeto_id, etapa_id)): Path<(String, String)>,
    Json(body): Json<UpdateEtapaBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut projeto) = read_projeto_by_id(&db, &projeto_id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Projeto not found: {projeto_id}"));
    };

    let Some(etapa) = projeto.etapas.iter_mut().find(|e| e.id == etapa_id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Etapa not found: {etapa_id}"));
    };

    let was_done = etapa.status == EtapaStatus::Done;

    if let Some(t) = body.title { etapa.title = t; }
    if let Some(d) = body.description { etapa.description = if d.trim().is_empty() { None } else { Some(d) }; }
    if let Some(s) = body.status {
        // Set completedAt when transitioning to done
        if s == EtapaStatus::Done && !was_done {
            etapa.completed_at = Some(now_iso());
        }
        // Clear completedAt when transitioning away from done
        if s != EtapaStatus::Done && was_done {
            etapa.completed_at = None;
        }
        etapa.status = s;
    }
    if let Some(dl) = body.deadline { etapa.deadline = Some(dl); }
    if let Some(eh) = body.effort_hours { etapa.effort_hours = Some(eh); }
    if let Some(o) = body.order { etapa.order = o; }
    if let Some(deps) = body.depends_on {
        etapa.depends_on = if deps.is_empty() { None } else { Some(deps) };
    }

    write_projeto(&db, &projeto);
    api_ok(projeto)
}

// ── DELETE /projetos/:id/etapas/:etapa_id ────────────────────────────────────

pub async fn remove_etapa(
    State(state): State<AppState>,
    Path((projeto_id, etapa_id)): Path<(String, String)>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut projeto) = read_projeto_by_id(&db, &projeto_id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Projeto not found: {projeto_id}"));
    };

    projeto.etapas.retain(|e| e.id != etapa_id);
    // Remove from dependsOn of remaining etapas
    for etapa in &mut projeto.etapas {
        if let Some(deps) = &mut etapa.depends_on {
            deps.retain(|d| d != &etapa_id);
            if deps.is_empty() {
                etapa.depends_on = None;
            }
        }
    }

    write_projeto(&db, &projeto);
    api_ok(projeto)
}

// ── PUT /projetos/:id/etapas/order ───────────────────────────────────────────

#[derive(Deserialize)]
pub struct ReorderEtapasBody {
    #[serde(rename = "etapaIds")]
    pub etapa_ids: Vec<String>,
}

pub async fn reorder_etapas(
    State(state): State<AppState>,
    Path(projeto_id): Path<String>,
    Json(body): Json<ReorderEtapasBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut projeto) = read_projeto_by_id(&db, &projeto_id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Projeto not found: {projeto_id}"));
    };

    for (i, id) in body.etapa_ids.iter().enumerate() {
        if let Some(etapa) = projeto.etapas.iter_mut().find(|e| &e.id == id) {
            etapa.order = i as i32;
        }
    }

    write_projeto(&db, &projeto);
    api_ok(projeto)
}
