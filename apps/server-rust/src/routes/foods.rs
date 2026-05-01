use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    db::{read_all_foods, read_food_by_id, write_food},
    models::{Food, NutrientsPer100g},
    routes::{api_err, api_ok, now_iso},
    AppState,
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
            if b.is_empty() {
                None
            } else {
                Some(b)
            }
        }),
        category: body.category.and_then(|c| {
            let c = c.trim().to_string();
            if c.is_empty() {
                None
            } else {
                Some(c)
            }
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

pub async fn archive_food(State(state): State<AppState>, Path(id): Path<String>) -> Response {
    let db = state.db.lock().unwrap();
    let Some(mut food) = read_food_by_id(&db, &id) else {
        return api_err(StatusCode::NOT_FOUND, &format!("Food not found: {id}"));
    };
    food.active = false;
    write_food(&db, &food);
    api_ok(serde_json::Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::{read_all_foods, read_food_by_id, write_food},
        routes::test_support::{food, nutrients, response_json, test_state},
    };

    #[tokio::test]
    async fn create_get_update_and_archive_foods() {
        let state = test_state();

        let invalid = create_food(
            State(state.clone()),
            Json(CreateFoodBody {
                name: "   ".to_string(),
                brand: None,
                category: None,
                serving_description: None,
                serving_grams: None,
                nutrients: nutrients(),
            }),
        )
        .await;
        assert_eq!(invalid.status(), StatusCode::BAD_REQUEST);

        let created = create_food(
            State(state.clone()),
            Json(CreateFoodBody {
                name: "  Arroz  ".to_string(),
                brand: Some("  ".to_string()),
                category: Some(" Graos ".to_string()),
                serving_description: Some("1 prato".to_string()),
                serving_grams: Some(100.0),
                nutrients: nutrients(),
            }),
        )
        .await;
        assert_eq!(created.status(), StatusCode::OK);

        let food_id = {
            let db = state.db.lock().unwrap();
            let stored = read_all_foods(&db);
            assert_eq!(stored.len(), 1);
            assert_eq!(stored[0].name, "Arroz");
            assert_eq!(stored[0].brand, None);
            assert_eq!(stored[0].category.as_deref(), Some("Graos"));
            stored[0].id.clone()
        };

        {
            let db = state.db.lock().unwrap();
            write_food(&db, &food("inactive-food", false));
        }
        let list = response_json(get_foods(State(state.clone())).await).await;
        assert_eq!(list["data"].as_array().unwrap().len(), 1);

        let updated = update_food(
            State(state.clone()),
            Path(food_id.clone()),
            Json(UpdateFoodBody {
                name: Some("Arroz integral".to_string()),
                brand: Some(" Marca ".to_string()),
                category: Some("".to_string()),
                serving_description: Some("2 colheres".to_string()),
                serving_grams: Some(50.0),
                nutrients: Some(NutrientsPer100g {
                    calories: 150.0,
                    ..nutrients()
                }),
                active: Some(false),
            }),
        )
        .await;
        assert_eq!(updated.status(), StatusCode::OK);

        {
            let db = state.db.lock().unwrap();
            let stored = read_food_by_id(&db, &food_id).unwrap();
            assert_eq!(stored.name, "Arroz integral");
            assert_eq!(stored.brand.as_deref(), Some("Marca"));
            assert_eq!(stored.category, None);
            assert_eq!(stored.serving_description.as_deref(), Some("2 colheres"));
            assert_eq!(stored.serving_grams, Some(50.0));
            assert_eq!(stored.nutrients.calories, 150.0);
            assert!(!stored.active);
        }

        let missing_update = update_food(
            State(state.clone()),
            Path("missing".to_string()),
            Json(UpdateFoodBody {
                name: None,
                brand: None,
                category: None,
                serving_description: None,
                serving_grams: None,
                nutrients: None,
                active: None,
            }),
        )
        .await;
        assert_eq!(missing_update.status(), StatusCode::NOT_FOUND);

        let archive = archive_food(State(state.clone()), Path(food_id.clone())).await;
        assert_eq!(archive.status(), StatusCode::OK);

        let missing_archive = archive_food(State(state.clone()), Path("missing".to_string())).await;
        assert_eq!(missing_archive.status(), StatusCode::NOT_FOUND);
    }
}
