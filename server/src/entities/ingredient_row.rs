use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

// #[derive(Serialize, Deserialize)]
// #[serde(rename_all = "camelCase")]
pub struct IngredientRow {
    pub id: i32,
    pub name: String,
    pub energy_per_gram: Decimal,
    pub protein_per_gram: Decimal,
    pub fat_per_gram: Decimal,
    pub carbs_per_gram: Decimal,
    pub sugar_per_gram: Option<Decimal>,
    pub price_cents: Option<i32>,
    pub weight_grams: Option<i32>,

    pub deleted: bool,

    pub created_on: DateTime<Utc>,
}
