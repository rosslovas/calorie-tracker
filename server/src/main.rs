#[macro_use]
extern crate rocket;

use rocket::fs::{relative, FileServer, NamedFile};

mod coles;
mod entities;
mod errors;
mod ingredients;
mod models;
mod recipes;

#[get("/<_..>", rank = 3)]
async fn fallback_route() -> Option<NamedFile> {
    NamedFile::open("../client/build/index.html").await.ok()
}

#[launch]
async fn rocket() -> _ {
    let postgres_pool = sqlx::PgPool::connect("postgres://postgres@localhost/foods")
        .await
        .expect("Failed to connect to database");

    rocket::build()
        .manage(postgres_pool)
        .mount(
            "/api",
            routes![
                ingredients::ingredients,
                ingredients::add_ingredient,
                ingredients::rename_ingredient,
                ingredients::delete_ingredient,
                recipes::recipes,
                recipes::add_recipe,
                recipes::edit_recipe,
                recipes::delete_recipe,
                coles::lookup
            ],
        )
        .mount("/", FileServer::from("../client/build").rank(2))
        .mount("/", routes![fallback_route])
}
