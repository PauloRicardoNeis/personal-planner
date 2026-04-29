use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::{
    db::{
        read_all_foods, read_diary_entries_by_date, read_nutrition_profile, write_nutrition_profile,
    },
    models::{
        add_targets, compute_daily_targets, compute_portion_nutrients, zero_targets, DailyTargets,
        DiaryEntry, NutritionProfile,
    },
    routes::{api_err, api_ok},
    AppState,
};

// ── GET /nutrition/profile ───────────────────────────────────────────────────

pub async fn get_profile(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    match read_nutrition_profile(&db) {
        Some(profile) => api_ok(profile),
        None => api_ok(serde_json::Value::Null),
    }
}

// ── PUT /nutrition/profile ───────────────────────────────────────────────────

pub async fn save_profile(
    State(state): State<AppState>,
    Json(body): Json<NutritionProfile>,
) -> Response {
    let db = state.db.lock().unwrap();
    write_nutrition_profile(&db, &body);
    api_ok(body)
}

// ── GET /nutrition/summary?date=YYYY-MM-DD ───────────────────────────────────

#[derive(Deserialize)]
pub struct SummaryQuery {
    pub date: String,
}

#[derive(Serialize)]
struct DailyNutritionSummary {
    date: String,
    totals: DailyTargets,
    targets: DailyTargets,
    percentages: DailyTargets,
    entries: Vec<DiaryEntry>,
}

pub async fn get_summary(
    State(state): State<AppState>,
    Query(query): Query<SummaryQuery>,
) -> Response {
    if chrono::NaiveDate::parse_from_str(&query.date, "%Y-%m-%d").is_err() {
        return api_err(StatusCode::BAD_REQUEST, "date must be YYYY-MM-DD");
    }

    let db = state.db.lock().unwrap();
    let entries = read_diary_entries_by_date(&db, &query.date);
    let all_foods = read_all_foods(&db);
    let profile = read_nutrition_profile(&db);

    // Build a map of food_id → Food for quick lookup
    let food_map: std::collections::HashMap<&str, &crate::models::Food> =
        all_foods.iter().map(|f| (f.id.as_str(), f)).collect();

    // Compute totals for all entries in the day.
    let mut totals = zero_targets();

    for entry in &entries {
        let portion = match entry {
            DiaryEntry::Food { food_id, grams, .. } => {
                if let Some(food) = food_map.get(food_id.as_str()) {
                    compute_portion_nutrients(&food.nutrients, *grams)
                } else {
                    zero_targets()
                }
            }
            DiaryEntry::Quick {
                grams, nutrients, ..
            } => compute_portion_nutrients(nutrients, *grams),
        };
        totals = add_targets(&totals, &portion);
    }

    // Keep the REST adapter contract stable even before a profile is configured.
    let targets = profile
        .as_ref()
        .map(compute_daily_targets)
        .unwrap_or_else(default_daily_targets);
    let percentages = compute_percentages(&totals, &targets);

    api_ok(DailyNutritionSummary {
        date: query.date,
        totals,
        targets,
        percentages,
        entries,
    })
}

fn default_daily_targets() -> DailyTargets {
    DailyTargets {
        calories: 2000.0,
        protein: 50.0,
        carbs: 250.0,
        fat: 65.0,
        fiber: 25.0,
        saturated_fat: None,
        sugar: None,
        sodium: None,
        potassium: None,
        calcium: None,
        iron: None,
        vitamin_a: None,
        vitamin_c: None,
        vitamin_d: None,
        vitamin_b12: None,
        magnesium: None,
        zinc: None,
        omega3: None,
        cholesterol: None,
    }
}

fn pct(actual: f64, target: f64) -> f64 {
    if target <= 0.0 {
        0.0
    } else {
        (actual / target * 100.0).round()
    }
}

fn pct_opt(actual: Option<f64>, target: Option<f64>) -> Option<f64> {
    match (actual, target) {
        (Some(a), Some(t)) => Some(pct(a, t)),
        (None, Some(_)) | (_, None) => Some(0.0),
    }
}

fn compute_percentages(totals: &DailyTargets, targets: &DailyTargets) -> DailyTargets {
    DailyTargets {
        calories: pct(totals.calories, targets.calories),
        protein: pct(totals.protein, targets.protein),
        carbs: pct(totals.carbs, targets.carbs),
        fat: pct(totals.fat, targets.fat),
        fiber: pct(totals.fiber, targets.fiber),
        saturated_fat: pct_opt(totals.saturated_fat, targets.saturated_fat),
        sugar: pct_opt(totals.sugar, targets.sugar),
        sodium: pct_opt(totals.sodium, targets.sodium),
        potassium: pct_opt(totals.potassium, targets.potassium),
        calcium: pct_opt(totals.calcium, targets.calcium),
        iron: pct_opt(totals.iron, targets.iron),
        vitamin_a: pct_opt(totals.vitamin_a, targets.vitamin_a),
        vitamin_c: pct_opt(totals.vitamin_c, targets.vitamin_c),
        vitamin_d: pct_opt(totals.vitamin_d, targets.vitamin_d),
        vitamin_b12: pct_opt(totals.vitamin_b12, targets.vitamin_b12),
        magnesium: pct_opt(totals.magnesium, targets.magnesium),
        zinc: pct_opt(totals.zinc, targets.zinc),
        omega3: pct_opt(totals.omega3, targets.omega3),
        cholesterol: pct_opt(totals.cholesterol, targets.cholesterol),
    }
}
