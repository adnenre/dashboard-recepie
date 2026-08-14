// lib/appwrite-auth.ts
import { Client, Account, ID } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const appwriteConfigured = Boolean(endpoint && projectId);

export const client = new Client();

if (appwriteConfigured) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);

// Re-export ID for use in other files
export { ID };
