use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    db::{read_all_projetos, read_projeto_by_id, write_projeto},
    models::{Etapa, EtapaStatus, Priority, Projeto, ProjetoStatus},
    routes::{api_err, api_ok, now_iso},
    AppState,
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
            if a.is_empty() {
                None
            } else {
                Some(a)
            }
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

    if let Some(t) = body.title {
        projeto.title = t;
    }
    if let Some(d) = body.description {
        projeto.description = if d.trim().is_empty() { None } else { Some(d) };
    }
    if let Some(a) = body.area {
        projeto.area = if a.trim().is_empty() { None } else { Some(a) };
    }
    if let Some(p) = body.priority {
        projeto.priority = p;
    }
    if let Some(s) = body.status {
        projeto.status = s;
    }
    if let Some(i) = body.inicio {
        projeto.inicio = Some(i);
    }
    if let Some(f) = body.fim {
        projeto.fim = Some(f);
    }

    write_projeto(&db, &projeto);
    api_ok(projeto)
}

// ── POST /projetos/:id/archive ───────────────────────────────────────────────

pub async fn archive_projeto(State(state): State<AppState>, Path(id): Path<String>) -> Response {
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
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Projeto not found: {projeto_id}"),
        );
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
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Projeto not found: {projeto_id}"),
        );
    };

    let Some(etapa) = projeto.etapas.iter_mut().find(|e| e.id == etapa_id) else {
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Etapa not found: {etapa_id}"),
        );
    };

    let was_done = etapa.status == EtapaStatus::Done;

    if let Some(t) = body.title {
        etapa.title = t;
    }
    if let Some(d) = body.description {
        etapa.description = if d.trim().is_empty() { None } else { Some(d) };
    }
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
    if let Some(dl) = body.deadline {
        etapa.deadline = Some(dl);
    }
    if let Some(eh) = body.effort_hours {
        etapa.effort_hours = Some(eh);
    }
    if let Some(o) = body.order {
        etapa.order = o;
    }
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
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Projeto not found: {projeto_id}"),
        );
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
        return api_err(
            StatusCode::NOT_FOUND,
            &format!("Projeto not found: {projeto_id}"),
        );
    };

    for (i, id) in body.etapa_ids.iter().enumerate() {
        if let Some(etapa) = projeto.etapas.iter_mut().find(|e| &e.id == id) {
            etapa.order = i as i32;
        }
    }

    write_projeto(&db, &projeto);
    api_ok(projeto)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{read_all_projetos, read_projeto_by_id, write_projeto},
        routes::test_support::{projeto, response_json, test_state},
    };

    #[tokio::test]
    async fn create_get_update_and_archive_projetos() {
        let state = test_state();

        let created = create_projeto(
            State(state.clone()),
            Json(CreateProjetoBody {
                title: "  Projeto novo  ".to_string(),
                description: Some("   ".to_string()),
                area: Some(" ".to_string()),
                priority: Priority::Low,
                inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
                fim: Some("2026-05-01".to_string()),
                etapas: Some(vec![
                    CreateEtapaBody {
                        title: " Primeira ".to_string(),
                        description: Some(" ".to_string()),
                        deadline: None,
                        effort_hours: None,
                        depends_on: Some(vec![]),
                        order: None,
                    },
                    CreateEtapaBody {
                        title: " Segunda ".to_string(),
                        description: Some("Descricao".to_string()),
                        deadline: Some("2026-04-20".to_string()),
                        effort_hours: Some(2.5),
                        depends_on: Some(vec!["etapa-anterior".to_string()]),
                        order: Some(5),
                    },
                ]),
            }),
        )
        .await;
        assert_eq!(created.status(), StatusCode::OK);

        let list = response_json(get_projetos(State(state.clone())).await).await;
        assert_eq!(list["data"].as_array().unwrap().len(), 1);

        let projeto_id = {
            let db = state.db.lock().unwrap();
            let stored = read_all_projetos(&db);
            assert_eq!(stored[0].title, "Projeto novo");
            assert_eq!(stored[0].description, None);
            assert_eq!(stored[0].area, None);
            assert_eq!(stored[0].status, ProjetoStatus::Planning);
            assert_eq!(stored[0].etapas[0].title, "Primeira");
            assert_eq!(stored[0].etapas[0].description, None);
            assert_eq!(stored[0].etapas[0].depends_on, None);
            assert_eq!(stored[0].etapas[1].order, 5);
            stored[0].id.clone()
        };

        let updated = update_projeto(
            State(state.clone()),
            Path(projeto_id.clone()),
            Json(UpdateProjetoBody {
                title: Some("Projeto editado".to_string()),
                description: Some("Descricao editada".to_string()),
                area: Some("Trabalho".to_string()),
                priority: Some(Priority::High),
                status: Some(ProjetoStatus::Active),
                inicio: Some("2026-04-02T00:00:00.000Z".to_string()),
                fim: Some("2026-05-02".to_string()),
            }),
        )
        .await;
        assert_eq!(updated.status(), StatusCode::OK);

        {
            let db = state.db.lock().unwrap();
            let stored = read_projeto_by_id(&db, &projeto_id).unwrap();
            assert_eq!(stored.title, "Projeto editado");
            assert_eq!(stored.description.as_deref(), Some("Descricao editada"));
            assert_eq!(stored.area.as_deref(), Some("Trabalho"));
            assert_eq!(stored.priority, Priority::High);
            assert_eq!(stored.status, ProjetoStatus::Active);
        }

        let missing_update = update_projeto(
            State(state.clone()),
            Path("missing".to_string()),
            Json(UpdateProjetoBody {
                title: None,
                description: None,
                area: None,
                priority: None,
                status: None,
                inicio: None,
                fim: None,
            }),
        )
        .await;
        assert_eq!(missing_update.status(), StatusCode::NOT_FOUND);

        let archive = archive_projeto(State(state.clone()), Path(projeto_id.clone())).await;
        assert_eq!(archive.status(), StatusCode::OK);
        {
            let db = state.db.lock().unwrap();
            assert_eq!(
                read_projeto_by_id(&db, &projeto_id).unwrap().status,
                ProjetoStatus::Archived
            );
        }

        let missing_archive =
            archive_projeto(State(state.clone()), Path("missing".to_string())).await;
        assert_eq!(missing_archive.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn etapa_handlers_add_update_remove_reorder_and_report_missing_projects() {
        let state = test_state();
        {
            let db = state.db.lock().unwrap();
            write_projeto(&db, &projeto("projeto-1", ProjetoStatus::Active));
        }

        let added = add_etapa(
            State(state.clone()),
            Path("projeto-1".to_string()),
            Json(CreateEtapaBody {
                title: " Terceira ".to_string(),
                description: Some(" ".to_string()),
                deadline: Some("2026-04-30".to_string()),
                effort_hours: Some(3.0),
                depends_on: Some(vec![]),
                order: None,
            }),
        )
        .await;
        assert_eq!(added.status(), StatusCode::OK);

        let new_etapa_id = {
            let db = state.db.lock().unwrap();
            let stored = read_projeto_by_id(&db, "projeto-1").unwrap();
            let new_etapa = stored.etapas.last().unwrap();
            assert_eq!(new_etapa.title, "Terceira");
            assert_eq!(new_etapa.description, None);
            assert_eq!(new_etapa.depends_on, None);
            assert_eq!(new_etapa.order, 3);
            new_etapa.id.clone()
        };

        let missing_add = add_etapa(
            State(state.clone()),
            Path("missing".to_string()),
            Json(CreateEtapaBody {
                title: "Nova".to_string(),
                description: None,
                deadline: None,
                effort_hours: None,
                depends_on: None,
                order: None,
            }),
        )
        .await;
        assert_eq!(missing_add.status(), StatusCode::NOT_FOUND);

        let done_update = update_etapa(
            State(state.clone()),
            Path(("projeto-1".to_string(), "etapa-2".to_string())),
            Json(UpdateEtapaBody {
                title: Some("Segunda editada".to_string()),
                description: Some("Descricao".to_string()),
                status: Some(EtapaStatus::Done),
                deadline: Some("2026-05-10".to_string()),
                effort_hours: Some(4.0),
                order: Some(9),
                depends_on: Some(vec!["etapa-1".to_string()]),
            }),
        )
        .await;
        assert_eq!(done_update.status(), StatusCode::OK);

        {
            let db = state.db.lock().unwrap();
            let stored = read_projeto_by_id(&db, "projeto-1").unwrap();
            let etapa = stored
                .etapas
                .iter()
                .find(|etapa| etapa.id == "etapa-2")
                .unwrap();
            assert_eq!(etapa.status, EtapaStatus::Done);
            assert!(etapa.completed_at.is_some());
            assert_eq!(etapa.deadline.as_deref(), Some("2026-05-10"));
            assert_eq!(etapa.effort_hours, Some(4.0));
            assert_eq!(etapa.order, 9);
        }

        let undone_update = update_etapa(
            State(state.clone()),
            Path(("projeto-1".to_string(), "etapa-2".to_string())),
            Json(UpdateEtapaBody {
                title: None,
                description: Some("".to_string()),
                status: Some(EtapaStatus::InProgress),
                deadline: None,
                effort_hours: None,
                order: None,
                depends_on: Some(vec!["etapa-1".to_string()]),
            }),
        )
        .await;
        assert_eq!(undone_update.status(), StatusCode::OK);

        {
            let db = state.db.lock().unwrap();
            let stored = read_projeto_by_id(&db, "projeto-1").unwrap();
            let etapa = stored
                .etapas
                .iter()
                .find(|etapa| etapa.id == "etapa-2")
                .unwrap();
            assert_eq!(etapa.status, EtapaStatus::InProgress);
            assert_eq!(etapa.description, None);
            assert_eq!(etapa.completed_at, None);
        }

        let missing_project_update = update_etapa(
            State(state.clone()),
            Path(("missing".to_string(), "etapa-2".to_string())),
            Json(UpdateEtapaBody {
                title: None,
                description: None,
                status: None,
                deadline: None,
                effort_hours: None,
                order: None,
                depends_on: None,
            }),
        )
        .await;
        assert_eq!(missing_project_update.status(), StatusCode::NOT_FOUND);

        let missing_etapa_update = update_etapa(
            State(state.clone()),
            Path(("projeto-1".to_string(), "missing".to_string())),
            Json(UpdateEtapaBody {
                title: None,
                description: None,
                status: None,
                deadline: None,
                effort_hours: None,
                order: None,
                depends_on: None,
            }),
        )
        .await;
        assert_eq!(missing_etapa_update.status(), StatusCode::NOT_FOUND);

        let reordered = reorder_etapas(
            State(state.clone()),
            Path("projeto-1".to_string()),
            Json(ReorderEtapasBody {
                etapa_ids: vec![
                    new_etapa_id.clone(),
                    "etapa-1".to_string(),
                    "etapa-2".to_string(),
                ],
            }),
        )
        .await;
        assert_eq!(reordered.status(), StatusCode::OK);

        {
            let db = state.db.lock().unwrap();
            let stored = read_projeto_by_id(&db, "projeto-1").unwrap();
            assert_eq!(
                stored
                    .etapas
                    .iter()
                    .find(|etapa| etapa.id == new_etapa_id)
                    .unwrap()
                    .order,
                0
            );
        }

        let missing_reorder = reorder_etapas(
            State(state.clone()),
            Path("missing".to_string()),
            Json(ReorderEtapasBody { etapa_ids: vec![] }),
        )
        .await;
        assert_eq!(missing_reorder.status(), StatusCode::NOT_FOUND);

        let removed = remove_etapa(
            State(state.clone()),
            Path(("projeto-1".to_string(), "etapa-1".to_string())),
        )
        .await;
        assert_eq!(removed.status(), StatusCode::OK);

        {
            let db = state.db.lock().unwrap();
            let stored = read_projeto_by_id(&db, "projeto-1").unwrap();
            assert!(stored.etapas.iter().all(|etapa| etapa.id != "etapa-1"));
            assert!(stored.etapas.iter().all(|etapa| etapa
                .depends_on
                .as_ref()
                .map_or(true, |deps| deps.iter().all(|dep| dep != "etapa-1"))));
        }

        let missing_remove = remove_etapa(
            State(state.clone()),
            Path(("missing".to_string(), "etapa-1".to_string())),
        )
        .await;
        assert_eq!(missing_remove.status(), StatusCode::NOT_FOUND);
    }
}
