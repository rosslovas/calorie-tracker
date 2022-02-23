use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeRow {
    pub id: i32,
    pub name: String,
}
