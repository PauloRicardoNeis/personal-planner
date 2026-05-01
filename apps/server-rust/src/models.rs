use chrono::NaiveDate;
use serde::{de::Error as DeError, Deserialize, Deserializer, Serialize};
use std::collections::HashMap;

// ── Priority ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Low,
    Medium,
    High,
}

// ── Habit ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Habit {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    pub active: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    /// Sparse map: date string -> number of times completed that day.
    #[serde(rename = "timesPerDay", default = "default_habit_times_per_day")]
    pub times_per_day: u32,
    #[serde(rename = "valueWeights", default = "default_habit_value_weights")]
    pub value_weights: Vec<f64>,
    #[serde(default, deserialize_with = "deserialize_habit_completions")]
    pub completions: HashMap<String, u32>,
}

fn default_habit_times_per_day() -> u32 {
    1
}

fn default_habit_value_weights() -> Vec<f64> {
    vec![1.0]
}

fn deserialize_habit_completions<'de, D>(deserializer: D) -> Result<HashMap<String, u32>, D::Error>
where
    D: Deserializer<'de>,
{
    let raw = HashMap::<String, serde_json::Value>::deserialize(deserializer)?;
    let mut completions = HashMap::new();

    for (date, value) in raw {
        let count = if value == serde_json::Value::Bool(true) {
            1
        } else if let Some(number) = value.as_u64() {
            u32::try_from(number).unwrap_or(u32::MAX)
        } else if value == serde_json::Value::Bool(false) || value.is_null() {
            0
        } else {
            return Err(D::Error::custom(
                "habit completion must be true or a positive integer",
            ));
        };

        if count > 0 {
            completions.insert(date, count);
        }
    }

    Ok(completions)
}

pub fn normalize_habit_times_per_day(value: Option<u32>) -> u32 {
    value.unwrap_or(1).clamp(1, 99)
}

pub fn normalize_habit_value_weights(
    times_per_day: u32,
    value_weights: Option<Vec<f64>>,
) -> Vec<f64> {
    let valid_weights: Vec<f64> = value_weights
        .unwrap_or_default()
        .into_iter()
        .filter(|weight| weight.is_finite() && *weight > 0.0)
        .collect();
    let fallback = valid_weights.last().copied().unwrap_or(1.0);

    (0..times_per_day as usize)
        .map(|index| valid_weights.get(index).copied().unwrap_or(fallback))
        .collect()
}

fn normalized_habit_weighted_settings(habit: &Habit) -> (u32, Vec<f64>) {
    let times_per_day = normalize_habit_times_per_day(Some(habit.times_per_day));
    let value_weights =
        normalize_habit_value_weights(times_per_day, Some(habit.value_weights.clone()));

    (times_per_day, value_weights)
}

pub fn habit_target_score(habit: &Habit) -> f64 {
    let (times_per_day, value_weights) = normalized_habit_weighted_settings(habit);
    value_weights.iter().take(times_per_day as usize).sum()
}

pub fn habit_score_for_count(habit: &Habit, count: u32) -> f64 {
    if count == 0 {
        return 0.0;
    }

    let (_, value_weights) = normalized_habit_weighted_settings(habit);
    let fallback = value_weights.last().copied().unwrap_or(1.0);
    (0..count as usize)
        .map(|index| value_weights.get(index).copied().unwrap_or(fallback))
        .sum()
}

pub fn habit_is_done_on(habit: &Habit, date: &str) -> bool {
    let count = habit.completions.get(date).copied().unwrap_or(0);
    habit_score_for_count(habit, count) >= habit_target_score(habit)
}

pub fn habit_goal_completions(habit: &Habit) -> HashMap<String, bool> {
    habit
        .completions
        .keys()
        .filter(|date| habit_is_done_on(habit, date))
        .map(|date| (date.clone(), true))
        .collect()
}

// ── Dever ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod habit_tests {
    use super::*;

    #[test]
    fn deserializes_legacy_boolean_completions_with_default_settings() {
        let habit: Habit = serde_json::from_str(
            r#"{
            "id": "habit-legacy",
            "title": "Anki",
            "active": true,
            "createdAt": "2026-04-01T00:00:00.000Z",
            "completions": { "2026-04-28": true }
        }"#,
        )
        .unwrap();

        assert_eq!(habit.times_per_day, 1);
        assert_eq!(habit.value_weights, vec![1.0]);
        assert_eq!(habit.completions.get("2026-04-28"), Some(&1));
    }

    #[test]
    fn preserves_weighted_habit_settings_and_numeric_completions() {
        let habit: Habit = serde_json::from_str(
            r#"{
            "id": "habit-weighted",
            "title": "Escovar os dentes",
            "active": true,
            "createdAt": "2026-04-01T00:00:00.000Z",
            "timesPerDay": 3,
            "valueWeights": [5, 2, 1],
            "completions": { "2026-04-28": 2 }
        }"#,
        )
        .unwrap();

        assert_eq!(habit.times_per_day, 3);
        assert_eq!(habit.value_weights, vec![5.0, 2.0, 1.0]);
        assert_eq!(habit.completions.get("2026-04-28"), Some(&2));
        assert!(!habit_is_done_on(&habit, "2026-04-28"));
    }

    #[test]
    fn marks_weighted_goal_completion_only_when_target_score_is_met() {
        let mut habit = Habit {
            id: "habit-weighted".to_string(),
            title: "Escovar os dentes".to_string(),
            category: None,
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            times_per_day: 3,
            value_weights: vec![5.0, 2.0, 1.0],
            completions: HashMap::from([
                ("2026-04-27".to_string(), 2),
                ("2026-04-28".to_string(), 3),
            ]),
        };

        let goal_completions = habit_goal_completions(&habit);
        assert_eq!(goal_completions.get("2026-04-27"), None);
        assert_eq!(goal_completions.get("2026-04-28"), Some(&true));

        habit.completions.insert("2026-04-29".to_string(), 4);
        assert_eq!(habit_score_for_count(&habit, 4), 9.0);
        assert!(habit_is_done_on(&habit, "2026-04-29"));
    }

    #[test]
    fn scoring_normalizes_malformed_weighted_settings() {
        let habit = Habit {
            id: "habit-malformed".to_string(),
            title: "Anki".to_string(),
            category: None,
            active: true,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            times_per_day: 0,
            value_weights: vec![],
            completions: HashMap::new(),
        };

        assert_eq!(habit_target_score(&habit), 1.0);
        assert_eq!(habit_score_for_count(&habit, 1), 1.0);
        assert!(!habit_is_done_on(&habit, "2026-04-28"));
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeverCompletion {
    #[serde(rename = "occurrenceDate")]
    pub occurrence_date: String,
    #[serde(rename = "completedAt")]
    pub completed_at: String,
}

/// Mirrors the TypeScript discriminated union `OnceDever | CyclicDever`.
/// Uses serde's internally-tagged format: `{ "type": "once" | "cyclic", ...fields }`.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum Dever {
    #[serde(rename = "once")]
    Once {
        id: String,
        title: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        area: Option<String>,
        priority: Priority,
        active: bool,
        #[serde(rename = "createdAt")]
        created_at: String,
        /// ISODateTime — when the dever enters its active window.
        #[serde(default)]
        inicio: Option<String>,
        /// ISODate — the deadline. None = indefinite (no deadline).
        /// Alias allows reading legacy "deadline" field.
        #[serde(alias = "deadline", skip_serializing_if = "Option::is_none", default)]
        fim: Option<String>,
        completions: Vec<DeverCompletion>,
    },
    #[serde(rename = "cyclic")]
    Cyclic {
        id: String,
        title: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        area: Option<String>,
        priority: Priority,
        active: bool,
        #[serde(rename = "createdAt")]
        created_at: String,
        /// ISODateTime — when the dever enters its active window.
        #[serde(default)]
        inicio: Option<String>,
        /// ISODate — optional end of the active window.
        #[serde(skip_serializing_if = "Option::is_none", default)]
        fim: Option<String>,
        recurrence: RecurrenceConfig,
        completions: Vec<DeverCompletion>,
    },
}

impl Dever {
    pub fn id(&self) -> &str {
        match self {
            Dever::Once { id, .. } | Dever::Cyclic { id, .. } => id,
        }
    }

    pub fn active(&self) -> bool {
        match self {
            Dever::Once { active, .. } | Dever::Cyclic { active, .. } => *active,
        }
    }

    pub fn completions(&self) -> &Vec<DeverCompletion> {
        match self {
            Dever::Once { completions, .. } | Dever::Cyclic { completions, .. } => completions,
        }
    }

    pub fn priority(&self) -> &Priority {
        match self {
            Dever::Once { priority, .. } | Dever::Cyclic { priority, .. } => priority,
        }
    }

    /// Returns the inicio timestamp, falling back to createdAt for legacy data.
    pub fn inicio_or_created(&self) -> &str {
        match self {
            Dever::Once {
                inicio, created_at, ..
            }
            | Dever::Cyclic {
                inicio, created_at, ..
            } => inicio.as_deref().unwrap_or(created_at),
        }
    }
}

// ── RecurrenceConfig ──────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum RecurrenceConfig {
    /// Occurs every day.
    #[serde(rename = "daily")]
    Daily,
    /// Occurs on specific weekdays.
    #[serde(rename = "weekly")]
    Weekly { weekdays: Vec<String> },
    /// Occurs on a fixed day of the month, optionally with a window.
    #[serde(rename = "monthly")]
    Monthly {
        #[serde(rename = "monthDay")]
        month_day: u8,
        /// Optional end day of the active window.
        #[serde(rename = "monthDayEnd", skip_serializing_if = "Option::is_none")]
        month_day_end: Option<u8>,
    },
}

// ── Domain logic ──────────────────────────────────────────────────────────────

/// Returns true if `config` calls for an occurrence on `date` (format: "YYYY-MM-DD").
/// Mirrors `isOccurrenceOn` from @planner/core.
pub fn is_occurrence_on(config: &RecurrenceConfig, date: &str) -> bool {
    use chrono::Datelike;
    let Ok(parsed) = NaiveDate::parse_from_str(date, "%Y-%m-%d") else {
        return false;
    };
    match config {
        RecurrenceConfig::Daily => true,
        RecurrenceConfig::Weekly { weekdays } => {
            let weekday = match parsed.weekday() {
                chrono::Weekday::Mon => "monday",
                chrono::Weekday::Tue => "tuesday",
                chrono::Weekday::Wed => "wednesday",
                chrono::Weekday::Thu => "thursday",
                chrono::Weekday::Fri => "friday",
                chrono::Weekday::Sat => "saturday",
                chrono::Weekday::Sun => "sunday",
            };
            weekdays.iter().any(|w| w == weekday)
        }
        RecurrenceConfig::Monthly { month_day, .. } => parsed.day() as u8 == *month_day,
    }
}

// ── Habit Streaks ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
pub struct HabitStreakInfo {
    #[serde(rename = "currentStreak")]
    pub current_streak: u32,
    #[serde(rename = "bestStreak")]
    pub best_streak: u32,
    #[serde(rename = "atRisk")]
    pub at_risk: bool,
    #[serde(rename = "rate30d")]
    pub rate_30d: u32, // 0-100
}

pub fn compute_streaks(
    completions: &HashMap<String, bool>,
    today: &str,
    created_at: &str,
) -> HabitStreakInfo {
    let Ok(today_date) = NaiveDate::parse_from_str(today, "%Y-%m-%d") else {
        return HabitStreakInfo {
            current_streak: 0,
            best_streak: 0,
            at_risk: false,
            rate_30d: 0,
        };
    };

    // Parse created_at — take first 10 chars (date part of ISODateTime)
    let created_str = &created_at[..created_at.len().min(10)];
    let created_date = NaiveDate::parse_from_str(created_str, "%Y-%m-%d").unwrap_or(today_date);

    // Filter completions: only dates <= today and value == true
    let is_done = |d: &NaiveDate| -> bool {
        let key = d.format("%Y-%m-%d").to_string();
        completions.get(&key).copied().unwrap_or(false) && *d <= today_date
    };

    // ── Current streak ────────────────────────────────────────────────────────
    let mut current_streak: u32 = 0;
    let mut at_risk = false;

    if is_done(&today_date) {
        // Start counting from today backwards
        let mut d = today_date;
        while is_done(&d) {
            current_streak += 1;
            match d.pred_opt() {
                Some(prev) => d = prev,
                None => break,
            }
        }
    } else {
        // Today not done — check if yesterday is done (at risk)
        if let Some(yesterday) = today_date.pred_opt() {
            if is_done(&yesterday) {
                at_risk = true;
                let mut d = yesterday;
                while is_done(&d) {
                    current_streak += 1;
                    match d.pred_opt() {
                        Some(prev) => d = prev,
                        None => break,
                    }
                }
            }
        }
    }

    // ── Best streak ───────────────────────────────────────────────────────────
    let mut valid_dates: Vec<NaiveDate> = completions
        .iter()
        .filter(|(_, &v)| v)
        .filter_map(|(k, _)| NaiveDate::parse_from_str(k, "%Y-%m-%d").ok())
        .filter(|d| *d <= today_date)
        .collect();
    valid_dates.sort();

    let mut best_streak: u32 = 0;
    let mut run: u32 = 0;
    for (i, d) in valid_dates.iter().enumerate() {
        if i == 0 {
            run = 1;
        } else {
            let prev = valid_dates[i - 1];
            if *d == prev.succ_opt().unwrap_or(prev) {
                run += 1;
            } else {
                run = 1;
            }
        }
        if run > best_streak {
            best_streak = run;
        }
    }

    // ── Rate 30d ──────────────────────────────────────────────────────────────
    let days_since_creation = (today_date - created_date).num_days().max(0) as u32;
    let denominator = days_since_creation.min(30).max(1);
    let mut done_count: u32 = 0;
    let mut d = today_date;
    for _ in 0..30 {
        if d < created_date {
            break;
        }
        if is_done(&d) {
            done_count += 1;
        }
        match d.pred_opt() {
            Some(prev) => d = prev,
            None => break,
        }
    }
    let rate_30d = ((done_count as f64 / denominator as f64) * 100.0).round() as u32;

    HabitStreakInfo {
        current_streak,
        best_streak,
        at_risk,
        rate_30d: rate_30d.min(100),
    }
}

// ── Projeto ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EtapaStatus {
    Pending,
    InProgress,
    Done,
    Blocked,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ProjetoStatus {
    Planning,
    Active,
    Paused,
    Done,
    Archived,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Etapa {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub status: EtapaStatus,
    pub order: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deadline: Option<String>,
    #[serde(rename = "effortHours", skip_serializing_if = "Option::is_none")]
    pub effort_hours: Option<f64>,
    #[serde(rename = "dependsOn", skip_serializing_if = "Option::is_none")]
    pub depends_on: Option<Vec<String>>,
    #[serde(rename = "completedAt", skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Projeto {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub area: Option<String>,
    pub priority: Priority,
    pub status: ProjetoStatus,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inicio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fim: Option<String>,
    pub etapas: Vec<Etapa>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ProjetoProgress {
    pub completed: usize,
    pub total: usize,
    pub percent: u32,
}

pub fn compute_projeto_progress(projeto: &Projeto) -> ProjetoProgress {
    let total = projeto.etapas.len();
    if total == 0 {
        return ProjetoProgress {
            completed: 0,
            total: 0,
            percent: 0,
        };
    }
    let completed = projeto
        .etapas
        .iter()
        .filter(|e| e.status == EtapaStatus::Done)
        .count();
    let percent = ((completed as f64 / total as f64) * 100.0).round() as u32;
    ProjetoProgress {
        completed,
        total,
        percent,
    }
}

/// Returns etapas that are actionable: not done, all dependencies satisfied.
pub fn get_next_etapas(projeto: &Projeto) -> Vec<&Etapa> {
    let done_ids: std::collections::HashSet<&str> = projeto
        .etapas
        .iter()
        .filter(|e| e.status == EtapaStatus::Done)
        .map(|e| e.id.as_str())
        .collect();

    let mut result: Vec<&Etapa> = projeto
        .etapas
        .iter()
        .filter(|e| e.status != EtapaStatus::Done)
        .filter(|e| {
            e.depends_on.as_ref().map_or(true, |deps| {
                deps.is_empty() || deps.iter().all(|d| done_ids.contains(d.as_str()))
            })
        })
        .collect();
    result.sort_by_key(|e| e.order);
    result
}

// ── Nutrition ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NutrientsPer100g {
    pub calories: f64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub fiber: f64,
    #[serde(rename = "saturatedFat", skip_serializing_if = "Option::is_none")]
    pub saturated_fat: Option<f64>,
    #[serde(rename = "transFat", skip_serializing_if = "Option::is_none")]
    pub trans_fat: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sugar: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sodium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub potassium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub calcium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iron: Option<f64>,
    #[serde(rename = "vitaminA", skip_serializing_if = "Option::is_none")]
    pub vitamin_a: Option<f64>,
    #[serde(rename = "vitaminC", skip_serializing_if = "Option::is_none")]
    pub vitamin_c: Option<f64>,
    #[serde(rename = "vitaminD", skip_serializing_if = "Option::is_none")]
    pub vitamin_d: Option<f64>,
    #[serde(rename = "vitaminB12", skip_serializing_if = "Option::is_none")]
    pub vitamin_b12: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub magnesium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub zinc: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub omega3: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cholesterol: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Food {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(rename = "servingDescription", skip_serializing_if = "Option::is_none")]
    pub serving_description: Option<String>,
    #[serde(rename = "servingGrams", skip_serializing_if = "Option::is_none")]
    pub serving_grams: Option<f64>,
    pub nutrients: NutrientsPer100g,
    pub active: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum DiaryEntry {
    #[serde(rename = "food")]
    Food {
        id: String,
        date: String,
        #[serde(rename = "foodId")]
        food_id: String,
        grams: f64,
        #[serde(skip_serializing_if = "Option::is_none")]
        meal: Option<String>,
        #[serde(rename = "createdAt")]
        created_at: String,
    },
    #[serde(rename = "quick")]
    Quick {
        id: String,
        date: String,
        description: String,
        grams: f64,
        nutrients: NutrientsPer100g,
        #[serde(skip_serializing_if = "Option::is_none")]
        meal: Option<String>,
        #[serde(rename = "createdAt")]
        created_at: String,
    },
}

impl DiaryEntry {
    pub fn id(&self) -> &str {
        match self {
            DiaryEntry::Food { id, .. } | DiaryEntry::Quick { id, .. } => id,
        }
    }
    pub fn date(&self) -> &str {
        match self {
            DiaryEntry::Food { date, .. } | DiaryEntry::Quick { date, .. } => date,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NutritionProfile {
    #[serde(rename = "weightKg")]
    pub weight_kg: f64,
    #[serde(rename = "goalType")]
    pub goal_type: String, // "cut" | "maintain" | "bulk"
    #[serde(rename = "customTargets", skip_serializing_if = "Option::is_none")]
    pub custom_targets: Option<serde_json::Value>, // flexible partial object
}

// ── Nutrition computation ─────────────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
pub struct DailyTargets {
    pub calories: f64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub fiber: f64,
    #[serde(rename = "saturatedFat", skip_serializing_if = "Option::is_none")]
    pub saturated_fat: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sugar: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sodium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub potassium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub calcium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iron: Option<f64>,
    #[serde(rename = "vitaminA", skip_serializing_if = "Option::is_none")]
    pub vitamin_a: Option<f64>,
    #[serde(rename = "vitaminC", skip_serializing_if = "Option::is_none")]
    pub vitamin_c: Option<f64>,
    #[serde(rename = "vitaminD", skip_serializing_if = "Option::is_none")]
    pub vitamin_d: Option<f64>,
    #[serde(rename = "vitaminB12", skip_serializing_if = "Option::is_none")]
    pub vitamin_b12: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub magnesium: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub zinc: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub omega3: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cholesterol: Option<f64>,
}

pub fn compute_portion_nutrients(per100g: &NutrientsPer100g, grams: f64) -> DailyTargets {
    let factor = grams / 100.0;
    DailyTargets {
        calories: per100g.calories * factor,
        protein: per100g.protein * factor,
        carbs: per100g.carbs * factor,
        fat: per100g.fat * factor,
        fiber: per100g.fiber * factor,
        saturated_fat: per100g.saturated_fat.map(|v| v * factor),
        sugar: per100g.sugar.map(|v| v * factor),
        sodium: per100g.sodium.map(|v| v * factor),
        potassium: per100g.potassium.map(|v| v * factor),
        calcium: per100g.calcium.map(|v| v * factor),
        iron: per100g.iron.map(|v| v * factor),
        vitamin_a: per100g.vitamin_a.map(|v| v * factor),
        vitamin_c: per100g.vitamin_c.map(|v| v * factor),
        vitamin_d: per100g.vitamin_d.map(|v| v * factor),
        vitamin_b12: per100g.vitamin_b12.map(|v| v * factor),
        magnesium: per100g.magnesium.map(|v| v * factor),
        zinc: per100g.zinc.map(|v| v * factor),
        omega3: per100g.omega3.map(|v| v * factor),
        cholesterol: per100g.cholesterol.map(|v| v * factor),
    }
}

pub fn compute_daily_targets(profile: &NutritionProfile) -> DailyTargets {
    let w = profile.weight_kg;
    let (cal_mult, prot_mult, fat_mult, fiber) = match profile.goal_type.as_str() {
        "cut" => (22.0, 2.2, 0.8, 25.0),
        "bulk" => (34.0, 2.0, 1.2, 30.0),
        _ => (28.0, 1.8, 1.0, 30.0), // maintain as default
    };
    let calories = w * cal_mult;
    let protein = w * prot_mult;
    let fat = w * fat_mult;
    let carbs = (calories - protein * 4.0 - fat * 9.0) / 4.0;

    let mut targets = DailyTargets {
        calories,
        protein,
        carbs,
        fat,
        fiber,
        saturated_fat: Some((calories * 0.10) / 9.0),
        sugar: Some((calories * 0.10) / 4.0),
        sodium: Some(2300.0),
        potassium: Some(3500.0),
        calcium: Some(1000.0),
        iron: Some(8.0),
        vitamin_a: Some(900.0),
        vitamin_c: Some(90.0),
        vitamin_d: Some(15.0),
        vitamin_b12: Some(2.4),
        magnesium: Some(400.0),
        zinc: Some(11.0),
        omega3: Some(1.6),
        cholesterol: Some(300.0),
    };

    // Apply custom target overrides from profile
    if let Some(custom) = &profile.custom_targets {
        if let Some(v) = custom.get("calories").and_then(|v| v.as_f64()) {
            targets.calories = v;
        }
        if let Some(v) = custom.get("protein").and_then(|v| v.as_f64()) {
            targets.protein = v;
        }
        if let Some(v) = custom.get("carbs").and_then(|v| v.as_f64()) {
            targets.carbs = v;
        }
        if let Some(v) = custom.get("fat").and_then(|v| v.as_f64()) {
            targets.fat = v;
        }
        if let Some(v) = custom.get("fiber").and_then(|v| v.as_f64()) {
            targets.fiber = v;
        }
        if let Some(v) = custom.get("saturatedFat").and_then(|v| v.as_f64()) {
            targets.saturated_fat = Some(v);
        }
        if let Some(v) = custom.get("sugar").and_then(|v| v.as_f64()) {
            targets.sugar = Some(v);
        }
        if let Some(v) = custom.get("sodium").and_then(|v| v.as_f64()) {
            targets.sodium = Some(v);
        }
        if let Some(v) = custom.get("potassium").and_then(|v| v.as_f64()) {
            targets.potassium = Some(v);
        }
        if let Some(v) = custom.get("calcium").and_then(|v| v.as_f64()) {
            targets.calcium = Some(v);
        }
        if let Some(v) = custom.get("iron").and_then(|v| v.as_f64()) {
            targets.iron = Some(v);
        }
        if let Some(v) = custom.get("vitaminA").and_then(|v| v.as_f64()) {
            targets.vitamin_a = Some(v);
        }
        if let Some(v) = custom.get("vitaminC").and_then(|v| v.as_f64()) {
            targets.vitamin_c = Some(v);
        }
        if let Some(v) = custom.get("vitaminD").and_then(|v| v.as_f64()) {
            targets.vitamin_d = Some(v);
        }
        if let Some(v) = custom.get("vitaminB12").and_then(|v| v.as_f64()) {
            targets.vitamin_b12 = Some(v);
        }
        if let Some(v) = custom.get("magnesium").and_then(|v| v.as_f64()) {
            targets.magnesium = Some(v);
        }
        if let Some(v) = custom.get("zinc").and_then(|v| v.as_f64()) {
            targets.zinc = Some(v);
        }
        if let Some(v) = custom.get("omega3").and_then(|v| v.as_f64()) {
            targets.omega3 = Some(v);
        }
        if let Some(v) = custom.get("cholesterol").and_then(|v| v.as_f64()) {
            targets.cholesterol = Some(v);
        }
    }

    targets
}

/// Add two DailyTargets together (for summing diary entry portions).
pub fn add_targets(a: &DailyTargets, b: &DailyTargets) -> DailyTargets {
    fn add_opt(a: Option<f64>, b: Option<f64>) -> Option<f64> {
        match (a, b) {
            (Some(x), Some(y)) => Some(x + y),
            (Some(x), None) => Some(x),
            (None, Some(y)) => Some(y),
            (None, None) => None,
        }
    }
    DailyTargets {
        calories: a.calories + b.calories,
        protein: a.protein + b.protein,
        carbs: a.carbs + b.carbs,
        fat: a.fat + b.fat,
        fiber: a.fiber + b.fiber,
        saturated_fat: add_opt(a.saturated_fat, b.saturated_fat),
        sugar: add_opt(a.sugar, b.sugar),
        sodium: add_opt(a.sodium, b.sodium),
        potassium: add_opt(a.potassium, b.potassium),
        calcium: add_opt(a.calcium, b.calcium),
        iron: add_opt(a.iron, b.iron),
        vitamin_a: add_opt(a.vitamin_a, b.vitamin_a),
        vitamin_c: add_opt(a.vitamin_c, b.vitamin_c),
        vitamin_d: add_opt(a.vitamin_d, b.vitamin_d),
        vitamin_b12: add_opt(a.vitamin_b12, b.vitamin_b12),
        magnesium: add_opt(a.magnesium, b.magnesium),
        zinc: add_opt(a.zinc, b.zinc),
        omega3: add_opt(a.omega3, b.omega3),
        cholesterol: add_opt(a.cholesterol, b.cholesterol),
    }
}

pub fn zero_targets() -> DailyTargets {
    DailyTargets {
        calories: 0.0,
        protein: 0.0,
        carbs: 0.0,
        fat: 0.0,
        fiber: 0.0,
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

// ── Games ──────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: String,
    pub source: String,
    #[serde(rename = "steamAppId")]
    pub steam_app_id: u32,
    pub name: String,
    #[serde(rename = "playtimeMinutes")]
    pub playtime_minutes: u32,
    #[serde(rename = "iconHash", skip_serializing_if = "Option::is_none")]
    pub icon_hash: Option<String>,
    #[serde(rename = "logoHash", skip_serializing_if = "Option::is_none")]
    pub logo_hash: Option<String>,
    #[serde(rename = "lastImportedAt")]
    pub last_imported_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SteamLibrarySettings {
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub profile: String,
    #[serde(rename = "resolvedSteamId", skip_serializing_if = "Option::is_none")]
    pub resolved_steam_id: Option<String>,
    #[serde(rename = "lastSyncedAt", skip_serializing_if = "Option::is_none")]
    pub last_synced_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct SteamSyncResult {
    pub games: Vec<Game>,
    #[serde(rename = "importedCount")]
    pub imported_count: usize,
    #[serde(rename = "syncedAt")]
    pub synced_at: String,
    #[serde(rename = "resolvedSteamId")]
    pub resolved_steam_id: String,
}

#[cfg(test)]
mod domain_tests {
    use super::*;
    use serde_json::json;

    fn sample_nutrients() -> NutrientsPer100g {
        NutrientsPer100g {
            calories: 200.0,
            protein: 10.0,
            carbs: 20.0,
            fat: 8.0,
            fiber: 4.0,
            saturated_fat: Some(3.0),
            trans_fat: Some(0.2),
            sugar: Some(6.0),
            sodium: Some(300.0),
            potassium: Some(450.0),
            calcium: Some(120.0),
            iron: Some(2.0),
            vitamin_a: Some(90.0),
            vitamin_c: Some(12.0),
            vitamin_d: Some(1.5),
            vitamin_b12: Some(0.4),
            magnesium: Some(50.0),
            zinc: Some(1.1),
            omega3: Some(0.3),
            cholesterol: Some(30.0),
        }
    }

    fn etapa(id: &str, status: EtapaStatus, order: i32, depends_on: Option<Vec<&str>>) -> Etapa {
        Etapa {
            id: id.to_string(),
            title: format!("Etapa {id}"),
            description: None,
            status,
            order,
            deadline: None,
            effort_hours: None,
            depends_on: depends_on
                .map(|deps| deps.into_iter().map(|dep| dep.to_string()).collect()),
            completed_at: None,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
        }
    }

    fn projeto_with_etapas(etapas: Vec<Etapa>) -> Projeto {
        Projeto {
            id: "projeto-1".to_string(),
            title: "Projeto".to_string(),
            description: None,
            area: Some("Casa".to_string()),
            priority: Priority::Medium,
            status: ProjetoStatus::Active,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: None,
            fim: None,
            etapas,
        }
    }

    fn assert_close(actual: f64, expected: f64) {
        assert!(
            (actual - expected).abs() < 1e-9,
            "expected {actual} to be close to {expected}"
        );
    }

    #[test]
    fn dever_helpers_cover_once_cyclic_and_legacy_deadline() {
        let once: Dever = serde_json::from_value(json!({
            "type": "once",
            "id": "once-1",
            "title": "Pagar conta",
            "area": "Casa",
            "priority": "high",
            "active": true,
            "createdAt": "2026-04-01T00:00:00.000Z",
            "deadline": "2026-04-10",
            "completions": [
                {
                    "occurrenceDate": "2026-04-10",
                    "completedAt": "2026-04-09T20:00:00.000Z"
                }
            ]
        }))
        .unwrap();

        assert_eq!(once.id(), "once-1");
        assert!(once.active());
        assert_eq!(once.priority(), &Priority::High);
        assert_eq!(once.inicio_or_created(), "2026-04-01T00:00:00.000Z");
        assert_eq!(once.completions().len(), 1);
        assert_eq!(
            serde_json::to_value(&once).unwrap()["fim"],
            json!("2026-04-10")
        );

        let cyclic = Dever::Cyclic {
            id: "cyclic-1".to_string(),
            title: "Revisar".to_string(),
            area: None,
            priority: Priority::Low,
            active: false,
            created_at: "2026-04-01T00:00:00.000Z".to_string(),
            inicio: Some("2026-04-05T00:00:00.000Z".to_string()),
            fim: Some("2026-05-01".to_string()),
            recurrence: RecurrenceConfig::Weekly {
                weekdays: vec!["wednesday".to_string()],
            },
            completions: vec![],
        };

        assert_eq!(cyclic.id(), "cyclic-1");
        assert!(!cyclic.active());
        assert_eq!(cyclic.priority(), &Priority::Low);
        assert_eq!(cyclic.inicio_or_created(), "2026-04-05T00:00:00.000Z");
        assert!(cyclic.completions().is_empty());
    }

    #[test]
    fn recurrence_matches_daily_weekly_monthly_and_rejects_bad_dates() {
        assert!(is_occurrence_on(&RecurrenceConfig::Daily, "2026-04-29"));
        assert!(!is_occurrence_on(&RecurrenceConfig::Daily, "not-a-date"));

        let weekly = RecurrenceConfig::Weekly {
            weekdays: vec!["wednesday".to_string(), "friday".to_string()],
        };
        assert!(is_occurrence_on(&weekly, "2026-04-29"));
        assert!(!is_occurrence_on(&weekly, "2026-04-30"));

        let monthly = RecurrenceConfig::Monthly {
            month_day: 29,
            month_day_end: Some(31),
        };
        assert!(is_occurrence_on(&monthly, "2026-04-29"));
        assert!(!is_occurrence_on(&monthly, "2026-04-28"));
    }

    #[test]
    fn compute_streaks_counts_current_at_risk_best_and_rate() {
        let completions = HashMap::from([
            ("2026-04-08".to_string(), true),
            ("2026-04-09".to_string(), true),
            ("2026-04-10".to_string(), true),
            ("2026-04-12".to_string(), true),
            ("bad-date".to_string(), true),
            ("2026-04-07".to_string(), false),
        ]);

        let current = compute_streaks(&completions, "2026-04-10", "2026-04-01T00:00:00.000Z");
        assert_eq!(current.current_streak, 3);
        assert_eq!(current.best_streak, 3);
        assert!(!current.at_risk);
        assert_eq!(current.rate_30d, 33);

        let at_risk = compute_streaks(&completions, "2026-04-11", "2026-04-01T00:00:00.000Z");
        assert_eq!(at_risk.current_streak, 3);
        assert_eq!(at_risk.best_streak, 3);
        assert!(at_risk.at_risk);
        assert_eq!(at_risk.rate_30d, 30);

        let invalid = compute_streaks(&completions, "bad-date", "bad-created-at");
        assert_eq!(invalid.current_streak, 0);
        assert_eq!(invalid.best_streak, 0);
        assert!(!invalid.at_risk);
        assert_eq!(invalid.rate_30d, 0);
    }

    #[test]
    fn projeto_progress_and_next_steps_respect_completion_and_dependencies() {
        let projeto = projeto_with_etapas(vec![
            etapa("done", EtapaStatus::Done, 2, None),
            etapa("blocked", EtapaStatus::Pending, 0, Some(vec!["missing"])),
            etapa("ready", EtapaStatus::Pending, 3, Some(vec!["done"])),
            etapa("active", EtapaStatus::InProgress, 1, None),
        ]);

        let progress = compute_projeto_progress(&projeto);
        assert_eq!(progress.completed, 1);
        assert_eq!(progress.total, 4);
        assert_eq!(progress.percent, 25);

        let next_ids: Vec<&str> = get_next_etapas(&projeto)
            .into_iter()
            .map(|etapa| etapa.id.as_str())
            .collect();
        assert_eq!(next_ids, vec!["active", "ready"]);

        let empty = projeto_with_etapas(vec![]);
        let empty_progress = compute_projeto_progress(&empty);
        assert_eq!(empty_progress.completed, 0);
        assert_eq!(empty_progress.total, 0);
        assert_eq!(empty_progress.percent, 0);
        assert!(get_next_etapas(&empty).is_empty());
    }

    #[test]
    fn nutrition_computes_portions_targets_overrides_and_sums() {
        let nutrients = sample_nutrients();
        let portion = compute_portion_nutrients(&nutrients, 50.0);
        assert_close(portion.calories, 100.0);
        assert_close(portion.protein, 5.0);
        assert_eq!(portion.saturated_fat, Some(1.5));
        assert_eq!(portion.cholesterol, Some(15.0));

        let maintain = compute_daily_targets(&NutritionProfile {
            weight_kg: 100.0,
            goal_type: "maintain".to_string(),
            custom_targets: None,
        });
        assert_close(maintain.calories, 2800.0);
        assert_close(maintain.protein, 180.0);
        assert_close(maintain.fat, 100.0);
        assert_close(maintain.carbs, 295.0);

        let cut = compute_daily_targets(&NutritionProfile {
            weight_kg: 100.0,
            goal_type: "cut".to_string(),
            custom_targets: None,
        });
        assert_close(cut.calories, 2200.0);
        assert_close(cut.protein, 220.0);
        assert_close(cut.fiber, 25.0);

        let bulk = compute_daily_targets(&NutritionProfile {
            weight_kg: 100.0,
            goal_type: "bulk".to_string(),
            custom_targets: None,
        });
        assert_close(bulk.calories, 3400.0);
        assert_close(bulk.fat, 120.0);

        let custom = compute_daily_targets(&NutritionProfile {
            weight_kg: 80.0,
            goal_type: "custom".to_string(),
            custom_targets: Some(json!({
                "calories": 1234.0,
                "protein": 111.0,
                "carbs": 222.0,
                "fat": 33.0,
                "fiber": 44.0,
                "saturatedFat": 5.0,
                "sugar": 6.0,
                "sodium": 7.0,
                "potassium": 8.0,
                "calcium": 9.0,
                "iron": 10.0,
                "vitaminA": 11.0,
                "vitaminC": 12.0,
                "vitaminD": 13.0,
                "vitaminB12": 14.0,
                "magnesium": 15.0,
                "zinc": 16.0,
                "omega3": 17.0,
                "cholesterol": 18.0
            })),
        });
        assert_close(custom.calories, 1234.0);
        assert_close(custom.fiber, 44.0);
        assert_eq!(custom.vitamin_b12, Some(14.0));
        assert_eq!(custom.cholesterol, Some(18.0));

        let zero = zero_targets();
        let none_plus_some = add_targets(&zero, &portion);
        assert_close(none_plus_some.calories, 100.0);
        assert_eq!(none_plus_some.sodium, Some(150.0));

        let some_plus_none = add_targets(&portion, &zero);
        assert_eq!(some_plus_none.sugar, Some(3.0));

        let some_plus_some = add_targets(&portion, &portion);
        assert_close(some_plus_some.calories, 200.0);
        assert_eq!(some_plus_some.cholesterol, Some(30.0));

        let none_plus_none = add_targets(&zero, &zero);
        assert_close(none_plus_none.calories, 0.0);
        assert_eq!(none_plus_none.saturated_fat, None);
    }

    #[test]
    fn diary_game_and_steam_models_use_frontend_json_contract() {
        let food_entry = DiaryEntry::Food {
            id: "entry-food".to_string(),
            date: "2026-04-29".to_string(),
            food_id: "food-1".to_string(),
            grams: 120.0,
            meal: Some("lunch".to_string()),
            created_at: "2026-04-29T12:00:00.000Z".to_string(),
        };
        let quick_entry = DiaryEntry::Quick {
            id: "entry-quick".to_string(),
            date: "2026-04-30".to_string(),
            description: "Snack".to_string(),
            grams: 80.0,
            nutrients: sample_nutrients(),
            meal: None,
            created_at: "2026-04-30T12:00:00.000Z".to_string(),
        };

        assert_eq!(food_entry.id(), "entry-food");
        assert_eq!(food_entry.date(), "2026-04-29");
        assert_eq!(quick_entry.id(), "entry-quick");
        assert_eq!(quick_entry.date(), "2026-04-30");
        assert_eq!(
            serde_json::to_value(&food_entry).unwrap()["foodId"],
            json!("food-1")
        );

        let game = Game {
            id: "steam:10".to_string(),
            source: "steam".to_string(),
            steam_app_id: 10,
            name: "Counter-Strike".to_string(),
            playtime_minutes: 120,
            icon_hash: Some("icon".to_string()),
            logo_hash: None,
            last_imported_at: "2026-04-29T00:00:00.000Z".to_string(),
        };
        let game_json = serde_json::to_value(&game).unwrap();
        assert_eq!(game_json["steamAppId"], json!(10));
        assert_eq!(game_json["playtimeMinutes"], json!(120));
        assert_eq!(game_json["iconHash"], json!("icon"));
        assert!(game_json.get("logoHash").is_none());

        let settings: SteamLibrarySettings = serde_json::from_value(json!({
            "apiKey": "key",
            "profile": "profile",
            "resolvedSteamId": "765",
            "lastSyncedAt": "2026-04-29T00:00:00.000Z"
        }))
        .unwrap();
        assert_eq!(settings.api_key, "key");
        assert_eq!(settings.resolved_steam_id.as_deref(), Some("765"));

        let result = SteamSyncResult {
            games: vec![game],
            imported_count: 1,
            synced_at: "2026-04-29T00:00:00.000Z".to_string(),
            resolved_steam_id: "765".to_string(),
        };
        let result_json = serde_json::to_value(&result).unwrap();
        assert_eq!(result_json["importedCount"], json!(1));
        assert_eq!(result_json["resolvedSteamId"], json!("765"));
    }
}
