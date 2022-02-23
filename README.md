# Calorie Tracker

This is a simple and straightforward progressive web app designed with both desktop and mobile usage in mind, for tracking the macronutrients and
calories of your ingredients and recipes made from those ingredients.

There are no users or accounts, it is designed to be self-hosted on a local network for yourself and your family to share, ideally behind a reverse proxy.

The server is written in Rust and stores everything in a PostgreSQL database which can be created and updated via
[sqlx-cli](https://crates.io/crates/sqlx-cli), while the frontend is a React project written in TypeScript.

Android demo:

https://user-images.githubusercontent.com/6970423/155416264-e83b0bda-371f-42d6-b52d-0349252a9611.mp4
