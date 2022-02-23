CREATE TABLE ingredient_groups (
    "id"          serial PRIMARY KEY,
    "name"        text NOT NULL,

    "created_on"  timestamptz NOT NULL DEFAULT now(),
    "deleted_on"  timestamptz NOT NULL DEFAULT '-infinity',
    "deleted"     boolean NOT NULL GENERATED ALWAYS AS (deleted_on != '-infinity') STORED,

    UNIQUE ("name", "deleted_on")
);

CREATE TABLE ingredient_group_ingredients (
    "id"                   serial PRIMARY KEY,
    "ingredient_group_id"  integer NOT NULL REFERENCES ingredient_groups,
    "ingredient_id"        integer NOT NULL REFERENCES ingredients,
    "weight_grams"         integer NOT NULL,

    "created_on"           timestamptz NOT NULL DEFAULT now(),
    "deleted_on"           timestamptz NOT NULL DEFAULT '-infinity',
    "deleted"              boolean NOT NULL GENERATED ALWAYS AS (deleted_on != '-infinity') STORED,

    UNIQUE ("ingredient_group_id", "ingredient_id", "deleted_on")
);

INSERT INTO ingredient_groups ("name") VALUES ('Cereal');

INSERT INTO ingredient_group_ingredients ("ingredient_group_id", "ingredient_id", "weight_grams")
VALUES
    (1, 1, 765),
    (1, 2, 400),
    (1, 3, 300),
    (1, 4, 125);

