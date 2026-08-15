// app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

export async function POST(request: NextRequest) {
  console.log("🔐 Admin login attempt...");

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      console.error("❌ Missing Appwrite server configuration");

      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // --------------------------------------------------
    // 1. Create Appwrite SERVER client
    // --------------------------------------------------
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

    const account = new Account(client);

    // --------------------------------------------------
    // 2. Authenticate user
    // --------------------------------------------------
    const session = await account.createEmailPasswordSession({
      email,
      password,
    });

    console.log("✅ Appwrite session created");
    console.log(`👤 User ID: ${session.userId}`);

    // --------------------------------------------------
    // 3. Create a session client using the new session
    // --------------------------------------------------
    const sessionClient = new Client().setEndpoint(endpoint).setProject(projectId).setSession(session.secret);

    const sessionAccount = new Account(sessionClient);

    // --------------------------------------------------
    // 4. Get authenticated user
    // --------------------------------------------------
    const user = await sessionAccount.get();

    console.log(`✅ User authenticated: ${user.email}`);

    // --------------------------------------------------
    // 5. Check admin status
    // --------------------------------------------------
    const isAdmin = user.labels?.includes("admin") || user.labels?.includes("administrator");

    if (!isAdmin) {
      console.log("❌ User is not an admin");

      // Delete the session we just created
      try {
        await sessionAccount.deleteSession({
          sessionId: "current",
        });
      } catch (deleteError) {
        console.error("⚠️ Failed to delete non-admin session:", deleteError);
      }

      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }

    // --------------------------------------------------
    // 6. Create Next.js response
    // --------------------------------------------------
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
        labels: user.labels || [],
        isAdmin: true,
      },
    });

    // --------------------------------------------------
    // 7. Store Appwrite SESSION SECRET in cookie
    // --------------------------------------------------
    // IMPORTANT:
    // The cookie value MUST be session.secret.
    // Do NOT use user.$id here.
    response.cookies.set(`a_session_${projectId}`, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(session.expire),
      path: "/",
    });

    console.log("🍪 Appwrite session cookie created");
    console.log("✅ Admin login successful");

    return response;
  } catch (error: any) {
    console.error("❌ Admin login error:", error);

    const status = typeof error?.code === "number" && error.code >= 400 ? error.code : 500;

    return NextResponse.json(
      {
        error: error?.message || "Login failed",
      },
      { status },
    );
  }
}
