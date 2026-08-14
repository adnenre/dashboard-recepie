// lib/appwrite-admin.ts
import { Client, Databases, TablesDB } from "appwrite";

// For SERVER-ONLY operations (seeding, API routes)
// Uses APPWRITE_API_KEY (not exposed to browser)
export function createAdminClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const tableId = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID || process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint) throw new Error("❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not set");
  if (!projectId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set");
  if (!databaseId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_DATABASE_ID is not set");
  if (!tableId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_TABLE_ID is not set");
  if (!apiKey) throw new Error("❌ APPWRITE_API_KEY is not set (server-only)");

  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  // Set API key for admin operations
  (client as any).setKey(apiKey);

  return {
    client,
    databases: new Databases(client),
    tablesDB: new TablesDB(client),
    databaseId,
    tableId,
  };
}

// For CLIENT-SIDE operations (browser)
// NO API KEY - uses user session
export function createAppwriteClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const tableId = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID || process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

  if (!endpoint) throw new Error("❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not set");
  if (!projectId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set");
  if (!databaseId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_DATABASE_ID is not set");
  if (!tableId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_TABLE_ID is not set");

  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  // NO API KEY - uses user session from login

  return {
    client,
    databases: new Databases(client),
    tablesDB: new TablesDB(client),
    databaseId,
    tableId,
  };
}
