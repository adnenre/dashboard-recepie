// lib/recipes.ts
// ⚠️ This file is CLIENT-SAFE - No node-appwrite imports!

import { recipeApi } from "./api-helper";

export type Locale = "en" | "fr" | "ar";

export type Localized<T> = T | Partial<Record<Locale, T>>;

// ============================================================
// ✅ NEW: Ingredient and Step types
// ============================================================

export type Ingredient = {
  name: string;
  grams: number;
  unit: string;
};

export type Step = {
  text: string;
  cooking?: boolean;
  timerMin?: number;
};

// ============================================================
// ✅ UPDATED: Main Recipe Types
// ============================================================

export type Recipe = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  prepTime: string;
  cookTime: string;
  // ✅ ADDED: New fields
  time: string;
  duration: string;
  durationMin: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  // ✅ Changed from string[] to Ingredient[]
  ingredients: Ingredient[];
  // ✅ Changed from string[] to Step[]
  steps: Step[];
  tags: string[];
  featured: boolean;
  titleLocales?: Partial<Record<Locale, string>>;
  descriptionLocales?: Partial<Record<Locale, string>>;
  categoryLocales?: Partial<Record<Locale, string>>;
  prepTimeLocales?: Partial<Record<Locale, string>>;
  cookTimeLocales?: Partial<Record<Locale, string>>;
  // ✅ Updated to use Ingredient[] and Step[]
  ingredientsLocales?: Partial<Record<Locale, Ingredient[]>>;
  stepsLocales?: Partial<Record<Locale, Step[]>>;
  tagsLocales?: Partial<Record<Locale, string[]>>;
};

export type RecipeInput = Omit<Recipe, "id">;

// ============================================================
// Localized helper
// ============================================================

export function localizedValue<T>(value: Localized<T>, locale: Locale): T {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value as T;
  }

  const localized = value as Partial<Record<Locale, T>>;
  return localized[locale] ?? localized.en ?? localized.fr ?? localized.ar ?? ("" as T);
}

// ============================================================
// Recipe API Functions - Using api-helper
// ============================================================

// GET /api/recipes
export async function listRecipes(): Promise<Recipe[]> {
  return recipeApi.list();
}

// GET /api/recipes/:id
export async function getRecipe(id: string): Promise<Recipe> {
  return recipeApi.get(id);
}

// POST /api/recipes
export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const result = await recipeApi.create(input);
  return result.recipe;
}

// PATCH /api/recipes/:id
export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe> {
  const result = await recipeApi.patch(id, input);
  return result.recipe;
}

// DELETE /api/recipes/:id
export async function removeRecipe(id: string): Promise<void> {
  await recipeApi.delete(id);
}

// Batch update featured status - ONE CALL
export async function batchUpdateFeatured(recipes: Array<{ id: string; featured: boolean }>): Promise<{
  updatedCount: number;
  featuredRecipe: { id: string; featured: boolean } | null;
  featuredCount: number;
}> {
  const result = await recipeApi.batchUpdateFeatured(recipes);
  return {
    updatedCount: result.updatedCount,
    featuredRecipe: result.featuredRecipe,
    featuredCount: result.featuredCount,
  };
}

export async function toggleFeaturedWithBatch(recipeId: string, featured: boolean, allRecipes: Array<{ id: string; featured: boolean }>) {
  // Create the updated recipes array
  const updatedRecipes = allRecipes.map((recipe) => ({
    id: recipe.id,
    // If featuring: only the selected recipe gets true, all others get false
    // If unfeaturing: all get false
    featured: featured ? recipe.id === recipeId : false,
  }));

  // Send all recipes in one call
  const result = await batchUpdateFeatured(updatedRecipes);

  return result;
}
