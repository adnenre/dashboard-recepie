// app/api/recipes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/appwrite-admin";
import { verifyAdmin } from "@/lib/admin-auth";

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

function parseArray(value: unknown): string[] {
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
    return [];
  }
}

function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignore.
    }
  }

  return {};
}

function normalizeRecipe(id: string, data: Record<string, any>) {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    image: String(data.image ?? ""),
    category: String(data.category ?? ""),
    prepTime: String(data.prepTime ?? ""),
    cookTime: String(data.cookTime ?? ""),
    servings: typeof data.servings === "number" ? data.servings : Number(data.servings) || 1,
    difficulty: data.difficulty === "Medium" || data.difficulty === "Hard" ? data.difficulty : "Easy",
    ingredients: parseArray(data.ingredients),
    steps: parseArray(data.steps),
    tags: parseArray(data.tags),
    featured: typeof data.featured === "boolean" ? data.featured : String(data.featured).toLowerCase() === "true",
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
// GET /api/recipes/:id
// ============================================================

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    try {
      const result = await tablesDB.getRow({
        databaseId,
        tableId,
        rowId: id,
      });

      const recipe = normalizeRecipe(result.$id, result);

      return NextResponse.json(recipe);
    } catch (error: any) {
      if (error?.code === 404) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Error fetching recipe:", error);

    if (error?.message === "Not authenticated") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (error?.message === "Admin privileges required") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    return NextResponse.json({ error: error?.message || "Failed to fetch recipe" }, { status: error?.code >= 400 ? error.code : 500 });
  }
}

// ============================================================
// PUT /api/recipes/:id (Full update)
// ============================================================

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!body.category || !String(body.category).trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    // Check if recipe exists
    try {
      await tablesDB.getRow({
        databaseId,
        tableId,
        rowId: id,
      });
    } catch (error: any) {
      if (error?.code === 404) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
      throw error;
    }

    const result = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: id,
      data: prepareRecipeForDB(body),
    });

    const recipe = normalizeRecipe(result.$id, result);

    return NextResponse.json({
      success: true,
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error: any) {
    console.error("❌ Error updating recipe:", error);

    if (error?.message === "Not authenticated") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (error?.message === "Admin privileges required") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    return NextResponse.json({ error: error?.message || "Failed to update recipe" }, { status: error?.code >= 400 ? error.code : 500 });
  }
}

// ============================================================
// PATCH /api/recipes/:id (Partial update)
// ============================================================

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { id } = await context.params;

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

    // Check if recipe exists
    let existingRow;
    try {
      existingRow = await tablesDB.getRow({
        databaseId,
        tableId,
        rowId: id,
      });
    } catch (error: any) {
      if (error?.code === 404) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
      throw error;
    }

    // Merge existing data with updates
    const mergedData = {
      ...existingRow,
      ...body,
    };

    const result = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: id,
      data: prepareRecipeForDB(mergedData),
    });

    const recipe = normalizeRecipe(result.$id, result);

    return NextResponse.json({
      success: true,
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error: any) {
    console.error("❌ Error updating recipe:", error);

    if (error?.message === "Not authenticated") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (error?.message === "Admin privileges required") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    return NextResponse.json({ error: error?.message || "Failed to update recipe" }, { status: error?.code >= 400 ? error.code : 500 });
  }
}

// ============================================================
// DELETE /api/recipes/:id
// ============================================================

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    // Check if recipe exists
    try {
      await tablesDB.getRow({
        databaseId,
        tableId,
        rowId: id,
      });
    } catch (error: any) {
      if (error?.code === 404) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
      throw error;
    }

    await tablesDB.deleteRow({
      databaseId,
      tableId,
      rowId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting recipe:", error);

    if (error?.message === "Not authenticated") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (error?.message === "Admin privileges required") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    return NextResponse.json({ error: error?.message || "Failed to delete recipe" }, { status: error?.code >= 400 ? error.code : 500 });
  }
}
