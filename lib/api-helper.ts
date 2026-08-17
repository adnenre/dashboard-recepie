// lib/api-helper.ts
import { Recipe, RecipeInput } from "./recipes";

// ============================================================
// Base API Call
// ============================================================

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Important: Include cookies for auth
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// Auth API
// ============================================================

export const authApi = {
  // Admin Login
  login: (email: string, password: string) =>
    apiCall<{
      success: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        labels: string[];
        isAdmin: boolean;
      };
    }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Verify Admin Session
  verify: () =>
    apiCall<{
      authenticated: boolean;
      isAdmin: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        labels: string[];
      };
    }>("/admin/auth/verify"),

  // Admin Logout
  logout: () =>
    apiCall<{
      success: boolean;
      message: string;
    }>("/admin/auth/logout", {
      method: "POST",
    }),
};

// ============================================================
// Recipes API
// ============================================================

export const recipeApi = {
  // Get all recipes (Admin only)
  list: () => apiCall<Recipe[]>("/recipes"),

  // Get single recipe (Admin only)
  get: (id: string) => apiCall<Recipe>(`/recipes/${id}`),

  // Create recipe (Admin only)
  create: (data: RecipeInput) =>
    apiCall<{
      success: boolean;
      message: string;
      recipe: Recipe;
    }>("/recipes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update recipe - Full update (Admin only)
  update: (id: string, data: RecipeInput) =>
    apiCall<{
      success: boolean;
      message: string;
      recipe: Recipe;
    }>(`/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Update recipe - Partial update (Admin only)
  patch: (id: string, data: Partial<RecipeInput>) =>
    apiCall<{
      success: boolean;
      message: string;
      recipe: Recipe;
    }>(`/recipes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Delete recipe (Admin only)
  delete: (id: string) =>
    apiCall<{
      success: boolean;
      message: string;
    }>(`/recipes/${id}`, {
      method: "DELETE",
    }),

  // Batch update featured status - ONE CALL with all recipes
  batchUpdateFeatured: (recipes: Array<{ id: string; featured: boolean }>) =>
    apiCall<{
      success: boolean;
      message: string;
      updatedCount: number;
      featuredRecipe: { id: string; featured: boolean } | null;
      featuredCount: number;
    }>("/recipes/batch-feature", {
      method: "POST",
      body: JSON.stringify({ recipes }),
    }),
};

// ============================================================
// Health Check API (Optional)
// ============================================================

export const healthApi = {
  // Check API health
  check: () =>
    apiCall<{
      status: string;
      timestamp: string;
    }>("/health"),
};

// ============================================================
// Export all APIs
// ============================================================

export default {
  auth: authApi,
  recipes: recipeApi,
  health: healthApi,
};
