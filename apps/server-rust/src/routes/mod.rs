pub mod deveres;
pub mod diary;
pub mod foods;
pub mod games;
pub mod habits;
pub mod nutrition;
pub mod projetos;
pub mod today;

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use serde_json::json;

/// Wrap any serializable value in `{ "ok": true, "data": ... }`.
pub fn api_ok<T: Serialize>(data: T) -> Response {
    Json(json!({ "ok": true, "data": data })).into_response()
}

/// Return an error response with `{ "ok": false, "error": "..." }`.
pub fn api_err(status: StatusCode, msg: &str) -> Response {
    (status, Json(json!({ "ok": false, "error": msg }))).into_response()
}

/// Current UTC time as ISO 8601 string, e.g. "2026-03-13T04:58:35.115Z".
pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

#[cfg(test)]
pub(crate) mod test_support {
    use crate::{
        db::init,
        models::{
            Dever, DeverCompletion, Etapa, EtapaStatus, Food, Habit, NutrientsPer100g, Priority,
            Projeto, ProjetoStatus, RecurrenceConfig,
        },
        AppState,
    };
    use axum::response::Response;
    use rusqlite::Connection;
    use std::{
        collections::HashMap,
        sync::{Arc, Mutex},
    };

    pub(crate) fn test_state() -> AppState {
        let conn = Connection::open_in_memory().unwrap();
        init(&conn);
        AppState {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    pub(crate) fn nutrients() -> NutrientsPer100g {
        NutrientsPer100g {
            calories: 100.0,
            protein: 5.0,
            carbs: 12.0,
            fat: 3.0,
            fiber: 2.0,
            saturated_fat: Some(1.0),
            trans_fat: None,
            sugar: Some(4.0),
            sodium: Some(120.0),
            potassium: Some(300.0),
            calcium: Some(80.0),
            iron: Some(1.2),
            vitamin_a: Some(10.0),
            vitamin_c: Some(20.0),
            vitamin_d: Some(0.5),
            vitamin_b12: Some(0.1),
            magnesium: Some(25.0),
            zinc: Some(0.8),
            omega3: Some(0.2),
            cholesterol: Some(15.0),
        }
    }

    pub(crate) fn habit(id: &str, active: bool) -> Habit {
        Habit {
            id: id.to_string(),
            title: "Anki".to_string(),
            category: Some("Estudo".to_string()),
            active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            times_per_day: 2,
            value_weights: vec![2.0, 1.0],
            completions: HashMap::from([("2026-04-29".to_string(), 2)]),
        }
    }

    pub(crate) fn once_dever(id: &str, active: bool, fim: Option<&str>) -> Dever {
        Dever::Once {
            id: id.to_string(),
            title: "Pagar boleto".to_string(),
            area: Some("Casa".to_string()),
            priority: Priority::High,
            active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
            fim: fim.map(|value| value.to_string()),
            completions: vec![],
        }
    }

    pub(crate) fn cyclic_dever(id: &str, active: bool) -> Dever {
        Dever::Cyclic {
            id: id.to_string(),
            title: "Treinar".to_string(),
            area: Some("Saude".to_string()),
            priority: Priority::Medium,
            active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
            fim: Some("2026-12-31".to_string()),
            recurrence: RecurrenceConfig::Weekly {
                weekdays: vec!["wednesday".to_string()],
            },
            completions: vec![DeverCompletion {
                occurrence_date: "2026-04-22".to_string(),
                completed_at: "2026-04-22T20:00:00.000Z".to_string(),
            }],
        }
    }

    pub(crate) fn food(id: &str, active: bool) -> Food {
        Food {
            id: id.to_string(),
            name: "Arroz".to_string(),
            brand: Some("Casa".to_string()),
            category: Some("Graos".to_string()),
            serving_description: Some("1 prato".to_string()),
            serving_grams: Some(100.0),
            nutrients: nutrients(),
            active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
        }
    }

    pub(crate) fn projeto(id: &str, status: ProjetoStatus) -> Projeto {
        Projeto {
            id: id.to_string(),
            title: "Projeto".to_string(),
            description: Some("Descricao".to_string()),
            area: Some("Casa".to_string()),
            priority: Priority::Medium,
            status,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
            fim: None,
            etapas: vec![
                Etapa {
                    id: "etapa-1".to_string(),
                    title: "Primeira".to_string(),
                    description: None,
                    status: EtapaStatus::Done,
                    order: 1,
                    deadline: None,
                    effort_hours: None,
                    depends_on: None,
                    completed_at: Some("2026-04-02T00:00:00.000Z".to_string()),
                    created_at: "2026-04-01T00:00:00.000Z".to_string(),
                },
                Etapa {
                    id: "etapa-2".to_string(),
                    title: "Segunda".to_string(),
                    description: None,
                    status: EtapaStatus::Pending,
                    order: 2,
                    deadline: None,
                    effort_hours: None,
                    depends_on: Some(vec!["etapa-1".to_string()]),
                    completed_at: None,
                    created_at: "2026-04-01T00:00:00.000Z".to_string(),
                },
            ],
        }
    }

    pub(crate) async fn response_json(response: Response) -> serde_json::Value {
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;

    #[test]
    fn api_helpers_set_expected_status_codes_and_iso_time_shape() {
        let ok = api_ok(serde_json::json!({ "value": 1 }));
        assert_eq!(ok.status(), StatusCode::OK);

        let err = api_err(StatusCode::BAD_REQUEST, "bad request");
        assert_eq!(err.status(), StatusCode::BAD_REQUEST);

        let now = now_iso();
        assert!(now.ends_with('Z'));
        assert!(chrono::DateTime::parse_from_rfc3339(&now).is_ok());
    }
}
