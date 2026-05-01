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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        DeverCompletion, Etapa, EtapaStatus, NutrientsPer100g, Priority, ProjetoStatus,
        RecurrenceConfig,
    };
    use std::collections::HashMap;

    fn test_conn() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        init(&conn);
        conn
    }

    fn sample_nutrients() -> NutrientsPer100g {
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

    fn sample_habit(id: &str) -> Habit {
        Habit {
            id: id.to_string(),
            title: "Anki".to_string(),
            category: Some("Estudo".to_string()),
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            times_per_day: 2,
            value_weights: vec![2.0, 1.0],
            completions: HashMap::from([("2026-04-29".to_string(), 1)]),
        }
    }

    fn sample_once_dever(id: &str) -> Dever {
        Dever::Once {
            id: id.to_string(),
            title: "Pagar boleto".to_string(),
            area: None,
            priority: Priority::High,
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: None,
            fim: Some("2026-04-30".to_string()),
            completions: vec![DeverCompletion {
                occurrence_date: "2026-04-30".to_string(),
                completed_at: "2026-04-29T20:00:00.000Z".to_string(),
            }],
        }
    }

    fn sample_cyclic_dever(id: &str) -> Dever {
        Dever::Cyclic {
            id: id.to_string(),
            title: "Treinar".to_string(),
            area: Some("Saude".to_string()),
            priority: Priority::Medium,
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
            fim: None,
            recurrence: RecurrenceConfig::Daily,
            completions: vec![],
        }
    }

    fn sample_projeto(id: &str) -> Projeto {
        Projeto {
            id: id.to_string(),
            title: "Reformar escritorio".to_string(),
            description: Some("Organizar o setup".to_string()),
            area: Some("Casa".to_string()),
            priority: Priority::Medium,
            status: ProjetoStatus::Active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
            fim: None,
            etapas: vec![Etapa {
                id: "etapa-1".to_string(),
                title: "Medir mesa".to_string(),
                description: None,
                status: EtapaStatus::Pending,
                order: 0,
                deadline: None,
                effort_hours: Some(1.0),
                depends_on: None,
                completed_at: None,
                created_at: "2026-04-01T00:00:00.000Z".to_string(),
            }],
        }
    }

    fn sample_food(id: &str, active: bool) -> Food {
        Food {
            id: id.to_string(),
            name: "Arroz".to_string(),
            brand: Some("Casa".to_string()),
            category: Some("Graos".to_string()),
            serving_description: Some("1 prato".to_string()),
            serving_grams: Some(100.0),
            nutrients: sample_nutrients(),
            active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
        }
    }

    fn sample_game(appid: u32, playtime_minutes: u32) -> Game {
        Game {
            id: format!("steam:{appid}"),
            source: "steam".to_string(),
            steam_app_id: appid,
            name: format!("Game {appid}"),
            playtime_minutes,
            icon_hash: None,
            logo_hash: Some("logo".to_string()),
            last_imported_at: "2026-04-29T00:00:00.000Z".to_string(),
        }
    }

    fn food_entry(id: &str, date: &str, food_id: &str) -> DiaryEntry {
        DiaryEntry::Food {
            id: id.to_string(),
            date: date.to_string(),
            food_id: food_id.to_string(),
            grams: 120.0,
            meal: Some("lunch".to_string()),
            created_at: "2026-04-29T12:00:00.000Z".to_string(),
        }
    }

    fn quick_entry(id: &str, date: &str) -> DiaryEntry {
        DiaryEntry::Quick {
            id: id.to_string(),
            date: date.to_string(),
            description: "Cafe".to_string(),
            grams: 80.0,
            nutrients: sample_nutrients(),
            meal: None,
            created_at: "2026-04-29T08:00:00.000Z".to_string(),
        }
    }

    #[test]
    fn init_creates_all_storage_tables() {
        let conn = test_conn();

        let table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master
                 WHERE type = 'table'
                 AND name IN (
                    'habits',
                    'deveres',
                    'projetos',
                    'foods',
                    'games',
                    'diary_entries',
                    'nutrition_profile',
                    'steam_library_settings'
                 )",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(table_count, 8);
    }

    #[test]
    fn habits_round_trip_and_ignore_invalid_json_rows() {
        let conn = test_conn();
        let mut habit = sample_habit("habit-1");

        assert!(read_habit_by_id(&conn, "missing").is_none());
        write_habit(&conn, &habit);
        habit.title = "Anki editado".to_string();
        write_habit(&conn, &habit);

        conn.execute(
            "INSERT INTO habits (id, data) VALUES (?1, ?2)",
            params!["bad", "{"],
        )
        .unwrap();

        let stored = read_habit_by_id(&conn, "habit-1").unwrap();
        assert_eq!(stored.title, "Anki editado");
        assert_eq!(stored.completions.get("2026-04-29"), Some(&1));
        assert!(read_habit_by_id(&conn, "bad").is_none());

        let all = read_all_habits(&conn);
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].id, "habit-1");
    }

    #[test]
    fn deveres_round_trip_once_and_cyclic_and_ignore_invalid_rows() {
        let conn = test_conn();
        let once = sample_once_dever("dever-1");
        let cyclic = sample_cyclic_dever("dever-2");

        assert!(read_dever_by_id(&conn, "missing").is_none());
        write_dever(&conn, &once);
        write_dever(&conn, &cyclic);
        conn.execute(
            "INSERT INTO deveres (id, data) VALUES (?1, ?2)",
            params!["bad", "not-json"],
        )
        .unwrap();

        let stored_once = read_dever_by_id(&conn, "dever-1").unwrap();
        assert_eq!(stored_once.id(), "dever-1");
        assert_eq!(stored_once.completions().len(), 1);
        assert!(read_dever_by_id(&conn, "bad").is_none());

        let mut ids: Vec<String> = read_all_deveres(&conn)
            .into_iter()
            .map(|dever| dever.id().to_string())
            .collect();
        ids.sort();
        assert_eq!(ids, vec!["dever-1", "dever-2"]);
    }

    #[test]
    fn projetos_and_foods_round_trip_and_skip_invalid_rows() {
        let conn = test_conn();
        let projeto = sample_projeto("projeto-1");
        let food = sample_food("food-1", true);

        assert!(read_projeto_by_id(&conn, "missing").is_none());
        assert!(read_food_by_id(&conn, "missing").is_none());
        write_projeto(&conn, &projeto);
        write_food(&conn, &food);
        conn.execute(
            "INSERT INTO projetos (id, data) VALUES (?1, ?2)",
            params!["bad-projeto", "{"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO foods (id, data) VALUES (?1, ?2)",
            params!["bad-food", "{"],
        )
        .unwrap();

        let stored_projeto = read_projeto_by_id(&conn, "projeto-1").unwrap();
        assert_eq!(stored_projeto.title, "Reformar escritorio");
        assert_eq!(stored_projeto.etapas.len(), 1);
        assert!(read_projeto_by_id(&conn, "bad-projeto").is_none());
        assert_eq!(read_all_projetos(&conn).len(), 1);

        let stored_food = read_food_by_id(&conn, "food-1").unwrap();
        assert_eq!(stored_food.name, "Arroz");
        assert_eq!(stored_food.nutrients.calories, 100.0);
        assert!(read_food_by_id(&conn, "bad-food").is_none());
        assert_eq!(read_all_foods(&conn).len(), 1);
    }

    #[test]
    fn games_replacement_and_steam_settings_round_trip() {
        let conn = test_conn();
        assert!(read_all_games(&conn).is_empty());
        assert!(read_steam_library_settings(&conn).is_none());

        replace_games(&conn, &[sample_game(10, 50), sample_game(20, 100)]);
        let mut app_ids: Vec<u32> = read_all_games(&conn)
            .into_iter()
            .map(|game| game.steam_app_id)
            .collect();
        app_ids.sort();
        assert_eq!(app_ids, vec![10, 20]);

        replace_games(&conn, &[sample_game(30, 10)]);
        let games = read_all_games(&conn);
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].steam_app_id, 30);

        let settings = SteamLibrarySettings {
            api_key: "key".to_string(),
            profile: "profile".to_string(),
            resolved_steam_id: Some("765".to_string()),
            last_synced_at: Some("2026-04-29T00:00:00.000Z".to_string()),
        };
        write_steam_library_settings(&conn, &settings);
        let stored = read_steam_library_settings(&conn).unwrap();
        assert_eq!(stored.api_key, "key");
        assert_eq!(stored.resolved_steam_id.as_deref(), Some("765"));
    }

    #[test]
    fn diary_entries_filter_by_date_read_by_id_and_delete() {
        let conn = test_conn();
        let entry_today = food_entry("entry-1", "2026-04-29", "food-1");
        let quick_today = quick_entry("entry-2", "2026-04-29");
        let entry_tomorrow = food_entry("entry-3", "2026-04-30", "food-1");

        assert!(read_diary_entry_by_id(&conn, "missing").is_none());
        write_diary_entry(&conn, &entry_today);
        write_diary_entry(&conn, &quick_today);
        write_diary_entry(&conn, &entry_tomorrow);
        conn.execute(
            "INSERT INTO diary_entries (id, data) VALUES (?1, ?2)",
            params!["bad-entry", "{"],
        )
        .unwrap();

        let today = read_diary_entries_by_date(&conn, "2026-04-29");
        assert_eq!(today.len(), 2);
        assert!(today.iter().all(|entry| entry.date() == "2026-04-29"));

        let stored = read_diary_entry_by_id(&conn, "entry-1").unwrap();
        assert_eq!(stored.id(), "entry-1");
        assert!(read_diary_entry_by_id(&conn, "bad-entry").is_none());

        delete_diary_entry(&conn, "entry-1");
        assert!(read_diary_entry_by_id(&conn, "entry-1").is_none());
        assert_eq!(read_diary_entries_by_date(&conn, "2026-04-30").len(), 1);
    }

    #[test]
    fn nutrition_profile_round_trips_default_row() {
        let conn = test_conn();
        assert!(read_nutrition_profile(&conn).is_none());

        let profile = NutritionProfile {
            weight_kg: 82.5,
            goal_type: "bulk".to_string(),
            custom_targets: Some(serde_json::json!({ "calories": 3000.0 })),
        };
        write_nutrition_profile(&conn, &profile);

        let stored = read_nutrition_profile(&conn).unwrap();
        assert_eq!(stored.weight_kg, 82.5);
        assert_eq!(stored.goal_type, "bulk");
        assert_eq!(
            stored.custom_targets.unwrap()["calories"],
            serde_json::json!(3000.0)
        );
    }
}
