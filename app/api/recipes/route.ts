// app/api/recipes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// ============================================================
// Helpers
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

function parseArray(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    try {
      const cleaned = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

      const parsed = JSON.parse(cleaned);

      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
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

// ============================================================
// Normalize
// ============================================================

function normalizeRecipe(id: string, data: Record<string, unknown>) {
  return {
    id,

    title: getString(data.title),
    description: getString(data.description),
    image: cleanImageUrl(data.image),

    category: getString(data.category),

    prepTime: getString(data.prepTime),
    cookTime: getString(data.cookTime),

    servings: getNumber(data.servings),

    difficulty: data.difficulty === "Medium" || data.difficulty === "Hard" ? data.difficulty : "Easy",

    ingredients: parseArray(data.ingredients),
    steps: parseArray(data.steps),
    tags: parseArray(data.tags),

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
// Prepare
// ============================================================

function prepareRecipeForDB(input: Record<string, any>) {
  return {
    title: input.title,
    description: input.description,

    image: input.image ?? "",

    category: input.category,

    prepTime: input.prepTime ?? "",
    cookTime: input.cookTime ?? "",

    servings: input.servings ?? 1,

    difficulty: input.difficulty ?? "Easy",

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
