use chrono::{DateTime, Utc};

pub struct IngredientGroupRow {
    pub id: i32,
    pub name: String,

    pub deleted: bool,

    pub created_on: DateTime<Utc>,
}
