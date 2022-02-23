use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Serialize;

use super::Ingredient;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Recipe {
    pub id: i32,
    pub name: String,

    pub weight_grams: i64,

    pub energy: Decimal,
    pub protein: Decimal,
    pub fat: Decimal,
    pub carbs: Decimal,
    pub sugar: Option<Decimal>,

    pub ingredients: Vec<RecipeIngredient>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecipeIngredient {
    pub recipe_ingredient_id: i32,
    pub recipe_ingredient_weight_grams: i32,
    #[serde(flatten)]
    pub ingredient: Ingredient,
}

impl Recipe {
    pub fn new(id: i32, name: String, ingredients: Vec<RecipeIngredient>) -> Self {
        let sums = ingredients
            .iter()
            .map(|i| {
                let weight_grams = i.recipe_ingredient_weight_grams as i64;
                let weight_dec = Decimal::from(weight_grams);
                (
                    weight_grams,
                    weight_dec
                        * match i.ingredient {
                            Ingredient::Single {
                                energy_per_gram, ..
                            } => energy_per_gram,
                            Ingredient::Group {
                                energy_per_gram, ..
                            } => energy_per_gram,
                        },
                    weight_dec
                        * match i.ingredient {
                            Ingredient::Single {
                                protein_per_gram, ..
                            } => protein_per_gram,
                            Ingredient::Group {
                                protein_per_gram, ..
                            } => protein_per_gram,
                        },
                    weight_dec
                        * match i.ingredient {
                            Ingredient::Single { fat_per_gram, .. } => fat_per_gram,
                            Ingredient::Group { fat_per_gram, .. } => fat_per_gram,
                        },
                    weight_dec
                        * match i.ingredient {
                            Ingredient::Single { carbs_per_gram, .. } => carbs_per_gram,
                            Ingredient::Group { carbs_per_gram, .. } => carbs_per_gram,
                        },
                    match i.ingredient {
                        Ingredient::Single { sugar_per_gram, .. } => {
                            sugar_per_gram.map(|n| n * weight_dec)
                        }
                        Ingredient::Group { sugar_per_gram, .. } => {
                            sugar_per_gram.map(|n| n * weight_dec)
                        }
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

        Recipe {
            id,
            name,

            weight_grams: sums.0,

            energy: sums.1,
            protein: sums.2,
            fat: sums.3,
            carbs: sums.4,
            sugar: sums.5,

            ingredients,
        }
    }
}
