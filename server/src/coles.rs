use lazy_static::lazy_static;
use regex::Regex;
use rocket::serde::json::Json;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Serialize;
use std::convert::TryFrom;

use crate::errors::{Error, OptionOkOrErr, ResultRemapErr};

fn extract_col2(input: &str) -> Result<String, Error> {
    lazy_static! {
        static ref R1: Regex = Regex::new(r"^.*?,(.+?)(?:,|$)").unwrap();
        static ref R2: Regex = Regex::new(r"^([\d.]+)").unwrap();
    }

    let col = R1
        .captures(input)
        .and_then(|captures| captures.get(1).map(|s| s.as_str()))
        .ok_or_err(format!("Couldn't find column 2 in {}", input))?;

    match col.to_uppercase().as_str() {
        "LESS THAN 1G" => Ok(String::from("0")),
        s => R2
            .captures(s)
            .and_then(|captures| captures.get(1).map(|n| n.as_str().to_string()))
            .ok_or_err(format!("Couldn't find number in {}", s)),
    }
}

fn extract_weight_in_grams(input: &str) -> Result<i32, Error> {
    lazy_static! {
        static ref R: Regex = Regex::new(r"^([\d.]+)\s?((?:[kK]?[gG]|[mM]?[lL])?)$").unwrap();
    }

    let col = R
        .captures(input)
        .map(|captures| {
            (
                captures.get(1).map(|s| s.as_str()).ok_or_err("s"),
                captures.get(2).map(|s| s.as_str()).ok_or_err("s"),
            )
        })
        .ok_or_err(format!("Couldn't find weight in {}", input))?;

    let weight = col.0?.parse::<i32>()?;
    let unit = col.1?.to_uppercase();

    match unit.as_str() {
        "" | "G" | "ML" => Ok(weight),
        "KG" | "L" => Ok(weight * 1000),
        _ => Error::err("Unexpected units"),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ColesNutritionInfo {
    pub name: String,
    pub energy: String,
    pub protein: String,
    pub fat: String,
    pub carbs: String,
    pub sugar: Option<String>,
    pub price_cents: Option<i32>,
    pub weight_grams: Option<i32>,
}

#[get("/coles/<product>")]
pub async fn lookup(product: &str) -> Result<Json<ColesNutritionInfo>, Error> {
    let product = product.strip_suffix('P').unwrap_or(product);

    let url = format!(
        "http://shop.coles.com.au/search/resources/store/20522/productview/ ?partNumber={}P",
        product
    );

    let body: serde_json::Value = reqwest::get(url).await?.json().await?;

    let catalog = &body["catalogEntryView"][0];

    let brand_name = catalog["m"].as_str();
    let product_name = catalog["n"].as_str().ok_or_err("Product name not found")?;
    let name = match brand_name {
        Some(brand) => format!("{} {}", brand, product_name),
        None => product_name.to_string(),
    };

    let attributes = &catalog["a"];
    let energy_str = attributes["N19"][0]
        .as_str()
        .ok_or_err("Energy row not found")?;
    let protein_str = attributes["N50"][0]
        .as_str()
        .ok_or_err("Protein row not found")?;
    let fat_str = attributes["N57"][0]
        .as_str()
        .ok_or_err("Fat row not found")?;
    let carbs_str = attributes["N7"][0]
        .as_str()
        .ok_or_err("Carbs row not found")?;
    let sugar_str = attributes["N55"][0].as_str();
    let price_str = catalog["p1"]["o"].as_str();
    let weight_str = attributes["O3"][0]
        .as_str()
        .or_else(|| attributes["S5"][0].as_str());

    let weight_grams = weight_str.map(|s| extract_weight_in_grams(s)).transpose()?;

    let price_cents = price_str
        .map(|p| {
            p.parse::<Decimal>()
                .remap_err()
                .and_then(|d| i32::try_from((d * dec!(100)).trunc().mantissa()).remap_err())
        })
        .transpose()?;

    let sugar = sugar_str.map(|s| extract_col2(s)).transpose()?;

    Ok(Json(ColesNutritionInfo {
        name,
        energy: extract_col2(energy_str)?,
        protein: extract_col2(protein_str)?,
        fat: extract_col2(fat_str)?,
        carbs: extract_col2(carbs_str)?,
        sugar,
        price_cents,
        weight_grams,
    }))
}
