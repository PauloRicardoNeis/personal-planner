mod db;
mod models;
mod routes;

use axum::{
    routing::{delete, get, patch, post, put},
    Router,
};
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Mutex<rusqlite::Connection>>,
}

fn build_app(state: AppState) -> Router {
    let cors = CorsLayer::permissive();

    Router::new()
        .route(
            "/habits",
            get(routes::habits::get_habits).post(routes::habits::create_habit),
        )
        .route("/habits/:id", patch(routes::habits::update_habit))
        .route(
            "/habits/:id/completions",
            post(routes::habits::mark_habit_done),
        )
        .route(
            "/habits/:id/completions/:date",
            delete(routes::habits::unmark_habit_done),
        )
        .route("/habits/:id/archive", post(routes::habits::archive_habit))
        .route(
            "/deveres",
            get(routes::deveres::get_deveres).post(routes::deveres::create_dever),
        )
        .route("/deveres/:id", patch(routes::deveres::update_dever))
        .route(
            "/deveres/:id/completions",
            post(routes::deveres::mark_dever_done),
        )
        .route(
            "/deveres/:id/completions/:occurrence_date",
            delete(routes::deveres::unmark_dever_done),
        )
        .route("/deveres/:id/archive", post(routes::deveres::archive_dever))
        .route(
            "/projetos",
            get(routes::projetos::get_projetos).post(routes::projetos::create_projeto),
        )
        .route("/projetos/:id", patch(routes::projetos::update_projeto))
        .route(
            "/projetos/:id/archive",
            post(routes::projetos::archive_projeto),
        )
        .route("/projetos/:id/etapas", post(routes::projetos::add_etapa))
        .route(
            "/projetos/:id/etapas/order",
            put(routes::projetos::reorder_etapas),
        )
        .route(
            "/projetos/:id/etapas/:etapa_id",
            patch(routes::projetos::update_etapa).delete(routes::projetos::remove_etapa),
        )
        .route("/games", get(routes::games::get_games))
        .route(
            "/games/steam-settings",
            get(routes::games::get_steam_settings).put(routes::games::save_steam_settings),
        )
        .route("/games/sync-steam", post(routes::games::sync_steam))
        .route(
            "/foods",
            get(routes::foods::get_foods).post(routes::foods::create_food),
        )
        .route("/foods/:id", patch(routes::foods::update_food))
        .route("/foods/:id/archive", post(routes::foods::archive_food))
        .route(
            "/diary",
            get(routes::diary::get_diary).post(routes::diary::create_diary_entry),
        )
        .route(
            "/diary/:id",
            patch(routes::diary::update_diary_entry)
                .delete(routes::diary::delete_diary_entry_handler),
        )
        .route(
            "/nutrition/profile",
            get(routes::nutrition::get_profile).put(routes::nutrition::save_profile),
        )
        .route("/nutrition/summary", get(routes::nutrition::get_summary))
        .route("/today", get(routes::today::get_today))
        .layer(cors)
        .with_state(state)
}

#[tokio::main]
async fn main() {
    let data_dir = std::env::var("DATA_DIR")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            std::env::current_dir()
                .expect("Cannot determine cwd")
                .join("data")
        });
    std::fs::create_dir_all(&data_dir).expect("Failed to create data directory");

    let conn =
        rusqlite::Connection::open(data_dir.join("planner.db")).expect("Failed to open database");
    conn.pragma_update(None, "journal_mode", "WAL")
        .expect("Failed to enable WAL mode");
    db::init(&conn);

    let state = AppState {
        db: Arc::new(Mutex::new(conn)),
    };
    let app = build_app(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3001);
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}"))
        .await
        .expect("Failed to bind port");

    println!("[planner-server] listening on http://127.0.0.1:{port}");
    axum::serve(listener, app).await.expect("Server error");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_app_constructs_router_with_in_memory_state() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        db::init(&conn);
        let state = AppState {
            db: Arc::new(Mutex::new(conn)),
        };

        let _app = build_app(state);
    }
}
