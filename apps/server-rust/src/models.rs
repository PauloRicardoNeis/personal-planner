use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
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
    /// Sparse map: date string → true. Only done dates are stored.
    pub completions: HashMap<String, bool>,
}

// ── Dever ─────────────────────────────────────────────────────────────────────

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
            Dever::Once { inicio, created_at, .. } | Dever::Cyclic { inicio, created_at, .. } => {
                inicio.as_deref().unwrap_or(created_at)
            }
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
    let created_date = NaiveDate::parse_from_str(created_str, "%Y-%m-%d")
        .unwrap_or(today_date);

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
        return ProjetoProgress { completed: 0, total: 0, percent: 0 };
    }
    let completed = projeto.etapas.iter().filter(|e| e.status == EtapaStatus::Done).count();
    let percent = ((completed as f64 / total as f64) * 100.0).round() as u32;
    ProjetoProgress { completed, total, percent }
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
