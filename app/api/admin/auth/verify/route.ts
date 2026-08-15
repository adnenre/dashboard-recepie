// app/api/admin/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "appwrite";

export async function GET(request: NextRequest) {
  console.log("🔍 Verifying admin session...");

  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      throw new Error("Appwrite configuration missing");
    }

    // Get session from cookie
    const cookieName = `a_session_${projectId}`;
    const sessionId = request.cookies.get(cookieName)?.value;

    if (!sessionId) {
      console.log("❌ No session found");
      return NextResponse.json({ authenticated: false, error: "Not authenticated" }, { status: 401 });
    }

    // Use session client
    const sessionClient = new Client().setEndpoint(endpoint).setProject(projectId).setSession(sessionId);

    const account = new Account(sessionClient);

    try {
      const user = await account.get();
      console.log(`✅ User session valid: ${user.email}`);
      console.log(`📋 User labels: ${user.labels?.join(", ") || "none"}`);

      const isAdmin = user.labels?.includes("admin") || user.labels?.includes("administrator");

      if (!isAdmin) {
        console.log("❌ User is not an admin");
        return NextResponse.json({ authenticated: false, error: "Admin privileges required" }, { status: 403 });
      }

      return NextResponse.json({
        authenticated: true,
        isAdmin: true,
        user: {
          id: user.$id,
          name: user.name,
          email: user.email,
          labels: user.labels,
        },
      });
    } catch (error: any) {
      console.error("❌ Session verification failed:", error);
      return NextResponse.json({ authenticated: false, error: "Invalid session" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("❌ Verify error:", error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
