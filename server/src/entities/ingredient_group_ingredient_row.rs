use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngredientGroupIngredientRow {
    pub id: i32,
    pub ingredient_group_id: i32,
    pub ingredient_id: i32,
    pub weight_grams: i32,
}
