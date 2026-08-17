// app/api/recipes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { type Ingredient, type Step, type Recipe } from "@/types";

export const dynamic = "force-dynamic";

// ============================================================
// Helper Functions
// ============================================================

function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "{}";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function getString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 1;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 1;
  }

  return 1;
}

function getBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

function cleanImageUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  let url = value.trim();

  if (url.startsWith('"') && url.endsWith('"')) {
    try {
      url = JSON.parse(url);
    } catch (error) {
      console.warn("Failed to parse image URL:", error);
    }
  }

  url = url.replace(/\\\//g, "/").replace(/\\/g, "").trim();

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return "";
}

function parseObject<T>(value: unknown, fallback: T = {} as T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch (error) {
    console.warn("Failed to parse object:", error);
  }

  return fallback;
}

// ============================================================
// Parse ingredients as objects
// ============================================================

function parseIngredients(value: unknown): Ingredient[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    const result: Ingredient[] = [];

    for (const item of value) {
      if (item === null || item === undefined) continue;

      if (typeof item === "object" && item !== null && "name" in item) {
        result.push({
          name: String(item.name || ""),
          grams: typeof item.grams === "number" ? item.grams : 0,
          unit: String(item.unit || "g"),
        });
        continue;
      }

      if (typeof item === "string") {
        if (item === "[object Object]") continue;

        try {
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === "object" && "name" in parsed) {
            result.push({
              name: String(parsed.name || ""),
              grams: typeof parsed.grams === "number" ? parsed.grams : 0,
              unit: String(parsed.unit || "g"),
            });
            continue;
          }
        } catch {
          // Not valid JSON, skip
        }
      }

      // Default fallback for any other type
      result.push({ name: String(item), grams: 0, unit: "g" });
    }

    return result;
  }

  if (typeof value === "string") {
    if (value === "[object Object]") return [];

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseIngredients(parsed);
      }
    } catch {
      // Not valid JSON, return empty
      return [];
    }
  }

  return [];
}

// ============================================================
// Parse steps as objects (FIXED)
// ============================================================

function parseSteps(value: unknown): Step[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    const result: Step[] = [];

    for (const item of value) {
      if (item === null || item === undefined) continue;

      if (typeof item === "object" && item !== null && "text" in item) {
        result.push({
          text: String(item.text || ""),
          cooking: typeof item.cooking === "boolean" ? item.cooking : false,
          timerMin: typeof item.timerMin === "number" ? item.timerMin : 0,
        });
        continue;
      }

      if (typeof item === "string") {
        if (item === "[object Object]") continue;

        try {
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === "object" && "text" in parsed) {
            result.push({
              text: String(parsed.text || ""),
              cooking: typeof parsed.cooking === "boolean" ? parsed.cooking : false,
              timerMin: typeof parsed.timerMin === "number" ? parsed.timerMin : 0,
            });
            continue;
          }
        } catch {
          // Not valid JSON, skip
        }
      }

      // Default fallback for any other type
      result.push({ text: String(item), cooking: false, timerMin: 0 });
    }

    return result;
  }

  if (typeof value === "string") {
    if (value === "[object Object]") return [];

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseSteps(parsed);
      }
    } catch {
      // Not valid JSON, return empty
      return [];
    }
  }

  return [];
}

// ============================================================
// Parse tags as strings
// ============================================================

function parseTags(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    const result: string[] = [];
    for (const item of value) {
      if (item === null || item === undefined) continue;
      const str = String(item);
      if (str !== "[object Object]") {
        result.push(str);
      }
    }
    return result;
  }

  if (typeof value === "string") {
    if (value === "[object Object]") return [];

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // Not valid JSON, try to split by comma
      if (value.includes(",")) {
        return value.split(",").map((item) => item.trim());
      }
      return value ? [value] : [];
    }
  }

  return [];
}

// ============================================================
// Parse methods as strings (array of method IDs)
// ============================================================

function parseMethods(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    const result: string[] = [];
    for (const item of value) {
      if (item === null || item === undefined) continue;
      const str = String(item);
      if (str !== "[object Object]") {
        result.push(str);
      }
    }
    return result;
  }

  if (typeof value === "string") {
    if (value === "[object Object]") return [];

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // Not valid JSON
      return [];
    }
  }

  return [];
}

// ============================================================
// Normalize recipe
// ============================================================

function normalizeRecipe(id: string, data: Record<string, unknown>): Recipe {
  return {
    id,
    title: getString(data.title),
    description: getString(data.description),
    image: cleanImageUrl(data.image),
    category: getString(data.category),
    prepTime: getString(data.prepTime),
    cookTime: getString(data.cookTime),
    time: getString(data.time),
    duration: getString(data.duration),
    durationMin: getString(data.durationMin),
    servings: getNumber(data.servings),
    difficulty: data.difficulty === "Medium" || data.difficulty === "Hard" ? data.difficulty : "Easy",
    ingredients: parseIngredients(data.ingredients),
    steps: parseSteps(data.steps),
    tags: parseTags(data.tags),
    methods: parseMethods(data.methods),
    featured: getBoolean(data.featured),
    titleLocales: parseObject(data.titleLocales),
    descriptionLocales: parseObject(data.descriptionLocales),
    categoryLocales: parseObject(data.categoryLocales),
    prepTimeLocales: parseObject(data.prepTimeLocales),
    cookTimeLocales: parseObject(data.cookTimeLocales),
    ingredientsLocales: parseObject(data.ingredientsLocales),
    stepsLocales: parseObject(data.stepsLocales),
    tagsLocales: parseObject(data.tagsLocales),
  };
}

// ============================================================
// Prepare recipe for database (stringify arrays)
// ============================================================

function prepareRecipeForDB(input: Record<string, any>) {
  return {
    title: input.title,
    description: input.description,
    image: input.image ?? "",
    category: input.category,
    prepTime: input.prepTime ?? "",
    cookTime: input.cookTime ?? "",
    time: input.time ?? "",
    duration: input.duration ?? "",
    durationMin: input.durationMin ?? "",
    servings: input.servings ?? 1,
    difficulty: input.difficulty ?? "Easy",
    ingredients: stringifyJson(input.ingredients ?? []),
    steps: stringifyJson(input.steps ?? []),
    tags: stringifyJson(input.tags ?? []),
    methods: stringifyJson(input.methods ?? []),
    featured: Boolean(input.featured),
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

// ============================================================
// Error response
// ============================================================

function errorResponse(error: unknown) {
  console.error("❌ Recipes API error:", error);

  const errorMessage = error instanceof Error ? error.message : "Internal server error";
  const errorCode = error && typeof error === "object" && "code" in error ? (error as { code: number }).code : 500;

  if (errorMessage === "Not authenticated") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (errorMessage === "Admin privileges required") {
    return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
  }

  const status = errorCode >= 400 && errorCode <= 599 ? errorCode : 500;

  return NextResponse.json({ error: errorMessage }, { status });
}

// ============================================================
// GET /api/recipes
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { tablesDB, databaseId, tableId } = createAdminClient();

    const result = await tablesDB.listRows({
      databaseId,
      tableId,
    });

    const recipes = result.rows.map((row: any) => normalizeRecipe(row.$id, row));

    return NextResponse.json(recipes, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ============================================================
// POST /api/recipes
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch (error) {
      console.warn("Invalid JSON body:", error);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!body.category || !String(body.category).trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    const prepared = prepareRecipeForDB(body);

    const result = await tablesDB.createRow({
      databaseId,
      tableId,
      rowId: ID.unique(),
      data: prepared,
    });

    const recipe = normalizeRecipe(result.$id, result);

    return NextResponse.json(
      {
        success: true,
        message: "Recipe created successfully",
        recipe,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// ============================================================
// PUT /api/recipes - Full update
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch (error) {
      console.warn("Invalid JSON body:", error);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    const prepared = prepareRecipeForDB(body);

    const result = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: id,
      data: prepared,
    });

    const recipe = normalizeRecipe(result.$id, result);

    return NextResponse.json({
      success: true,
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ============================================================
// PATCH /api/recipes - Partial update
// ============================================================

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch (error) {
      console.warn("Invalid JSON body:", error);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    const existing = await tablesDB.getRow({
      databaseId,
      tableId,
      rowId: id,
    });

    const mergedData = {
      ...existing,
      ...body,
      ingredients: body.ingredients ? stringifyJson(body.ingredients) : existing.ingredients,
      steps: body.steps ? stringifyJson(body.steps) : existing.steps,
      tags: body.tags ? stringifyJson(body.tags) : existing.tags,
      methods: body.methods ? stringifyJson(body.methods) : existing.methods,
    };

    const result = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: id,
      data: mergedData,
    });

    const recipe = normalizeRecipe(result.$id, result);

    return NextResponse.json({
      success: true,
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ============================================================
// DELETE /api/recipes
// ============================================================

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    await tablesDB.deleteRow({
      databaseId,
      tableId,
      rowId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
