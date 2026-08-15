// lib/recipes.ts
// ⚠️ This file is CLIENT-SAFE - No node-appwrite imports!

import { recipeApi } from "./api-helper";

export type Locale = "en" | "fr" | "ar";

export type Localized<T> = T | Partial<Record<Locale, T>>;

export type Recipe = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  steps: string[];
  tags: string[];
  featured: boolean;
  titleLocales?: Partial<Record<Locale, string>>;
  descriptionLocales?: Partial<Record<Locale, string>>;
  categoryLocales?: Partial<Record<Locale, string>>;
  prepTimeLocales?: Partial<Record<Locale, string>>;
  cookTimeLocales?: Partial<Record<Locale, string>>;
  ingredientsLocales?: Partial<Record<Locale, string[]>>;
  stepsLocales?: Partial<Record<Locale, string[]>>;
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
