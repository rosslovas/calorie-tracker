use std::collections::HashMap;
use std::collections::HashSet;

use multimap::MultiMap;
use rocket::{serde::json::Json, State};
use serde::Deserialize;
use simple_error::bail;
use sqlx::postgres::PgPool;

use crate::entities::*;
use crate::errors::Error;
use crate::models::*;

#[get("/recipes")]
pub async fn recipes(pool: &State<PgPool>) -> Result<Json<Vec<Recipe>>, Error> {
    let mut transaction = pool.inner().begin().await.unwrap();

    let recipe_rows = sqlx::query_as!(
        RecipeRow,
        r#"
            SELECT
                "id",
                "name"
            FROM recipes
            WHERE NOT "deleted"
            ORDER BY "created_on" DESC
        "#
    )
    .fetch_all(&mut transaction)
    .await?;

    let ids: Vec<_> = recipe_rows.iter().map(|g| g.id).collect();

    let recipe_ingredient_rows = sqlx::query_as!(
        RecipeIngredientRow,
        r#"
            SELECT
                "id",
                "recipe_id",
                "ingredient_id",
                "weight_grams"
            FROM recipe_ingredients
            WHERE "recipe_id" = ANY($1)
            ORDER BY "created_on" DESC
        "#,
        &ids
    )
    .fetch_all(&mut transaction)
    .await?;

    let recipe_ingredient_group_rows = sqlx::query_as!(
        RecipeIngredientGroupRow,
        r#"
            SELECT
                "id",
                "recipe_id",
                "ingredient_group_id",
                "weight_grams"
            FROM recipe_ingredient_groups
            WHERE "recipe_id" = ANY($1)
            ORDER BY "created_on" DESC
        "#,
        &ids
    )
    .fetch_all(&mut transaction)
    .await?;

    let ids: Vec<_> = recipe_ingredient_group_rows
        .iter()
        .map(|g| g.ingredient_group_id)
        .collect::<HashSet<_>>()
        .drain()
        .collect();

    let ingredient_group_rows = sqlx::query_as!(
        IngredientGroupRow,
        r#"
            SELECT
                "id",
                "name",
                "deleted",
                "created_on"
            FROM ingredient_groups
            WHERE "id" = ANY($1)
            ORDER BY "created_on" DESC
        "#,
        &ids
    )
    .fetch_all(&mut transaction)
    .await?;

    let ids: Vec<_> = ingredient_group_rows.iter().map(|g| g.id).collect();

    let ingredient_group_ingredient_rows = sqlx::query_as!(
        IngredientGroupIngredientRow,
        r#"
            SELECT
                "id",
                "ingredient_group_id",
                "ingredient_id",
                "weight_grams"
            FROM ingredient_group_ingredients
            WHERE "ingredient_group_id" = ANY($1)
            ORDER BY "created_on" DESC
        "#,
        &ids
    )
    .fetch_all(&mut transaction)
    .await?;

    let ids: Vec<_> = ingredient_group_ingredient_rows
        .iter()
        .map(|i| i.ingredient_id)
        .chain(recipe_ingredient_rows.iter().map(|i| i.ingredient_id))
        .collect::<HashSet<_>>()
        .drain()
        .collect();

    let ingredient_rows = sqlx::query_as!(
        IngredientRow,
        r#"
            SELECT
                "id",
                "name",
                "energy_per_gram",
                "protein_per_gram",
                "fat_per_gram",
                "carbs_per_gram",
                "sugar_per_gram",
                "price_cents",
                "weight_grams",
                "deleted",
                "created_on"
            FROM ingredients
            WHERE "id" = ANY($1)
            ORDER BY "created_on" DESC
        "#,
        &ids
    )
    .fetch_all(&mut transaction)
    .await?;

    transaction.commit().await?;

    let ingredients: HashMap<_, _> = ingredient_rows
        .iter()
        .map(|i| {
            (
                i.id,
                Ingredient::Single {
                    id: i.id,
                    name: i.name.clone(),
                    energy_per_gram: i.energy_per_gram,
                    protein_per_gram: i.protein_per_gram,
                    fat_per_gram: i.fat_per_gram,
                    carbs_per_gram: i.carbs_per_gram,
                    sugar_per_gram: i.sugar_per_gram,
                    price_cents: i.price_cents,
                    weight_grams: i.weight_grams,
                    created_on: i.created_on,
                    deleted: i.deleted,
                },
            )
        })
        .collect();

    let ingredient_group_ingredients: MultiMap<_, _> = ingredient_group_ingredient_rows
        .iter()
        .map(|i| {
            (
                i.ingredient_group_id,
                IngredientGroupIngredient {
                    group_ingredient_id: i.id,
                    group_ingredient_weight_grams: i.weight_grams,
                    ingredient: ingredients.get(&i.ingredient_id).unwrap().clone(),
                },
            )
        })
        .collect();

    let ingredient_groups: HashMap<_, _> = ingredient_group_rows
        .iter()
        .map(|i| {
            (
                i.id,
                Ingredient::new_group(
                    i.id,
                    i.name.clone(),
                    i.deleted,
                    i.created_on,
                    ingredient_group_ingredients.get_vec(&i.id).unwrap().clone(),
                ),
            )
        })
        .collect();

    let recipe_ingredients: MultiMap<_, _> = recipe_ingredient_group_rows
        .iter()
        .map(|i| {
            (
                i.recipe_id,
                RecipeIngredient {
                    recipe_ingredient_id: i.id,
                    recipe_ingredient_weight_grams: i.weight_grams,
                    ingredient: ingredient_groups
                        .get(&i.ingredient_group_id)
                        .unwrap()
                        .clone(),
                },
            )
        })
        .chain(recipe_ingredient_rows.iter().map(|i| {
            (
                i.recipe_id,
                RecipeIngredient {
                    recipe_ingredient_id: i.id,
                    recipe_ingredient_weight_grams: i.weight_grams,
                    ingredient: ingredients.get(&i.ingredient_id).unwrap().clone(),
                },
            )
        }))
        .collect();

    let recipes: Vec<_> = recipe_rows
        .iter()
        .map(|r| {
            Recipe::new(
                r.id,
                r.name.clone(),
                recipe_ingredients.get_vec(&r.id).unwrap().clone(),
            )
        })
        .collect();

    Ok(Json(recipes))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddRecipe {
    name: String,
    ingredients: Vec<AddRecipeIngredient>,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum AddRecipeIngredient {
    #[serde(rename_all = "camelCase")]
    Single {
        ingredient_id: i32,
        weight_grams: i32,
    },
    #[serde(rename_all = "camelCase")]
    Group {
        ingredient_group_id: i32,
        weight_grams: i32,
    },
}

#[post("/recipe", data = "<recipe>")]
pub async fn add_recipe(pool: &State<PgPool>, recipe: Json<AddRecipe>) -> Result<Json<i32>, Error> {
    let recipe = recipe.into_inner();

    let mut transaction = pool.inner().begin().await.unwrap();

    let recipe_id = sqlx::query_scalar!(
        r#"
            INSERT INTO recipes (
                "name"
            )
            VALUES ($1)
            RETURNING id
        "#,
        recipe.name
    )
    .fetch_one(&mut transaction)
    .await?;

    for ingredient in recipe.ingredients.into_iter() {
        match ingredient {
            AddRecipeIngredient::Single {
                ingredient_id,
                weight_grams,
            } => {
                sqlx::query!(
                    r#"
                        INSERT INTO recipe_ingredients (
                            "recipe_id",
                            "ingredient_id",
                            "weight_grams"
                        )
                        VALUES ($1, $2, $3)
                    "#,
                    recipe_id,
                    ingredient_id,
                    weight_grams
                )
                .execute(&mut transaction)
                .await?;
            }
            AddRecipeIngredient::Group {
                ingredient_group_id,
                weight_grams,
            } => {
                sqlx::query!(
                    r#"
                        INSERT INTO recipe_ingredient_groups (
                            "recipe_id",
                            "ingredient_group_id",
                            "weight_grams"
                        )
                        VALUES ($1, $2, $3)
                    "#,
                    recipe_id,
                    ingredient_group_id,
                    weight_grams
                )
                .execute(&mut transaction)
                .await?;
            }
        };
    }

    transaction.commit().await?;

    Ok(Json(recipe_id))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditRecipe {
    id: i32,
    name: String,
}

#[post("/recipe/rename", data = "<recipe>")]
pub async fn edit_recipe(pool: &State<PgPool>, recipe: Json<EditRecipe>) -> Result<(), Error> {
    let recipe = recipe.into_inner();

    let rows_affected = sqlx::query!(
        r#"
            UPDATE recipes SET "name" = $2
            WHERE "id" = $1 AND NOT "deleted"
        "#,
        recipe.id,
        recipe.name
    )
    .execute(pool.inner())
    .await?
    .rows_affected();

    if rows_affected != 1 {
        bail!("Expected 1 row changed but got {}", rows_affected);
    }

    Ok(())
}

#[delete("/recipe/<id>")]
pub async fn delete_recipe(pool: &State<PgPool>, id: i32) -> Result<(), Error> {
    let rows_affected = sqlx::query!("UPDATE recipes SET deleted_on = now() WHERE id = $1", id)
        .execute(pool.inner())
        .await?
        .rows_affected();

    if rows_affected < 1 {
        bail!(
            "Expected at least 1 row to have changed but got {}",
            rows_affected
        );
    }

    Ok(())
}
