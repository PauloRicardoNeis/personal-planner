mod db;
mod models;
mod routes;

use axum::{
    routing::{delete, get, patch, post},
    Router,
};
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;

// ── Shared state ──────────────────────────────────────────────────────────────

/// The single SQLite connection shared across all request handlers.
/// `std::sync::Mutex` is safe here because rusqlite operations are synchronous
/// and we never hold the lock across an `.await` point.
#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Mutex<rusqlite::Connection>>,
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    // Data directory: configurable via DATA_DIR env var (required when running
    // as a Tauri sidecar). Falls back to ./data relative to cwd for local dev.
    let data_dir = std::env::var("DATA_DIR")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::env::current_dir().expect("Cannot determine cwd").join("data"));
    std::fs::create_dir_all(&data_dir).expect("Failed to create data directory");

    // Open (or create) the SQLite database.
    let conn = rusqlite::Connection::open(data_dir.join("planner.db"))
        .expect("Failed to open database");

    // Enable WAL mode: better read/write concurrency for a local server.
    conn.pragma_update(None, "journal_mode", "WAL")
        .expect("Failed to enable WAL mode");

    db::init(&conn);

    let state = AppState {
        db: Arc::new(Mutex::new(conn)),
    };

    // Allow requests from the Vite dev server.
    let cors = CorsLayer::permissive();

    let app = Router::new()
        // ── Habits ────────────────────────────────────────────────────────────
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
        // ── Deveres ───────────────────────────────────────────────────────────
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
        .route(
            "/deveres/:id/archive",
            post(routes::deveres::archive_dever),
        )
        // ── Foods ─────────────────────────────────────────────────────────────
        .route(
            "/foods",
            get(routes::foods::get_foods).post(routes::foods::create_food),
        )
        .route("/foods/:id", patch(routes::foods::update_food))
        .route("/foods/:id/archive", post(routes::foods::archive_food))
        // ── Diary ─────────────────────────────────────────────────────────────
        .route(
            "/diary",
            get(routes::diary::get_diary).post(routes::diary::create_diary_entry),
        )
        .route(
            "/diary/:id",
            patch(routes::diary::update_diary_entry).delete(routes::diary::delete_diary_entry_handler),
        )
        // ── Nutrition ─────────────────────────────────────────────────────────
        .route(
            "/nutrition/profile",
            get(routes::nutrition::get_profile).put(routes::nutrition::save_profile),
        )
        .route("/nutrition/summary", get(routes::nutrition::get_summary))
        // ── Today ─────────────────────────────────────────────────────────────
        .route("/today", get(routes::today::get_today))
        .layer(cors)
        .with_state(state);

    // Port: configurable via PORT env var (used by Tauri sidecar). Default 3001.
    // Binds to loopback only — avoids Windows Firewall prompts for a local app.
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3001);
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}"))
        .await
        .expect("Failed to bind port");

    println!("[planner-server] listening on http://127.0.0.1:{port}");
    axum::serve(listener, app)
        .await
        .expect("Server error");
}
