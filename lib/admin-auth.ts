// lib/admin-auth.ts
import { NextRequest } from "next/server";
import { Client, Account } from "appwrite";

export async function verifyAdmin(request: NextRequest) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error("Appwrite configuration missing");
  }

  const cookieName = `a_session_${projectId}`;
  const sessionId = request.cookies.get(cookieName)?.value;

  if (!sessionId) {
    throw new Error("Not authenticated");
  }

  const sessionClient = new Client().setEndpoint(endpoint).setProject(projectId).setSession(sessionId);

  const account = new Account(sessionClient);
  const user = await account.get();

  const isAdmin = user.labels?.includes("admin") || user.labels?.includes("administrator");

  if (!isAdmin) {
    throw new Error("Admin privileges required");
  }

  return user;
}
