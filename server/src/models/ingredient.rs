use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Serialize;

#[derive(Serialize, Clone)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Ingredient {
    #[serde(rename_all = "camelCase")]
    Single {
        id: i32,
        name: String,
        energy_per_gram: Decimal,
        protein_per_gram: Decimal,
        fat_per_gram: Decimal,
        carbs_per_gram: Decimal,
        sugar_per_gram: Option<Decimal>,
        price_cents: Option<i32>,
        weight_grams: Option<i32>,
        #[serde(skip_serializing_if = "is_false")]
        deleted: bool,
        #[serde(skip)]
        created_on: DateTime<Utc>,
    },
    #[serde(rename_all = "camelCase")]
    Group {
        id: i32,
        name: String,
        energy_per_gram: Decimal,
        protein_per_gram: Decimal,
        fat_per_gram: Decimal,
        carbs_per_gram: Decimal,
        sugar_per_gram: Option<Decimal>,
        ingredients: Vec<IngredientGroupIngredient>,
        #[serde(skip_serializing_if = "is_false")]
        deleted: bool,
        #[serde(skip)]
        created_on: DateTime<Utc>,
    },
}

fn is_false(b: &bool) -> bool {
    !b
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IngredientGroupIngredient {
    pub group_ingredient_id: i32,
    pub group_ingredient_weight_grams: i32,
    #[serde(flatten)]
    pub ingredient: Ingredient,
}

impl Ingredient {
    pub fn new_group(
        id: i32,
        name: String,
        deleted: bool,
        created_on: DateTime<Utc>,
        ingredients: Vec<IngredientGroupIngredient>,
    ) -> Self {
        let sums = ingredients
            .iter()
            .map(|i| {
                let weight_grams = i.group_ingredient_weight_grams as i64;
                let weight_dec = Decimal::from(weight_grams);
                (
                    weight_grams,
                    match i.ingredient {
                        Ingredient::Single {
                            energy_per_gram, ..
                        } => weight_dec * energy_per_gram,
                        _ => unreachable!(),
                    },
                    match i.ingredient {
                        Ingredient::Single {
                            protein_per_gram, ..
                        } => protein_per_gram * weight_dec,
                        _ => unreachable!(),
                    },
                    match i.ingredient {
                        Ingredient::Single { fat_per_gram, .. } => fat_per_gram * weight_dec,
                        _ => unreachable!(),
                    },
                    match i.ingredient {
                        Ingredient::Single { carbs_per_gram, .. } => carbs_per_gram * weight_dec,
                        _ => unreachable!(),
                    },
                    match i.ingredient {
                        Ingredient::Single { sugar_per_gram, .. } => {
                            sugar_per_gram.map(|n| n * weight_dec)
                        }
                        _ => unreachable!(),
                    },
                )
            })
            .fold(
                (0i64, dec!(0), dec!(0), dec!(0), dec!(0), Some(dec!(0))),
                |mut acc, x| {
                    acc.0 += x.0;
                    acc.1 += x.1;
                    acc.2 += x.2;
                    acc.3 += x.3;
                    acc.4 += x.4;
                    if let Some(n) = acc.5.as_mut() {
                        if let Some(m) = x.5 {
                            *n += m;
                        }
                    }
                    acc
                },
            );

        let weight_sum = Decimal::from(sums.0);
        Ingredient::Group {
            id,
            name,
            ingredients,
            energy_per_gram: sums.1 / weight_sum,
            protein_per_gram: sums.2 / weight_sum,
            fat_per_gram: sums.3 / weight_sum,
            carbs_per_gram: sums.4 / weight_sum,
            sugar_per_gram: sums.5.map(|n| n / weight_sum),
            deleted,
            created_on,
        }
    }
}
