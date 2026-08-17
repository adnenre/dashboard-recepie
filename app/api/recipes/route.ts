// app/api/recipes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { type Ingredient, type Step, type Recipe } from "@/lib/recipes";

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
    } catch {
      // Ignore.
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
  } catch {
    try {
      const cleaned = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

      const parsed = JSON.parse(cleaned);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      // Ignore.
    }
  }

  return fallback;
}

// ============================================================
// Parse ingredients as objects (not strings)
// ============================================================

function parseIngredients(value: unknown): Ingredient[] {
  if (value === null || value === undefined) {
    return [];
  }

  // If it's already an array of objects
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => {
        // If item is already an Ingredient object
        if (typeof item === "object" && item !== null && "name" in item) {
          return {
            name: String(item.name || ""),
            grams: typeof item.grams === "number" ? item.grams : 0,
            unit: String(item.unit || "g"),
          };
        }
        // If item is a string, try to parse it
        if (typeof item === "string") {
          try {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed === "object" && "name" in parsed) {
              return {
                name: String(parsed.name || ""),
                grams: typeof parsed.grams === "number" ? parsed.grams : 0,
                unit: String(parsed.unit || "g"),
              };
            }
          } catch {
            // Not a JSON string, ignore
          }
        }
        // Default fallback
        return { name: String(item), grams: 0, unit: "g" };
      });
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseIngredients(parsed);
      }
    } catch {
      // Not a JSON string
    }
  }

  return [];
}

// ============================================================
// Parse steps as objects (not strings)
// ============================================================

function parseSteps(value: unknown): Step[] {
  if (value === null || value === undefined) {
    return [];
  }

  // If it's already an array of objects
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => {
        // If item is already a Step object
        if (typeof item === "object" && item !== null && "text" in item) {
          return {
            text: String(item.text || ""),
            cooking: typeof item.cooking === "boolean" ? item.cooking : false,
            timerMin: typeof item.timerMin === "number" ? item.timerMin : 0,
          };
        }
        // If item is a string, try to parse it
        if (typeof item === "string") {
          try {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed === "object" && "text" in parsed) {
              return {
                text: String(parsed.text || ""),
                cooking: typeof parsed.cooking === "boolean" ? parsed.cooking : false,
                timerMin: typeof parsed.timerMin === "number" ? parsed.timerMin : 0,
              };
            }
          } catch {
            // Not a JSON string, ignore
          }
        }
        // Default fallback
        return { text: String(item), cooking: false, timerMin: 0 };
      });
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseSteps(parsed);
      }
    } catch {
      // Not a JSON string
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
    return value.filter((item) => item !== null && item !== undefined).map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // Not a JSON string
    }
  }

  return [];
}

// ============================================================
// Normalize recipe - handles objects correctly
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

    // Parse as objects, not strings
    ingredients: parseIngredients(data.ingredients),
    steps: parseSteps(data.steps),
    tags: parseTags(data.tags),

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

    // Stringify arrays for Appwrite
    ingredients: stringifyJson(input.ingredients ?? []),
    steps: stringifyJson(input.steps ?? []),
    tags: stringifyJson(input.tags ?? []),

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

function errorResponse(error: any) {
  console.error("❌ Recipes API error:", error);

  if (error?.message === "Not authenticated") {
    return NextResponse.json(
      {
        error: "Authentication required",
      },
      { status: 401 },
    );
  }

  if (error?.message === "Admin privileges required") {
    return NextResponse.json(
      {
        error: "Admin privileges required",
      },
      { status: 403 },
    );
  }

  const status = typeof error?.code === "number" && error.code >= 400 && error.code <= 599 ? error.code : 500;

  return NextResponse.json(
    {
      error: error?.message || "Internal server error",
    },
    { status },
  );
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
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
        },
        { status: 400 },
      );
    }

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json(
        {
          error: "Title is required",
        },
        { status: 400 },
      );
    }

    if (!body.category || !String(body.category).trim()) {
      return NextResponse.json(
        {
          error: "Category is required",
        },
        { status: 400 },
      );
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
    } catch {
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
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    // Get existing recipe
    const existing = await tablesDB.getRow({
      databaseId,
      tableId,
      rowId: id,
    });

    // Merge with existing data
    const mergedData = {
      ...existing,
      ...body,
      // Stringify arrays if provided
      ingredients: body.ingredients ? stringifyJson(body.ingredients) : existing.ingredients,
      steps: body.steps ? stringifyJson(body.steps) : existing.steps,
      tags: body.tags ? stringifyJson(body.tags) : existing.tags,
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
