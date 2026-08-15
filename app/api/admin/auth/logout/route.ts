// app/api/admin/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

export async function POST(request: NextRequest) {
  console.log("🔐 Admin logout attempt...");

  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get the Appwrite session secret from the browser cookie
    const sessionSecret = request.cookies.get(`a_session_${projectId}`)?.value;

    // Create response first so we can always clear the cookie
    const response = NextResponse.json({
      success: true,
    });

    // No session cookie = already logged out
    if (!sessionSecret) {
      console.log("ℹ️ No Appwrite session cookie found");

      response.cookies.set(`a_session_${projectId}`, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
      });

      return response;
    }

    // Create a server client authenticated with the user's session
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setSession(sessionSecret);

    const account = new Account(client);

    // Delete the current Appwrite session
    try {
      await account.deleteSession({
        sessionId: "current",
      });

      console.log("✅ Appwrite session deleted");
    } catch (error: any) {
      // The session may already be expired/deleted.
      // We still clear the browser cookie.
      console.warn("⚠️ Appwrite session could not be deleted:", error?.message || error);
    }

    // Clear the browser cookie
    response.cookies.set(`a_session_${projectId}`, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    console.log("🍪 Appwrite session cookie cleared");
    console.log("✅ Admin logout successful");

    return response;
  } catch (error: any) {
    console.error("❌ Admin logout error:", error);

    // Even if something goes wrong, clear the browser cookie
    const response = NextResponse.json(
      {
        error: error?.message || "Logout failed",
      },
      { status: 500 },
    );

    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (projectId) {
      response.cookies.set(`a_session_${projectId}`, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
      });
    }

    return response;
  }
}
