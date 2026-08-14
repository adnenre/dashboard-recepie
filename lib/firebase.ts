// lib/firebase.ts
// This file is kept for backward compatibility
// Using TablesDB with tableId (not collectionId)
import { createAppwriteClient } from "./appwrite-admin";
import { account, client, ID } from "./appwrite-auth";

const { databases, databaseId, tableId } = createAppwriteClient();

export {
  databases,
  databaseId as appwriteDatabaseId,
  tableId as appwriteCollectionId, // Keep the same export name for backward compatibility
  tableId as appwriteTableId, // Also export as tableId for clarity
  account,
  client,
  ID,
};

export const appwriteConfigured = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export * from "./recipes";
