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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{write_diary_entry, write_food},
        models::{DiaryEntry, Food},
        routes::test_support::{food, nutrients, response_json, test_state},
    };

    fn food_entry(id: &str, food_id: &str) -> DiaryEntry {
        DiaryEntry::Food {
            id: id.to_string(),
            date: "2026-04-29".to_string(),
            food_id: food_id.to_string(),
            grams: 120.0,
            meal: Some("lunch".to_string()),
            created_at: "2026-04-29T12:00:00.000Z".to_string(),
        }
    }

    fn quick_entry(id: &str) -> DiaryEntry {
        DiaryEntry::Quick {
            id: id.to_string(),
            date: "2026-04-29".to_string(),
            description: "Cafe".to_string(),
            grams: 80.0,
            nutrients: nutrients(),
            meal: None,
            created_at: "2026-04-29T08:00:00.000Z".to_string(),
        }
    }

    #[tokio::test]
    async fn profile_and_summary_handlers_cover_defaults_profile_and_bad_dates() {
        let state = test_state();

        let empty_profile = response_json(get_profile(State(state.clone())).await).await;
        assert!(empty_profile["data"].is_null());

        let invalid = get_summary(
            State(state.clone()),
            Query(SummaryQuery {
                date: "29-04-2026".to_string(),
            }),
        )
        .await;
        assert_eq!(invalid.status(), StatusCode::BAD_REQUEST);

        {
            let db = state.db.lock().unwrap();
            let active_food: Food = food("food-1", true);
            write_food(&db, &active_food);
            write_diary_entry(&db, &food_entry("entry-food", "food-1"));
            write_diary_entry(&db, &food_entry("entry-missing-food", "missing-food"));
            write_diary_entry(&db, &quick_entry("entry-quick"));
        }

        let summary = response_json(
            get_summary(
                State(state.clone()),
                Query(SummaryQuery {
                    date: "2026-04-29".to_string(),
                }),
            )
            .await,
        )
        .await;
        assert_eq!(summary["data"]["entries"].as_array().unwrap().len(), 3);
        assert_eq!(
            summary["data"]["totals"]["calories"],
            serde_json::json!(200.0)
        );
        assert_eq!(
            summary["data"]["percentages"]["calories"],
            serde_json::json!(10.0)
        );

        let profile = NutritionProfile {
            weight_kg: 80.0,
            goal_type: "maintain".to_string(),
            custom_targets: Some(serde_json::json!({
                "calories": 0.0,
                "protein": 100.0
            })),
        };
        let saved = save_profile(State(state.clone()), Json(profile)).await;
        assert_eq!(saved.status(), StatusCode::OK);

        let stored_profile = response_json(get_profile(State(state.clone())).await).await;
        assert_eq!(stored_profile["data"]["weightKg"], serde_json::json!(80.0));

        let summary_with_profile = response_json(
            get_summary(
                State(state.clone()),
                Query(SummaryQuery {
                    date: "2026-04-29".to_string(),
                }),
            )
            .await,
        )
        .await;
        assert_eq!(
            summary_with_profile["data"]["percentages"]["calories"],
            serde_json::json!(0.0)
        );
        assert_eq!(
            summary_with_profile["data"]["targets"]["protein"],
            serde_json::json!(100.0)
        );
    }

    #[test]
    fn percentage_helpers_handle_zero_and_optional_targets() {
        let defaults = default_daily_targets();
        assert_eq!(defaults.calories, 2000.0);
        assert_eq!(pct(50.0, 200.0), 25.0);
        assert_eq!(pct(50.0, 0.0), 0.0);
        assert_eq!(pct_opt(Some(5.0), Some(10.0)), Some(50.0));
        assert_eq!(pct_opt(None, Some(10.0)), Some(0.0));
        assert_eq!(pct_opt(Some(5.0), None), Some(0.0));

        let mut totals = zero_targets();
        totals.calories = 100.0;
        totals.saturated_fat = Some(2.0);

        let mut targets = zero_targets();
        targets.calories = 200.0;
        targets.saturated_fat = Some(4.0);

        let percentages = compute_percentages(&totals, &targets);
        assert_eq!(percentages.calories, 50.0);
        assert_eq!(percentages.saturated_fat, Some(50.0));
        assert_eq!(percentages.sugar, Some(0.0));
    }
}
