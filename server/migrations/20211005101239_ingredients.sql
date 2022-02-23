CREATE TABLE ingredients (
    "id"                 serial PRIMARY KEY,
    "name"               text NOT NULL,
    "energy_per_gram"    numeric(4, 2) NOT NULL,
    "protein_per_gram"   numeric(5, 4) NOT NULL,
    "fat_per_gram"       numeric(5, 4) NOT NULL,
    "carbs_per_gram"     numeric(5, 4) NOT NULL,
    "sugar_per_gram"     numeric(5, 4),
    "price_cents"        integer,
    "weight_grams"       integer,

    "created_on"         timestamptz NOT NULL DEFAULT now(),
    "deleted_on"         timestamptz NOT NULL DEFAULT '-infinity',
    "deleted"            boolean NOT NULL GENERATED ALWAYS AS (deleted_on != '-infinity') STORED,

    UNIQUE ("name", "deleted_on")
);

INSERT INTO ingredients (
    "name",
    "energy_per_gram",
    "protein_per_gram",
    "fat_per_gram",
    "carbs_per_gram",
    "sugar_per_gram",
    "price_cents",
    "weight_grams"
)
VALUES (
    'Coles Toasted Original Muesli',
    1880/100.0,
    11.6/100.0,
    17.0/100.0,
    58.7/100.0,
    16.7/100.0,
    350,
    750
), (
    'Drakes Rolled Oats',
    1590/100.0,
    12.7/100.0,
    9.0/100.0,
    55.1/100.0,
    1.3/100.0,
    184,
    750
), (
    'Coles Quick Oats',
    1570/100.0,
    12.7/100.0,
    8.2/100.0,
    55.8/100.0,
    1.2/100.0,
    165,
    900
), (
    'WPC (Chocolate)',
    1657/100.0,
    74.4/100.0,
    6.4/100.0,
    9.3/100.0,
    5.7/100.0,
    1980,
    1000
), (
    'Coles Regular Soy Milk',
    244/100.0,
    3.1/100.0,
    3.0/100.0,
    4.7/100.0,
    1.6/100.0,
    115,
    1000
), (
    'Mckenzie''s Whole Green Lentils',
    1440/100.0,
    27.6/100.0,
    2.6/100.0,
    43.2/100.0,
    1.3/100.0,
    465,
    1000
);
