use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Response,
};
use serde::{Deserialize, Serialize};

use crate::{
    AppState,
    db::{read_all_deveres, read_all_foods, read_all_habits, read_diary_entries_by_date, read_nutrition_profile},
    models::{
        add_targets, compute_daily_targets, compute_portion_nutrients, compute_streaks,
        zero_targets, Dever, DiaryEntry, Habit, HabitStreakInfo, Priority, is_occurrence_on,
    },
    routes::{api_err, api_ok},
};

// ── Request ───────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct TodayQuery {
    pub date: String,
}

// ── Response shapes ───────────────────────────────────────────────────────────

#[derive(Serialize)]
struct HabitItem {
    habit: Habit,
    #[serde(rename = "isDone")]
    is_done: bool,
    streak: HabitStreakInfo,
}

#[derive(Serialize)]
struct DeverItem {
    dever: Dever,
    #[serde(rename = "occurrenceDate")]
    occurrence_date: String,
    #[serde(rename = "isDone")]
    is_done: bool,
    #[serde(rename = "isOverdue")]
    is_overdue: bool,
}

#[derive(Serialize)]
struct NutritionCard {
    calories: f64,
    #[serde(rename = "caloriesTarget")]
    calories_target: f64,
    #[serde(rename = "caloriesPercent")]
    calories_percent: f64,
    protein: f64,
    #[serde(rename = "proteinTarget")]
    protein_target: f64,
    #[serde(rename = "proteinPercent")]
    protein_percent: f64,
    carbs: f64,
    #[serde(rename = "carbsTarget")]
    carbs_target: f64,
    #[serde(rename = "carbsPercent")]
    carbs_percent: f64,
    fat: f64,
    #[serde(rename = "fatTarget")]
    fat_target: f64,
    #[serde(rename = "fatPercent")]
    fat_percent: f64,
}

#[derive(Serialize)]
struct TodaySnapshot {
    date: String,
    habits: Vec<HabitItem>,
    deveres: Vec<DeverItem>,
    #[serde(rename = "nutritionSummary", skip_serializing_if = "Option::is_none")]
    nutrition_summary: Option<NutritionCard>,
}

// ── Handler ───────────────────────────────────────────────────────────────────

/// GET /today?date=YYYY-MM-DD
/// Mirrors LocalStorageAdapter#getTodaySnapshot logic.
pub async fn get_today(
    State(state): State<AppState>,
    Query(query): Query<TodayQuery>,
) -> Response {
    // Validate date format
    if chrono::NaiveDate::parse_from_str(&query.date, "%Y-%m-%d").is_err() {
        return api_err(StatusCode::BAD_REQUEST, "date must be YYYY-MM-DD");
    }

    let date = &query.date;
    let db = state.db.lock().unwrap();

    // ── Habits ────────────────────────────────────────────────────────────────
    let habits: Vec<HabitItem> = read_all_habits(&db)
        .into_iter()
        .filter(|h| h.active)
        .map(|habit| {
            let is_done = habit.completions.get(date.as_str()).copied().unwrap_or(false);
            let streak = compute_streaks(&habit.completions, date, &habit.created_at);
            HabitItem { habit, is_done, streak }
        })
        .collect();

    // ── Deveres ───────────────────────────────────────────────────────────────
    let mut dever_items: Vec<DeverItem> = Vec::new();

    for dever in read_all_deveres(&db).into_iter().filter(|d| d.active()) {
        let (occurrence_date, is_done, is_overdue) = match &dever {
            Dever::Once { deadline, completions, .. } => {
                let is_overdue = deadline.as_str() < date.as_str();
                let is_due_today = deadline == date;
                if !is_due_today && !is_overdue {
                    continue;
                }
                let is_done = completions.iter().any(|c| &c.occurrence_date == deadline);
                if is_done {
                    continue; // hide completed once-deveres from today view
                }
                (deadline.clone(), false, is_overdue)
            }
            Dever::Cyclic { recurrence, completions, .. } => {
                if !is_occurrence_on(recurrence, date) {
                    continue;
                }
                let is_done = completions.iter().any(|c| &c.occurrence_date == date);
                (date.clone(), is_done, false)
            }
        };
        dever_items.push(DeverItem { dever, occurrence_date, is_done, is_overdue });
    }

    // Sort: overdue first, then by priority (high -> medium -> low)
    dever_items.sort_by(|a, b| {
        if a.is_overdue != b.is_overdue {
            return if a.is_overdue {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            };
        }
        priority_order(a.dever.priority()).cmp(&priority_order(b.dever.priority()))
    });

    // ── Nutrition card ────────────────────────────────────────────────────────
    let nutrition_summary = read_nutrition_profile(&db).map(|profile| {
        let targets = compute_daily_targets(&profile);
        let entries = read_diary_entries_by_date(&db, date);
        let all_foods = read_all_foods(&db);
        let food_map: std::collections::HashMap<&str, &crate::models::Food> =
            all_foods.iter().map(|f| (f.id.as_str(), f)).collect();

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
                DiaryEntry::Quick { grams, nutrients, .. } => {
                    compute_portion_nutrients(nutrients, *grams)
                }
            };
            totals = add_targets(&totals, &portion);
        }

        let pct = |actual: f64, target: f64| -> f64 {
            if target <= 0.0 { 0.0 } else { (actual / target * 100.0).round() }
        };

        NutritionCard {
            calories: totals.calories,
            calories_target: targets.calories,
            calories_percent: pct(totals.calories, targets.calories),
            protein: totals.protein,
            protein_target: targets.protein,
            protein_percent: pct(totals.protein, targets.protein),
            carbs: totals.carbs,
            carbs_target: targets.carbs,
            carbs_percent: pct(totals.carbs, targets.carbs),
            fat: totals.fat,
            fat_target: targets.fat,
            fat_percent: pct(totals.fat, targets.fat),
        }
    });

    api_ok(TodaySnapshot {
        date: date.clone(),
        habits,
        deveres: dever_items,
        nutrition_summary,
    })
}

fn priority_order(p: &Priority) -> u8 {
    match p {
        Priority::High => 0,
        Priority::Medium => 1,
        Priority::Low => 2,
    }
}
