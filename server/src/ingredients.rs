use std::collections::{HashMap, HashSet};

use multimap::MultiMap;
use rocket::{serde::json::Json, State};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Deserialize;
use simple_error::bail;
use sqlx::postgres::PgPool;

use crate::entities::{IngredientGroupIngredientRow, IngredientGroupRow, IngredientRow};
use crate::errors::Error;
use crate::models::{Ingredient, IngredientGroupIngredient};

#[get("/ingredients?<simple>&<summary>")]
pub async fn ingredients(
    pool: &State<PgPool>,
    simple: Option<bool>,
    summary: Option<bool>,
) -> Result<Json<Vec<Ingredient>>, Error> {
    if let Some(s) = simple {
        if s {
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
                    WHERE NOT "deleted"
                    ORDER BY "created_on" DESC
                "#,
            )
            .fetch_all(pool.inner())
            .await?;

            return Ok(Json(
                ingredient_rows
                    .iter()
                    .map(|i| Ingredient::Single {
                        id: i.id,
                        name: i.name.to_string(),
                        energy_per_gram: i.energy_per_gram,
                        protein_per_gram: i.protein_per_gram,
                        fat_per_gram: i.fat_per_gram,
                        carbs_per_gram: i.carbs_per_gram,
                        sugar_per_gram: i.sugar_per_gram,
                        price_cents: i.price_cents,
                        weight_grams: i.weight_grams,
                        created_on: i.created_on,
                        deleted: i.deleted,
                    })
                    .collect::<Vec<_>>(),
            ));
        }
    }

    let mut transaction = pool.inner().begin().await.unwrap();

    let ingredient_group_rows = sqlx::query_as!(
        IngredientGroupRow,
        r#"
            SELECT
                "id",
                "name",
                "deleted",
                "created_on"
            FROM ingredient_groups
            WHERE NOT "deleted"
            ORDER BY "created_on" DESC
        "#
    )
    .fetch_all(&mut transaction)
    .await?;

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
        &ingredient_group_rows
            .iter()
            .map(|g| g.id)
            .collect::<Vec<_>>()
    )
    .fetch_all(&mut transaction)
    .await?;

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
            WHERE NOT "deleted"
                OR ("deleted" AND "id" = ANY($1))
            ORDER BY "created_on" DESC
        "#,
        &ingredient_group_ingredient_rows
            .iter()
            .map(|i| i.ingredient_id)
            .collect::<HashSet<_>>()
            .drain()
            .collect::<Vec<_>>()
    )
    .fetch_all(&mut transaction)
    .await?;

    transaction.commit().await?;

    let ingredients: Vec<_> = ingredient_rows
        .iter()
        .map(|i| Ingredient::Single {
            id: i.id,
            name: i.name.to_string(),
            energy_per_gram: i.energy_per_gram,
            protein_per_gram: i.protein_per_gram,
            fat_per_gram: i.fat_per_gram,
            carbs_per_gram: i.carbs_per_gram,
            sugar_per_gram: i.sugar_per_gram,
            price_cents: i.price_cents,
            weight_grams: i.weight_grams,
            created_on: i.created_on,
            deleted: i.deleted,
        })
        .collect();

    let ingredients_map: HashMap<_, _> = ingredients
        .iter()
        .map(|i| {
            (
                match i {
                    Ingredient::Single { id, .. } => id,
                    _ => panic!(),
                },
                i,
            )
        })
        .collect();

    let ingredient_group_ingredients = match summary {
        Some(true) => None,
        _ => Some(
            ingredient_group_ingredient_rows
                .iter()
                .map(|i| {
                    (
                        i.ingredient_group_id,
                        IngredientGroupIngredient {
                            group_ingredient_id: i.id,
                            group_ingredient_weight_grams: i.weight_grams,
                            ingredient: (*ingredients_map.get(&i.ingredient_id).unwrap()).clone(),
                        },
                    )
                })
                .collect::<MultiMap<_, _>>(),
        ),
    };

    let mut ingredients = ingredient_group_rows
        .iter()
        .map(|i| {
            Ingredient::new_group(
                i.id,
                i.name.to_string(),
                i.deleted,
                i.created_on,
                match &ingredient_group_ingredients {
                    Some(map) => map.get_vec(&i.id).unwrap().clone(),
                    None => vec![],
                },
            )
        })
        .chain(ingredients.into_iter().filter(|i| match i {
            Ingredient::Single { deleted, .. } => !deleted,
            _ => panic!(),
        }))
        .collect::<Vec<_>>();

    ingredients.sort_unstable_by(|a, b| {
        match b {
            Ingredient::Single { created_on, .. } => created_on,
            Ingredient::Group { created_on, .. } => created_on,
        }
        .partial_cmp(match a {
            Ingredient::Single { created_on, .. } => created_on,
            Ingredient::Group { created_on, .. } => created_on,
        })
        .unwrap()
    });

    Ok(Json(ingredients))
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum AddIngredient {
    #[serde(rename_all = "camelCase")]
    Single {
        name: String,
        energy_per_100g: Decimal,
        protein_per_100g: Decimal,
        fat_per_100g: Decimal,
        carbs_per_100g: Decimal,
        sugar_per_100g: Option<Decimal>,
        price_cents: Option<i32>,
        weight_grams: Option<i32>,
    },
    #[serde(rename_all = "camelCase")]
    Group {
        name: String,
        ingredients: Vec<AddGroupIngredient>,
    },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddGroupIngredient {
    ingredient_id: i32,
    weight_grams: i32,
}

#[post("/ingredient", data = "<ingredient>")]
pub async fn add_ingredient(
    pool: &State<PgPool>,
    ingredient: Json<AddIngredient>,
) -> Result<Json<i32>, Error> {
    let ingredient = ingredient.into_inner();

    let id = match ingredient {
        AddIngredient::Single {
            name,
            energy_per_100g,
            protein_per_100g,
            fat_per_100g,
            carbs_per_100g,
            sugar_per_100g,
            price_cents,
            weight_grams,
        } => {
            sqlx::query_scalar!(
                r#"
                    INSERT INTO ingredients (
                        "name",
                        "energy_per_gram",
                        "protein_per_gram",
                        "fat_per_gram",
                        "carbs_per_gram",
                        "sugar_per_gram",
                        "price_cents",
                        "weight_grams"
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                "#,
                name,
                energy_per_100g / dec!(100),
                protein_per_100g / dec!(100),
                fat_per_100g / dec!(100),
                carbs_per_100g / dec!(100),
                sugar_per_100g.map(|n| n / dec!(100)),
                price_cents,
                weight_grams
            )
            .fetch_one(pool.inner())
            .await?
        }
        AddIngredient::Group { name, ingredients } => {
            let mut transaction = pool.inner().begin().await.unwrap();

            let group_id = sqlx::query_scalar!(
                r#"
                    INSERT INTO ingredient_groups (
                        "name"
                    )
                    VALUES ($1)
                    RETURNING id
                "#,
                name
            )
            .fetch_one(&mut transaction)
            .await?;

            for group_ingredient in ingredients.into_iter() {
                sqlx::query!(
                    r#"
                        INSERT INTO ingredient_group_ingredients (
                            "ingredient_group_id",
                            "ingredient_id",
                            "weight_grams"
                        )
                        VALUES ($1, $2, $3)
                    "#,
                    group_id,
                    group_ingredient.ingredient_id,
                    group_ingredient.weight_grams
                )
                .execute(&mut transaction)
                .await?;
            }

            transaction.commit().await?;

            group_id
        }
    };

    Ok(Json(id))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditIngredient {
    kind: String,
    id: i32,
    name: String,
}

#[post("/ingredient/rename", data = "<ingredient>")]
pub async fn rename_ingredient(
    pool: &State<PgPool>,
    ingredient: Json<EditIngredient>,
) -> Result<(), Error> {
    let ingredient = ingredient.into_inner();

    let rows_affected = match ingredient.kind.as_ref() {
        "single" => sqlx::query!(
            r#"
                UPDATE ingredients SET "name" = $2
                WHERE "id" = $1 AND NOT "deleted"
            "#,
            ingredient.id,
            ingredient.name
        )
        .execute(pool.inner())
        .await?
        .rows_affected(),
        "group" => sqlx::query!(
            r#"
                UPDATE ingredient_groups SET "name" = $2
                WHERE "id" = $1 AND NOT "deleted"
            "#,
            ingredient.id,
            ingredient.name
        )
        .execute(pool.inner())
        .await?
        .rows_affected(),
        _ => return Error::err("Unrecognised kind"),
    };

    if rows_affected != 1 {
        bail!("Expected 1 row changed but got {}", rows_affected);
    }

    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteIngredient {
    kind: String,
    id: i32,
}

#[delete("/ingredient", data = "<ingredient>")]
pub async fn delete_ingredient(
    pool: &State<PgPool>,
    ingredient: Json<DeleteIngredient>,
) -> Result<(), Error> {
    let ingredient = ingredient.into_inner();

    let rows_affected = match ingredient.kind.as_ref() {
        "single" => sqlx::query!(
            "UPDATE ingredients SET deleted_on = now() WHERE id = $1",
            ingredient.id
        )
        .execute(pool.inner())
        .await?
        .rows_affected(),
        "group" => {
            let mut transaction = pool.inner().begin().await.unwrap();

            let result = sqlx::query!(
                    "UPDATE ingredient_group_ingredients SET deleted_on = now() WHERE ingredient_group_id = $1",
                    ingredient.id
                )
                .execute(&mut transaction)
                .await?
                .rows_affected()
            +
            sqlx::query!(
                "UPDATE ingredient_groups SET deleted_on = now() WHERE id = $1",
                ingredient.id
            )
                .execute(&mut transaction)
                .await?
                .rows_affected();

            transaction.commit().await?;

            result
        }
        _ => return Error::err("Unrecognised kind"),
    };

    if rows_affected < 1 {
        bail!(
            "Expected at least 1 row to have changed but got {}",
            rows_affected
        );
    }

    Ok(())
}
