use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    AppState,
    db::{read_all_foods, read_food_by_id, write_food},
    models::{Food, NutrientsPer100g},
    routes::{api_err, api_ok, now_iso},
};

// ── GET /foods ────────────────────────────────────────────────────────────────

pub async fn get_foods(State(state): State<AppState>) -> Response {
    let db = state.db.lock().unwrap();
    let foods: Vec<Food> = read_all_foods(&db)
        .into_iter()
        .filter(|f| f.active)
        .collect();
    api_ok(foods)
}

// ── POST /foods ───────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct CreateFoodBody {
    pub name: String,
    pub brand: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "servingDescription")]
    pub serving_description: Option<String>,
    #[serde(rename = "servingGrams")]
    pub serving_grams: Option<f64>,
    pub nutrients: NutrientsPer100g,
}

pub async fn create_food(
    State(state): State<AppState>,
    Json(body): Json<CreateFoodBody>,
) -> Response {
    if body.name.trim().is_empty() {
        return api_err(StatusCode::BAD_REQUEST, "name is required");
    }
    let food = Food {
        id: Uuid::new_v4().to_string(),
        name: body.name.trim().to_string(),
        brand: body.brand.and_then(|b| {
            let b = b.trim().to_string();
            if b.is_empty() { None } else { Some(b) }
        }),
        category: body.category.and_then(|c| {
            let c = c.trim().to_string();
            if c.is_empty() { None } else { Some(c) }
        }),
        serving_description: body.serving_description,
        serving_grams: body.serving_grams,
        nutrients: body.nutrients,
        active: true,
        created_at: now_iso(),
    };
    let db = state.db.lock().unwrap();
    write_food(&db, &food);
    api_ok(food)
}

// ── PATCH /foods/:id ──────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct UpdateFoodBody {
    pub name: Option<String>,
    pub brand: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "servingDescription")]
    pub serving_description: Option<String>,
    #[serde(rename = "servingGrams")]
    pub serving_grams: Option<f64>,
    pub nutrients: Option<NutrientsPer100g>,
    pub active: Option<bool>,
}

pub async fn update_food(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateFoodBody>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut food) = read_food_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Food not found: {id}"));
    };
    if let Some(name) = body.name {
        food.name = name;
    }
    if let Some(brand) = body.brand {
        let b = brand.trim().to_string();
        food.brand = if b.is_empty() { None } else { Some(b) };
    }
    if let Some(category) = body.category {
        let c = category.trim().to_string();
        food.category = if c.is_empty() { None } else { Some(c) };
    }
    if let Some(sd) = body.serving_description {
        food.serving_description = Some(sd);
    }
    if let Some(sg) = body.serving_grams {
        food.serving_grams = Some(sg);
    }
    if let Some(nutrients) = body.nutrients {
        food.nutrients = nutrients;
    }
    if let Some(active) = body.active {
        food.active = active;
    }
    write_food(&db, &food);
    api_ok(food)
}

// ── POST /foods/:id/archive ──────────────────────────────────────────────────

pub async fn archive_food(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut food) = read_food_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Food not found: {id}"));
    };
    food.active = false;
    write_food(&db, &food);
    api_ok(serde_json::Value::Null)
}
