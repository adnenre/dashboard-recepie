// lib/recipes.ts
// ⚠️ This file is CLIENT-SAFE - No node-appwrite imports!

import { recipeApi } from "./api-helper";
import { type Locale, type Localized, type Recipe, RecipeInput } from "@/types";

// ============================================================
// ✅ NEW: Ingredient and Step types
// ============================================================

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

// ============================================================
// ✅ NEW: Cooking Methods Helpers
// ============================================================

/**
 * Get a cooking method by its ID
 */
export const getCookingMethod = (id: string) => {
  const { COOKING_METHODS } = require("@/types");
  return COOKING_METHODS.find((method: any) => method.id === id);
};

/**
 * Get all cooking methods for a recipe
 */
export const getRecipeCookingMethods = (recipe: Recipe) => {
  const { COOKING_METHODS } = require("@/types");
  if (!recipe || !recipe.methods) return [];
  return recipe.methods.map((id: string) => COOKING_METHODS.find((method: any) => method.id === id)).filter((method: any) => method !== undefined);
};

/**
 * Check if a recipe uses a specific cooking method
 */
export const recipeUsesMethod = (recipe: Recipe, methodId: string): boolean => {
  if (!recipe || !recipe.methods) return false;
  return recipe.methods.includes(methodId);
};

/**
 * Get the primary cooking method (first one) for a recipe
 */
export const getPrimaryCookingMethod = (recipe: Recipe) => {
  const { COOKING_METHODS } = require("@/types");
  if (!recipe || !recipe.methods || recipe.methods.length === 0) return undefined;
  return COOKING_METHODS.find((method: any) => method.id === recipe.methods[0]);
};

/**
 * Get the icon name for a cooking method (for Feather icons)
 */
export const getMethodIcon = (methodId: string): string => {
  const method = getCookingMethod(methodId);
  return method?.icon || "help-circle";
};

/**
 * Get the label for a cooking method
 */
export const getMethodLabel = (methodId: string): string => {
  const method = getCookingMethod(methodId);
  return method?.label || methodId;
};

/**
 * Check if a cooking method has temperature control
 */
export const methodHasTemp = (methodId: string): boolean => {
  const method = getCookingMethod(methodId);
  return method?.hasTemp || false;
};

/**
 * Get the recommended temperature for a cooking method
 */
export const getMethodTemperature = (methodId: string): string | null => {
  const method = getCookingMethod(methodId);
  if (!method || !method.hasTemp) return null;

  const temperatures: Record<string, string> = {
    four: "180 °C",
    vapeur: "100 °C",
  };

  return temperatures[methodId] || "180 °C";
};

/**
 * Get a formatted string of cooking methods for display
 */
export const getMethodsDisplayString = (recipe: Recipe): string => {
  const methods = getRecipeCookingMethods(recipe);
  return methods.map((m: any) => m.label).join(" • ");
};

/**
 * Check if a recipe has any cooking methods
 */
export const recipeHasMethods = (recipe: Recipe): boolean => {
  return !!(recipe && recipe.methods && recipe.methods.length > 0);
};
