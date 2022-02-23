import { GroupIngredient, IngredientCommon } from "./ingredient";

export interface Recipe {
    id: number;
    name: string;
    weightGrams: number;
    energy: string;
    protein: string;
    fat: string;
    carbs: string;
    sugar: string | null;
    ingredients: readonly RecipeIngredient[];
}

export type RecipeIngredient = RecipeSingleIngredient | RecipeGroupIngredient;

export interface RecipeIngredientCommon extends IngredientCommon {
    recipeIngredientId: number;
    recipeIngredientWeightGrams: number;
    deleted?: true;
}

export interface RecipeSingleIngredient extends RecipeIngredientCommon {
    kind: 'single';
    priceCents: number | null;
    weightGrams: number | null;
}

export interface RecipeGroupIngredient extends RecipeIngredientCommon {
    kind: 'group';
    ingredients: readonly GroupIngredient[];
}
