CREATE TABLE recipes (
    "id"          serial PRIMARY KEY,
    "name"        text NOT NULL,

    "created_on"  timestamptz NOT NULL DEFAULT now(),
    "deleted_on"  timestamptz NOT NULL DEFAULT '-infinity',
    "deleted"     boolean NOT NULL GENERATED ALWAYS AS (deleted_on != '-infinity') STORED,

    UNIQUE ("name", "deleted_on")
);

CREATE SEQUENCE recipe_ingredients_id_seq;

CREATE TABLE recipe_ingredients (
    "id"                   integer PRIMARY KEY DEFAULT nextval('recipe_ingredients_id_seq'),
    "recipe_id"            integer NOT NULL REFERENCES recipes,
    "ingredient_id"        integer NOT NULL REFERENCES ingredients,
    "weight_grams"         integer NOT NULL,

    "created_on"           timestamptz NOT NULL DEFAULT now(),
    "deleted_on"           timestamptz NOT NULL DEFAULT '-infinity',
    "deleted"              boolean NOT NULL GENERATED ALWAYS AS (deleted_on != '-infinity') STORED,

    UNIQUE ("recipe_id", "ingredient_id", "deleted_on")
);

CREATE TABLE recipe_ingredient_groups (
    "id"                   integer PRIMARY KEY DEFAULT nextval('recipe_ingredients_id_seq'),
    "recipe_id"            integer NOT NULL REFERENCES recipes,
    "ingredient_group_id"  integer NOT NULL REFERENCES ingredient_groups,
    "weight_grams"         integer NOT NULL,

    "created_on"           timestamptz NOT NULL DEFAULT now(),
    "deleted_on"           timestamptz NOT NULL DEFAULT '-infinity',
    "deleted"              boolean NOT NULL GENERATED ALWAYS AS (deleted_on != '-infinity') STORED,

    UNIQUE ("recipe_id", "ingredient_group_id", "deleted_on")
);

INSERT INTO recipes ("name") VALUES ('Cereal with Soy Milk');

INSERT INTO recipe_ingredient_groups ("recipe_id", "ingredient_group_id", "weight_grams")
VALUES (1, 1, 200);

INSERT INTO recipe_ingredients ("recipe_id", "ingredient_id", "weight_grams")
VALUES (1, 5, 300);
