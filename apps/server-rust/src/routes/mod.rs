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
