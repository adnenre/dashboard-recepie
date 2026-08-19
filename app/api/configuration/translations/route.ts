// app/api/configuration/translations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

import { createAdminClient, TABLES } from "@/lib/appwrite-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// ============================================================
// Error response
// ============================================================

function errorResponse(error: unknown) {
  console.error("❌ Translations API error:", error);

  const errorMessage = error instanceof Error ? error.message : "Internal server error";

  if (errorMessage === "Not authenticated") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (errorMessage === "Admin privileges required") {
    return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
  }

  return NextResponse.json({ error: errorMessage }, { status: 500 });
}

// ============================================================
// Rebuild nested object from flat keys
// ============================================================

function rebuildNestedObject(flatObj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(flatObj)) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================
// GET /api/configuration/translations
// ============================================================

export async function GET() {
  try {
    const { tablesDB, databaseId } = createAdminClient();

    // Only get translations with namespace = "common"
    const result = await tablesDB.listRows({
      databaseId,
      tableId: TABLES.TRANSLATIONS,
      queries: [Query.equal("namespace", "common"), Query.limit(1000)],
    });

    console.log(`📊 Total rows found: ${result.rows.length}`);

    const rows = result.rows;

    // Group by locale
    const groupedByLocale: Record<string, Record<string, any>> = {};

    for (const row of rows) {
      const localeKey = row.locale;

      if (!groupedByLocale[localeKey]) {
        groupedByLocale[localeKey] = {};
      }

      let value: any = row.value;
      if (row.type === "array") {
        try {
          value = JSON.parse(row.value);
        } catch {
          // Keep as string
        }
      }

      groupedByLocale[localeKey][row.key] = value;
    }

    // Rebuild nested objects for each locale
    const resultWithNested: Record<string, any> = {};

    // Ensure fr, en, ar are always in the response (even if empty)
    const supportedLocales = ["fr", "en", "ar"];

    for (const localeKey of supportedLocales) {
      if (groupedByLocale[localeKey]) {
        resultWithNested[localeKey] = rebuildNestedObject(groupedByLocale[localeKey]);
      } else {
        resultWithNested[localeKey] = {};
      }
    }

    return NextResponse.json(resultWithNested);
  } catch (error) {
    return errorResponse(error);
  }
}

// ============================================================
// POST /api/configuration/translations
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    console.log(`✅ Admin verified: ${admin.email}`);

    const body = await request.json();

    if (!body.key || !body.locale || !body.value) {
      return NextResponse.json({ error: "Missing required fields: key, locale, value" }, { status: 400 });
    }

    const { tablesDB, databaseId } = createAdminClient();

    const existing = await tablesDB.listRows({
      databaseId,
      tableId: TABLES.TRANSLATIONS,
      queries: [Query.equal("key", body.key), Query.equal("locale", body.locale), Query.equal("namespace", "common"), Query.limit(1)],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: `Translation already exists for key "${body.key}" in locale "${body.locale}"` }, { status: 409 });
    }

    const result = await tablesDB.createRow({
      databaseId,
      tableId: TABLES.TRANSLATIONS,
      rowId: ID.unique(),
      data: {
        key: body.key,
        locale: body.locale,
        value: body.value,
        type: body.type || "string",
        namespace: "common", // Force namespace to "common"
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
