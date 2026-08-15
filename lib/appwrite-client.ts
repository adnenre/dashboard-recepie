// lib/appwrite-client.ts
// ⚠️ This file is CLIENT-ONLY - Import only in client components

import { Client, Databases, Account } from "appwrite";

// For CLIENT-SIDE operations (browser)
// NO API KEY - uses user session from localStorage
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

  return {
    client,
    databases: new Databases(client),
    account: new Account(client),
    databaseId,
    tableId,
  };
}

// For PUBLIC operations (login, register) - Client-side
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
