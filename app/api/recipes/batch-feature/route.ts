// app/api/recipes/batch-feature/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// ============================================================
// POST /api/recipes/batch-feature - Batch update featured status
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    let body: {
      recipes: Array<{ id: string; featured: boolean }>;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { recipes } = body;

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: "Recipes array is required" }, { status: 400 });
    }

    const { tablesDB, databaseId, tableId } = createAdminClient();

    // ⭐ BATCH UPDATE: Update all recipes in one call
    const updatePromises = recipes.map((recipe) =>
      tablesDB.updateRow({
        databaseId,
        tableId,
        rowId: recipe.id,
        data: {
          featured: recipe.featured,
        },
      }),
    );

    const results = await Promise.all(updatePromises);

    // Get the featured recipe info
    const featuredRecipe = recipes.find((r) => r.featured === true);
    const featuredCount = recipes.filter((r) => r.featured === true).length;

    return NextResponse.json({
      success: true,
      message:
        featuredCount > 0
          ? `Successfully updated ${results.length} recipes. ${featuredCount} recipe(s) featured.`
          : `Successfully unfeatured all ${results.length} recipes.`,
      updatedCount: results.length,
      featuredRecipe: featuredRecipe || null,
      featuredCount,
    });
  } catch (error) {
    console.error("❌ Error in batch feature update:", error);

    // ✅ FIX: Properly handle error with type guard
    const errorMessage = error instanceof Error ? error.message : "Failed to update recipes";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
