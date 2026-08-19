// app/api/configuration/translations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getTranslationById, updateTranslation, deleteTranslation } from "@/lib/appwrite-translation";
import { UpdateTranslationPayload } from "@/types/translation";

/**
 * GET /api/configuration/translations/[id]
 * Get a specific translation by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    await verifyAdmin(request);

    const { id } = await params;

    const translation = await getTranslationById(id);

    if (!translation) {
      return NextResponse.json({ error: "Translation not found" }, { status: 404 });
    }

    return NextResponse.json(translation);
  } catch (error: any) {
    console.error("Error fetching translation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch translation" },
      { status: error.message === "Not authenticated" ? 401 : error.message === "Admin privileges required" ? 403 : 500 },
    );
  }
}

/**
 * PUT /api/configuration/translations/[id]
 * Update a translation
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    await verifyAdmin(request);

    const { id } = await params;

    // Check if translation exists
    const existing = await getTranslationById(id);
    if (!existing) {
      return NextResponse.json({ error: "Translation not found" }, { status: 404 });
    }

    // Parse request body
    const body: UpdateTranslationPayload = await request.json();

    // Update translation
    const updated = await updateTranslation(id, body);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating translation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update translation" },
      { status: error.message === "Not authenticated" ? 401 : error.message === "Admin privileges required" ? 403 : 500 },
    );
  }
}

/**
 * DELETE /api/configuration/translations/[id]
 * Delete a translation
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    await verifyAdmin(request);

    const { id } = await params;

    // Check if translation exists
    const existing = await getTranslationById(id);
    if (!existing) {
      return NextResponse.json({ error: "Translation not found" }, { status: 404 });
    }

    // Delete translation
    await deleteTranslation(id);

    return NextResponse.json({ message: "Translation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting translation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete translation" },
      { status: error.message === "Not authenticated" ? 401 : error.message === "Admin privileges required" ? 403 : 500 },
    );
  }
}
