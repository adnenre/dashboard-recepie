// lib/appwrite-admin.ts - Using node-appwrite
import { Client, Databases, TablesDB, Account, Users } from "node-appwrite";

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

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  return {
    client,
    databases: new Databases(client),
    tablesDB: new TablesDB(client), // ✅ TablesDB is available in node-appwrite
    account: new Account(client),
    users: new Users(client),
    databaseId,
    tableId,
  };
}

// For SERVER-SIDE session operations
export function createSessionClient(sessionSecret: string) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint) throw new Error("❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not set");
  if (!projectId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set");
  if (!sessionSecret) throw new Error("❌ Session secret is required");

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setSession(sessionSecret);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    tablesDB: new TablesDB(client),
  };
}

// For CLIENT-SIDE operations (browser)
export function createAppwriteClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const tableId = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID || process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;
  const ApiKey = process.env.APPWRITE_API_KEY;
  if (!endpoint) throw new Error("❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not set");
  if (!projectId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set");
  if (!databaseId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_DATABASE_ID is not set");
  if (!tableId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_TABLE_ID is not set");

  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  (client as any).setKey(ApiKey);

  return {
    client,
    databases: new Databases(client),
    tablesDB: new TablesDB(client),
    databaseId,
    tableId,
  };
}

// For PUBLIC operations (login, register)
export function createPublicClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint) throw new Error("❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not set");
  if (!projectId) throw new Error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set");

  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  return {
    client,
    account: new Account(client),
  };
}
