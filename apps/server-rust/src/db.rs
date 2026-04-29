use rusqlite::{params, Connection};

use crate::models::{
    Dever, DiaryEntry, Food, Game, Habit, NutritionProfile, Projeto, SteamLibrarySettings,
};

/// Creates tables if they don't exist. Called once on startup.
pub fn init(conn: &Connection) {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS habits   (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS deveres  (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS projetos (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS foods    (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS games    (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS diary_entries (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS nutrition_profile (id TEXT PRIMARY KEY, data TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS steam_library_settings (id TEXT PRIMARY KEY, data TEXT NOT NULL);",
    )
    .expect("Failed to create tables");
}

// ── Habits ────────────────────────────────────────────────────────────────────

pub fn read_all_habits(conn: &Connection) -> Vec<Habit> {
    let mut stmt = conn.prepare("SELECT data FROM habits").unwrap();
    stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect()
}

pub fn read_habit_by_id(conn: &Connection, id: &str) -> Option<Habit> {
    conn.query_row(
        "SELECT data FROM habits WHERE id = ?1",
        params![id],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_habit(conn: &Connection, habit: &Habit) {
    let json = serde_json::to_string(habit).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO habits (id, data) VALUES (?1, ?2)",
        params![habit.id, json],
    )
    .unwrap();
}

// ── Deveres ───────────────────────────────────────────────────────────────────

pub fn read_all_deveres(conn: &Connection) -> Vec<Dever> {
    let mut stmt = conn.prepare("SELECT data FROM deveres").unwrap();
    stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect()
}

pub fn read_dever_by_id(conn: &Connection, id: &str) -> Option<Dever> {
    conn.query_row(
        "SELECT data FROM deveres WHERE id = ?1",
        params![id],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_dever(conn: &Connection, dever: &Dever) {
    let json = serde_json::to_string(dever).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO deveres (id, data) VALUES (?1, ?2)",
        params![dever.id(), json],
    )
    .unwrap();
}

// ── Projetos ─────────────────────────────────────────────────────────────────

pub fn read_all_projetos(conn: &Connection) -> Vec<Projeto> {
    let mut stmt = conn.prepare("SELECT data FROM projetos").unwrap();
    stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect()
}

pub fn read_projeto_by_id(conn: &Connection, id: &str) -> Option<Projeto> {
    conn.query_row(
        "SELECT data FROM projetos WHERE id = ?1",
        params![id],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_projeto(conn: &Connection, projeto: &Projeto) {
    let json = serde_json::to_string(projeto).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO projetos (id, data) VALUES (?1, ?2)",
        params![projeto.id, json],
    )
    .unwrap();
}

// ── Foods ─────────────────────────────────────────────────────────────────────

pub fn read_all_foods(conn: &Connection) -> Vec<Food> {
    let mut stmt = conn.prepare("SELECT data FROM foods").unwrap();
    stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect()
}

pub fn read_food_by_id(conn: &Connection, id: &str) -> Option<Food> {
    conn.query_row("SELECT data FROM foods WHERE id = ?1", params![id], |row| {
        row.get::<_, String>(0)
    })
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_food(conn: &Connection, food: &Food) {
    let json = serde_json::to_string(food).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO foods (id, data) VALUES (?1, ?2)",
        params![food.id, json],
    )
    .unwrap();
}

// ── Diary Entries ─────────────────────────────────────────────────────────────

pub fn read_all_games(conn: &Connection) -> Vec<Game> {
    let mut stmt = conn.prepare("SELECT data FROM games").unwrap();
    stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect()
}

pub fn replace_games(conn: &Connection, games: &[Game]) {
    conn.execute("DELETE FROM games", []).unwrap();
    for game in games {
        let json = serde_json::to_string(game).unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO games (id, data) VALUES (?1, ?2)",
            params![game.id, json],
        )
        .unwrap();
    }
}

pub fn read_steam_library_settings(conn: &Connection) -> Option<SteamLibrarySettings> {
    conn.query_row(
        "SELECT data FROM steam_library_settings WHERE id = 'default'",
        [],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_steam_library_settings(conn: &Connection, settings: &SteamLibrarySettings) {
    let json = serde_json::to_string(settings).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO steam_library_settings (id, data) VALUES ('default', ?1)",
        params![json],
    )
    .unwrap();
}

pub fn read_diary_entries_by_date(conn: &Connection, date: &str) -> Vec<DiaryEntry> {
    let mut stmt = conn.prepare("SELECT data FROM diary_entries").unwrap();
    stmt.query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .filter_map(|json| serde_json::from_str::<DiaryEntry>(&json).ok())
        .filter(|e| e.date() == date)
        .collect()
}

pub fn read_diary_entry_by_id(conn: &Connection, id: &str) -> Option<DiaryEntry> {
    conn.query_row(
        "SELECT data FROM diary_entries WHERE id = ?1",
        params![id],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_diary_entry(conn: &Connection, entry: &DiaryEntry) {
    let json = serde_json::to_string(entry).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO diary_entries (id, data) VALUES (?1, ?2)",
        params![entry.id(), json],
    )
    .unwrap();
}

pub fn delete_diary_entry(conn: &Connection, id: &str) {
    conn.execute("DELETE FROM diary_entries WHERE id = ?1", params![id])
        .unwrap();
}

// ── Nutrition Profile ─────────────────────────────────────────────────────────

pub fn read_nutrition_profile(conn: &Connection) -> Option<NutritionProfile> {
    conn.query_row(
        "SELECT data FROM nutrition_profile WHERE id = 'default'",
        [],
        |row| row.get::<_, String>(0),
    )
    .ok()
    .and_then(|json| serde_json::from_str(&json).ok())
}

pub fn write_nutrition_profile(conn: &Connection, profile: &NutritionProfile) {
    let json = serde_json::to_string(profile).unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO nutrition_profile (id, data) VALUES ('default', ?1)",
        params![json],
    )
    .unwrap();
}
