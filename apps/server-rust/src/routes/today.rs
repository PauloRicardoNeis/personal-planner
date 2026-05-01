use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Response,
};
use serde::{Deserialize, Serialize};

use crate::{
    db::{
        read_all_deveres, read_all_foods, read_all_habits, read_all_projetos,
        read_diary_entries_by_date, read_nutrition_profile,
    },
    models::{
        add_targets, compute_daily_targets, compute_portion_nutrients, compute_projeto_progress,
        compute_streaks, get_next_etapas, habit_goal_completions, habit_is_done_on,
        is_occurrence_on, zero_targets, Dever, DiaryEntry, Etapa, Habit, HabitStreakInfo, Priority,
        Projeto, ProjetoProgress, ProjetoStatus,
    },
    routes::{api_err, api_ok},
    AppState,
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
struct ProjetoItem {
    projeto: Projeto,
    progress: ProjetoProgress,
    #[serde(rename = "nextEtapas")]
    next_etapas: Vec<Etapa>,
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
    projetos: Vec<ProjetoItem>,
    #[serde(rename = "nutritionSummary", skip_serializing_if = "Option::is_none")]
    nutrition_summary: Option<NutritionCard>,
}

// ── Handler ───────────────────────────────────────────────────────────────────

/// GET /today?date=YYYY-MM-DD
/// Mirrors LocalStorageAdapter#getTodaySnapshot logic.
pub async fn get_today(State(state): State<AppState>, Query(query): Query<TodayQuery>) -> Response {
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
            let is_done = habit_is_done_on(&habit, date);
            let goal_completions = habit_goal_completions(&habit);
            let streak = compute_streaks(&goal_completions, date, &habit.created_at);
            HabitItem {
                habit,
                is_done,
                streak,
            }
        })
        .collect();

    // ── Deveres ───────────────────────────────────────────────────────────────
    let mut dever_items: Vec<DeverItem> = Vec::new();

    for dever in read_all_deveres(&db).into_iter().filter(|d| d.active()) {
        // Skip deveres that haven't started yet
        let inicio_str = dever.inicio_or_created();
        let inicio_date = &inicio_str[..inicio_str.len().min(10)];
        if inicio_date > date.as_str() {
            continue;
        }

        let (occurrence_date, is_done, is_overdue) = match &dever {
            Dever::Once {
                fim, completions, ..
            } => {
                if let Some(f) = fim {
                    // Has deadline — show when due or overdue
                    let is_overdue = f.as_str() < date.as_str();
                    let is_due_today = f == date;
                    if !is_due_today && !is_overdue {
                        continue;
                    }
                    let is_done = completions.iter().any(|c| &c.occurrence_date == f);
                    if is_done {
                        continue;
                    }
                    (f.clone(), false, is_overdue)
                } else {
                    // Indefinite — show every day until completed
                    let is_done = completions.iter().any(|c| c.occurrence_date == *date);
                    if is_done {
                        continue;
                    }
                    (date.clone(), false, false)
                }
            }
            Dever::Cyclic {
                recurrence,
                completions,
                fim,
                ..
            } => {
                // Skip cyclic deveres past their end date
                if let Some(f) = fim {
                    if f.as_str() < date.as_str() {
                        continue;
                    }
                }
                if !is_occurrence_on(recurrence, date) {
                    continue;
                }
                let is_done = completions.iter().any(|c| &c.occurrence_date == date);
                (date.clone(), is_done, false)
            }
        };
        dever_items.push(DeverItem {
            dever,
            occurrence_date,
            is_done,
            is_overdue,
        });
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
                DiaryEntry::Quick {
                    grams, nutrients, ..
                } => compute_portion_nutrients(nutrients, *grams),
            };
            totals = add_targets(&totals, &portion);
        }

        let pct = |actual: f64, target: f64| -> f64 {
            if target <= 0.0 {
                0.0
            } else {
                (actual / target * 100.0).round()
            }
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

    // ── Projetos ──────────────────────────────────────────────────────────────
    let projeto_items: Vec<ProjetoItem> = read_all_projetos(&db)
        .into_iter()
        .filter(|p| p.status == ProjetoStatus::Active)
        .map(|projeto| {
            let progress = compute_projeto_progress(&projeto);
            let next_etapas: Vec<Etapa> = get_next_etapas(&projeto).into_iter().cloned().collect();
            ProjetoItem {
                projeto,
                progress,
                next_etapas,
            }
        })
        .collect();

    api_ok(TodaySnapshot {
        date: date.clone(),
        habits,
        deveres: dever_items,
        projetos: projeto_items,
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{
            write_dever, write_diary_entry, write_food, write_habit, write_nutrition_profile,
            write_projeto,
        },
        models::{DeverCompletion, NutritionProfile, RecurrenceConfig},
        routes::test_support::{
            cyclic_dever, food, habit, nutrients, once_dever, projeto, response_json, test_state,
        },
    };

    fn diary_food(id: &str, food_id: &str) -> DiaryEntry {
        DiaryEntry::Food {
            id: id.to_string(),
            date: "2026-04-29".to_string(),
            food_id: food_id.to_string(),
            grams: 100.0,
            meal: None,
            created_at: "2026-04-29T12:00:00.000Z".to_string(),
        }
    }

    fn diary_quick(id: &str) -> DiaryEntry {
        DiaryEntry::Quick {
            id: id.to_string(),
            date: "2026-04-29".to_string(),
            description: "Cafe".to_string(),
            grams: 100.0,
            nutrients: nutrients(),
            meal: None,
            created_at: "2026-04-29T08:00:00.000Z".to_string(),
        }
    }

    #[tokio::test]
    async fn today_rejects_invalid_dates() {
        let state = test_state();
        let response = get_today(
            State(state.clone()),
            Query(TodayQuery {
                date: "29-04-2026".to_string(),
            }),
        )
        .await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn today_snapshot_combines_active_habits_deveres_projects_and_nutrition() {
        let state = test_state();
        {
            let db = state.db.lock().unwrap();
            write_habit(&db, &habit("habit-active", true));
            write_habit(&db, &habit("habit-inactive", false));

            write_dever(&db, &once_dever("once-overdue", true, Some("2026-04-28")));
            write_dever(&db, &once_dever("once-future", true, Some("2026-05-01")));
            write_dever(&db, &once_dever("once-open", true, None));

            let mut completed_once = once_dever("once-completed", true, Some("2026-04-29"));
            if let Dever::Once { completions, .. } = &mut completed_once {
                completions.push(DeverCompletion {
                    occurrence_date: "2026-04-29".to_string(),
                    completed_at: "2026-04-29T10:00:00.000Z".to_string(),
                });
            }
            write_dever(&db, &completed_once);

            let not_started = Dever::Once {
                id: "once-not-started".to_string(),
                title: "Ainda nao".to_string(),
                area: None,
                priority: Priority::Low,
                active: true,
                created_at: "2026-04-01T00:00:00.000Z".to_string(),
                inicio: Some("2026-05-01T00:00:00.000Z".to_string()),
                fim: None,
                completions: vec![],
            };
            write_dever(&db, &not_started);

            write_dever(&db, &cyclic_dever("cyclic-due", true));

            let cyclic_done = Dever::Cyclic {
                id: "cyclic-done".to_string(),
                title: "Revisar".to_string(),
                area: None,
                priority: Priority::Medium,
                active: true,
                created_at: "2026-04-01T00:00:00.000Z".to_string(),
                inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
                fim: Some("2026-12-31".to_string()),
                recurrence: RecurrenceConfig::Weekly {
                    weekdays: vec!["wednesday".to_string()],
                },
                completions: vec![DeverCompletion {
                    occurrence_date: "2026-04-29".to_string(),
                    completed_at: "2026-04-29T12:00:00.000Z".to_string(),
                }],
            };
            write_dever(&db, &cyclic_done);

            let cyclic_past = Dever::Cyclic {
                id: "cyclic-past".to_string(),
                title: "Passado".to_string(),
                area: None,
                priority: Priority::Medium,
                active: true,
                created_at: "2026-04-01T00:00:00.000Z".to_string(),
                inicio: Some("2026-04-01T00:00:00.000Z".to_string()),
                fim: Some("2026-04-01".to_string()),
                recurrence: RecurrenceConfig::Daily,
                completions: vec![],
            };
            write_dever(&db, &cyclic_past);

            write_food(&db, &food("food-1", true));
            write_diary_entry(&db, &diary_food("entry-food", "food-1"));
            write_diary_entry(&db, &diary_food("entry-missing-food", "missing-food"));
            write_diary_entry(&db, &diary_quick("entry-quick"));
            write_nutrition_profile(
                &db,
                &NutritionProfile {
                    weight_kg: 100.0,
                    goal_type: "maintain".to_string(),
                    custom_targets: None,
                },
            );

            write_projeto(&db, &projeto("projeto-active", ProjetoStatus::Active));
            write_projeto(&db, &projeto("projeto-paused", ProjetoStatus::Paused));
        }

        let snapshot = response_json(
            get_today(
                State(state.clone()),
                Query(TodayQuery {
                    date: "2026-04-29".to_string(),
                }),
            )
            .await,
        )
        .await;

        assert_eq!(snapshot["data"]["date"], serde_json::json!("2026-04-29"));

        let habits = snapshot["data"]["habits"].as_array().unwrap();
        assert_eq!(habits.len(), 1);
        assert_eq!(habits[0]["habit"]["id"], serde_json::json!("habit-active"));
        assert_eq!(habits[0]["isDone"], serde_json::json!(true));

        let deveres = snapshot["data"]["deveres"].as_array().unwrap();
        let ids: Vec<&str> = deveres
            .iter()
            .map(|item| item["dever"]["id"].as_str().unwrap())
            .collect();
        assert!(ids.contains(&"once-overdue"));
        assert!(ids.contains(&"once-open"));
        assert!(ids.contains(&"cyclic-due"));
        assert!(ids.contains(&"cyclic-done"));
        assert!(!ids.contains(&"once-future"));
        assert!(!ids.contains(&"once-completed"));
        assert!(!ids.contains(&"once-not-started"));
        assert!(!ids.contains(&"cyclic-past"));
        assert_eq!(deveres[0]["isOverdue"], serde_json::json!(true));
        assert!(deveres.iter().any(
            |item| item["dever"]["id"] == serde_json::json!("cyclic-done")
                && item["isDone"] == serde_json::json!(true)
        ));

        let nutrition = &snapshot["data"]["nutritionSummary"];
        assert_eq!(nutrition["calories"], serde_json::json!(200.0));
        assert_eq!(nutrition["caloriesTarget"], serde_json::json!(2800.0));

        let projetos = snapshot["data"]["projetos"].as_array().unwrap();
        assert_eq!(projetos.len(), 1);
        assert_eq!(
            projetos[0]["projeto"]["id"],
            serde_json::json!("projeto-active")
        );
        assert_eq!(projetos[0]["progress"]["percent"], serde_json::json!(50));
        assert_eq!(projetos[0]["nextEtapas"].as_array().unwrap().len(), 1);
    }
}
