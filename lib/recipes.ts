// lib/recipes.ts
import { ID } from "appwrite";
import { createAppwriteClient, createAdminClient } from "./appwrite-admin";

// CLIENT-SIDE: Use TablesDB with user session (no API key)
const { tablesDB, databaseId, tableId } = createAppwriteClient();

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

// Helper to stringify JSON for storage
function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) return "{}";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

// Helper to get localized value
export function localizedValue<T>(value: Localized<T>, locale: Locale): T {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value as T;
  const localized = value as Partial<Record<Locale, T>>;
  return localized[locale] ?? localized.en ?? localized.fr ?? localized.ar ?? ("" as T);
}

// ============================================
// FIXED: normalizeRecipe with proper parsing
// ============================================
function normalizeRecipe(id: string, data: Record<string, unknown>): Recipe {
  // Helper to get a plain string value
  const getString = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    return String(value);
  };

  // Helper to get a number
  const getNumber = (value: unknown): number => {
    if (value === null || value === undefined) return 1;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1;
  };

  // Helper to get a boolean
  const getBoolean = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return Boolean(value);
  };

  // Helper to parse JSON array (handles double-escaping)
  const parseArray = (value: unknown): string[] => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        let clean = value;
        if (clean.includes('\\"')) {
          clean = clean.replace(/\\"/g, '"');
        }
        if (clean.includes("\\\\")) {
          clean = clean.replace(/\\\\/g, "\\");
        }
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper to parse JSON object (handles double-escaping)
  const parseObject = <T>(value: unknown, fallback: T = {} as T): T => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "object" && !Array.isArray(value)) return value as T;
    if (typeof value === "string") {
      try {
        let clean = value;
        if (clean.includes('\\"')) {
          clean = clean.replace(/\\"/g, '"');
        }
        if (clean.includes("\\\\")) {
          clean = clean.replace(/\\\\/g, "\\");
        }
        const parsed = JSON.parse(clean);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as T;
        }
        return fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  // Helper to clean image URL (removes escaped slashes)
  const cleanImageUrl = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value !== "string") return "";

    let url = value;

    // Remove escaped slashes: https:\/\/ -> https://
    if (url.includes("\\/")) {
      url = url.replace(/\\\//g, "/");
    }

    // Remove any remaining backslashes
    if (url.includes("\\")) {
      url = url.replace(/\\/g, "");
    }

    // If it's wrapped in quotes, try to parse it
    if (url.startsWith('"') && url.endsWith('"')) {
      try {
        url = JSON.parse(url);
      } catch {
        // Not valid JSON, continue
      }
    }

    url = url.trim();

    // Only return if it's a valid URL
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url;
    }

    return "";
  };

  return {
    id,
    // Simple string values - get directly from data
    title: getString(data.title),
    description: getString(data.description),
    image: cleanImageUrl(data.image),
    category: getString(data.category),
    prepTime: getString(data.prepTime),
    cookTime: getString(data.cookTime),
    servings: getNumber(data.servings),
    difficulty: (data.difficulty as Recipe["difficulty"]) || "Easy",

    // Arrays - parse from JSON strings
    ingredients: parseArray(data.ingredients),
    steps: parseArray(data.steps),
    tags: parseArray(data.tags),

    // Boolean
    featured: getBoolean(data.featured),

    // Locale objects - parse from JSON strings
    titleLocales: parseObject<Partial<Record<Locale, string>>>(data.titleLocales),
    descriptionLocales: parseObject<Partial<Record<Locale, string>>>(data.descriptionLocales),
    categoryLocales: parseObject<Partial<Record<Locale, string>>>(data.categoryLocales),
    prepTimeLocales: parseObject<Partial<Record<Locale, string>>>(data.prepTimeLocales),
    cookTimeLocales: parseObject<Partial<Record<Locale, string>>>(data.cookTimeLocales),
    ingredientsLocales: parseObject<Partial<Record<Locale, string[]>>>(data.ingredientsLocales, {}),
    stepsLocales: parseObject<Partial<Record<Locale, string[]>>>(data.stepsLocales, {}),
    tagsLocales: parseObject<Partial<Record<Locale, string[]>>>(data.tagsLocales, {}),
  };
}

// Prepare recipe data for TablesDB (stringify arrays and objects)
function prepareRecipeForDB(input: RecipeInput): Record<string, unknown> {
  return {
    title: input.title,
    description: input.description,
    image: input.image, // ← Don't stringify the image URL!
    category: input.category,
    prepTime: input.prepTime,
    cookTime: input.cookTime,
    servings: input.servings,
    difficulty: input.difficulty,
    ingredients: stringifyJson(input.ingredients),
    steps: stringifyJson(input.steps),
    tags: stringifyJson(input.tags),
    featured: input.featured,
    titleLocales: stringifyJson(input.titleLocales ?? {}),
    descriptionLocales: stringifyJson(input.descriptionLocales ?? {}),
    categoryLocales: stringifyJson(input.categoryLocales ?? {}),
    prepTimeLocales: stringifyJson(input.prepTimeLocales ?? {}),
    cookTimeLocales: stringifyJson(input.cookTimeLocales ?? {}),
    ingredientsLocales: stringifyJson(input.ingredientsLocales ?? {}),
    stepsLocales: stringifyJson(input.stepsLocales ?? {}),
    tagsLocales: stringifyJson(input.tagsLocales ?? {}),
  };
}

// CLIENT-SIDE: List recipes
export async function listRecipes() {
  try {
    const snapshot = await tablesDB.listRows({
      databaseId: databaseId,
      tableId: tableId,
    });
    console.log("snapshot", snapshot.rows);
    const normalised = snapshot.rows.map((row: any) => normalizeRecipe(row.$id, row));
    console.log("normalised", normalised);
    return normalised;
  } catch (error) {
    console.error("Error listing recipes:", error);
    throw error;
  }
}

// CLIENT-SIDE: Create recipe
export async function createRecipe(input: RecipeInput) {
  try {
    const prepared = prepareRecipeForDB(input);
    const rowId = ID.unique();
    const result = await tablesDB.createRow({
      databaseId: databaseId,
      tableId: tableId,
      rowId: rowId,
      data: prepared,
    });

    return normalizeRecipe(result.$id, result.data || {});
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
}

// CLIENT-SIDE: Update recipe
export async function updateRecipe(id: string, input: RecipeInput) {
  try {
    const prepared = prepareRecipeForDB(input);
    const result = await tablesDB.updateRow({
      databaseId: databaseId,
      tableId: tableId,
      rowId: id,
      data: prepared,
    });

    return normalizeRecipe(result.$id, result.data || {});
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}

// CLIENT-SIDE: Delete recipe
export async function removeRecipe(id: string) {
  try {
    await tablesDB.deleteRow({
      databaseId: databaseId,
      tableId: tableId,
      rowId: id,
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
}

// SERVER-ONLY: Seed recipes
export async function seedRecipes(recipes: RecipeInput[]) {
  const { tablesDB: adminTablesDB, databaseId: adminDbId, tableId: adminTId } = createAdminClient();
  const results: Recipe[] = [];

  for (const recipe of recipes) {
    const existing = await adminTablesDB.listRows({
      databaseId: adminDbId,
      tableId: adminTId,
      queries: [`title="${recipe.title}"`],
    });

    if (existing.rows.length > 1) {
      throw new Error(`Multiple recipes exist with title "${recipe.title}"`);
    }

    if (existing.rows.length === 1) {
      const existingId = existing.rows[0].$id;
      console.log(`↻ Updating: ${recipe.title}`);
      const prepared = prepareRecipeForDB(recipe);
      const result = await adminTablesDB.updateRow({
        databaseId: adminDbId,
        tableId: adminTId,
        rowId: existingId,
        data: prepared,
      });
      results.push(normalizeRecipe(result.$id, result.data || {}));
    } else {
      console.log(`+ Creating: ${recipe.title}`);
      const prepared = prepareRecipeForDB(recipe);
      const rowId = ID.unique();
      const result = await adminTablesDB.createRow({
        databaseId: adminDbId,
        tableId: adminTId,
        rowId: rowId,
        data: prepared,
      });
      results.push(normalizeRecipe(result.$id, result.data || {}));
    }
  }

  return results;
}
