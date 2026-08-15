// lib/firebase.ts
// ⚠️ This file should NOT import from appwrite-admin.ts

// ❌ Remove this if it exists:
// import { createAdminClient } from "./appwrite-admin";

// ✅ Keep only client-safe imports:
import { appwriteConfigured } from "./appwrite-auth";

export { appwriteConfigured };
