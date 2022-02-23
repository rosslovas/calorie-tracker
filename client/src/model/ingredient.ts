export interface IngredientCommon {
    id: number;
    name: string;
    energyPerGram: string;
    proteinPerGram: string;
    fatPerGram: string;
    carbsPerGram: string;
    sugarPerGram: string | null;
    deleted?: true;
}

export interface SingleIngredient extends IngredientCommon {
    kind: 'single';
    priceCents: number | null;
    weightGrams: number | null;
}

interface IngredientGroup extends IngredientCommon {
    kind: 'group';
    ingredients: readonly GroupIngredient[];
}

export type Ingredient = SingleIngredient | IngredientGroup;

export interface GroupIngredient extends SingleIngredient {
    groupIngredientId: number;
    groupIngredientWeightGrams: number;
    ingredients: readonly GroupIngredient[];
}
