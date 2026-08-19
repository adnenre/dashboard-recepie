// components/recipe-admin.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChefHat, Edit3, LogOut, Plus, Search, Trash2, Mail, Lock, Globe } from "lucide-react";
import { appwriteConfigured } from "@/lib/firebase";
import { localizedValue } from "@/lib/recipes";
import { type Recipe } from "@/types";
import { localeLabels, type Locale } from "@/lib/i18n";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/hooks";
import { authApi, recipeApi } from "@/lib/api-helper";

export function RecipeAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { user, loading: authLoading, loggedIn, setUser, setLoggedIn } = auth;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [queryText, setQueryText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [notice, setNotice] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const { locale, setLocale, t } = useLocale();

  // Load recipes when logged in
  useEffect(() => {
    if (!loggedIn) return;

    recipeApi
      .list()
      .then(setRecipes)
      .catch((error) => {
        console.error("Failed to load recipes:", error);
        setNotice(
          appwriteConfigured
            ? t.couldNotLoadRecipes || "Could not load recipes."
            : t.configureAppwrite || "Configure Appwrite to load saved recipes.",
        );
      });
  }, [loggedIn, t]);

  const filtered = useMemo(
    () =>
      recipes.filter((recipe) => {
        const tagsArray = Array.isArray(recipe.tags) ? recipe.tags : typeof recipe.tags === "string" ? [] : [];
        const title = localizedValue(recipe.title, locale) || "";
        const category = localizedValue(recipe.category, locale) || "";
        const tags = tagsArray.map((tag) => (typeof tag === "string" ? tag : "")).join(" ");

        const searchString = `${title} ${category} ${tags}`.toLowerCase();
        const query = queryText.toLowerCase();

        return searchString.includes(query);
      }),
    [recipes, queryText, locale],
  );

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    setNotice("");

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      const result = await authApi.login(email, password);
      console.log("Login result:", result);

      // ✅ Normalize user data to match Appwrite format
      const normalizedUser = {
        $id: result.user.id, // Map id to $id (Appwrite format)
        id: result.user.id, // Keep id as well
        name: result.user.name,
        email: result.user.email,
        labels: result.user.labels || [],
        isAdmin: result.user.isAdmin,
      };

      setUser(normalizedUser);
      setLoggedIn(true);
      setNotice(t.welcomeBack || "Welcome back! 👋");

      // Load recipes after login
      try {
        const recipes = await recipeApi.list();
        setRecipes(recipes);
      } catch (error) {
        console.error("Failed to load recipes after login:", error);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message?.includes("Admin privileges")) {
        setNotice("Access denied. Admin privileges required.");
      } else if (error.message?.includes("Invalid email")) {
        setNotice(t.invalidCredentials || "Invalid email or password. Please try again.");
      } else {
        setNotice(error.message || t.loginFailed || "Login failed. Please try again.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setLoggedIn(false);
      setUser(null);
      setRecipes([]);
      setNotice(t.loggedOut || "Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      setNotice(t.logoutFailed || "Logout failed.");
    }
  };

  const edit = (recipe: Recipe) => {
    sessionStorage.setItem("recep-edit-recipe", JSON.stringify(recipe));
    router.push(`/recipes/edit?id=${encodeURIComponent(recipe.id)}`);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await recipeApi.delete(deleteTarget.id);

      setRecipes((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotice(t.recipeDeleted || "Recipe deleted.");
    } catch (error: any) {
      console.error("Delete error:", error);
      if (error.message?.includes("Authentication required") || error.message?.includes("401")) {
        setNotice("Please log in to delete recipes.");
      } else if (error.message?.includes("Admin privileges") || error.message?.includes("403")) {
        setNotice("Admin privileges required to delete recipes.");
      } else {
        setNotice(t.deleteFailed || "Delete failed.");
      }
    }
  };

  const language = (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="rounded-lg border border-[#ded7cb] bg-[#fffdf8] px-3 py-2 text-sm"
    >
      <option value="en">{localeLabels.en}</option>
      <option value="fr">{localeLabels.fr}</option>
      <option value="ar">{localeLabels.ar}</option>
    </select>
  );

  // Loading state
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d96c45] mx-auto"></div>
          <p className="mt-4 text-[#6e746d]">{t.loading || "Loading..."}</p>
        </div>
      </main>
    );
  }

  // Login form
  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8] px-6 text-[#26352d]">
        <div className="absolute right-6 top-6">{language}</div>
        <form onSubmit={login} className="w-full max-w-md rounded-[2rem] border border-[#d9d1c3] bg-[#fffdf8] p-8 shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d96c45] text-white">
              <ChefHat />
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#8a7765]">{t.brand}</p>
              <h1 className="font-serif text-3xl font-semibold">{t.signInTitle}</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7765] size-4" />
              <input
                name="email"
                type="email"
                placeholder={t.email || "Email"}
                className="w-full rounded-xl border border-[#d9d1c3] bg-white px-4 py-3 pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7765] size-4" />
              <input
                name="password"
                type="password"
                placeholder={t.password || "Password"}
                className="w-full rounded-xl border border-[#d9d1c3] bg-white px-4 py-3 pl-10"
                required
                minLength={8}
              />
            </div>

            {notice && <p className="text-sm text-[#b24d2f]">{notice}</p>}

            <button
              type="submit"
              disabled={loginLoading}
              className="rounded-xl bg-[#26352d] px-4 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a4a3f] transition-colors"
            >
              {loginLoading ? t.signingIn || "Signing in..." : t.signIn}
            </button>
          </div>
        </form>
      </main>
    );
  }

  // Admin dashboard
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#26352d]">
      <header className="border-b border-[#ded7cb] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#d96c45] text-white">
              <ChefHat />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7765]">{t.brand} / studio</p>
              <h1 className="font-serif text-2xl font-semibold">{t.kitchenAdmin}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* NEW: Translations link */}
            <button
              onClick={() => router.push("/configuration/translations")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname?.startsWith("/configuration") ? "bg-[#f5f1e8] text-[#d96c45]" : "text-[#8a7765] hover:bg-[#f5f1e8]"
              }`}
            >
              <Globe className="size-4" />
              Translations
            </button>
            <span className="text-sm text-[#8a7765] hidden sm:inline">{user?.name || user?.email}</span>
            {language}
            <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f5f1e8] transition-colors">
              <LogOut className="size-4" />
              {t.signOut}
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d96c45]">{t.recipeLibrary}</p>
            <h2 className="font-serif text-4xl font-semibold">
              {t.recipes} <span className="font-sans text-lg font-normal text-[#8a7765]">({filtered.length})</span>
            </h2>
          </div>
          <button
            onClick={() => {
              router.push("/recipes/new");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#d96c45] px-5 py-3 font-semibold text-white hover:bg-[#c45a35] transition-colors"
          >
            <Plus className="size-5" />
            {t.newRecipe}
          </button>
        </div>
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#ded7cb] bg-[#fffdf8] px-4 py-3">
          <Search className="text-[#8a7765] size-5" />
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={t.searchRecipes}
            className="w-full bg-transparent outline-none"
          />
        </div>
        {notice && <p className="mb-4 text-sm text-[#b24d2f]">{notice}</p>}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <article key={recipe.id} className="overflow-hidden rounded-[1.5rem] border border-[#ded7cb] bg-[#fffdf8] shadow-sm">
              <img src={recipe.image || "/placeholder-image.jpg"} alt={localizedValue(recipe.title, locale)} className="h-48 w-full object-cover" />
              <div className="p-5">
                <p className="mb-2 text-xs uppercase tracking-widest text-[#d96c45]">{localizedValue(recipe.category, locale)}</p>
                <h3 className="font-serif text-2xl font-semibold">{localizedValue(recipe.title, locale)}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-[#6e746d]">{localizedValue(recipe.description, locale)}</p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => edit(recipe)}
                    className="flex items-center gap-2 rounded-lg border border-[#ded7cb] px-3 py-2 text-sm font-semibold hover:bg-[#f5f1e8] transition-colors"
                  >
                    <Edit3 className="size-4" />
                    {t.edit}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(recipe)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#b24d2f] hover:bg-[#f5f1e8] transition-colors"
                  >
                    <Trash2 className="size-4" />
                    {t.delete}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#26352d]/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-[#fffdf8] p-6 shadow-2xl">
            <h2 className="font-serif text-2xl font-semibold">{t.deleteRecipe || "Delete recipe?"}</h2>
            <p className="mt-2 text-sm text-[#6e746d]">
              {t.areYouSureDelete || "Are you sure you want to delete"} "{localizedValue(deleteTarget.title, locale)}"?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-[#ded7cb] px-4 py-2 font-semibold hover:bg-[#f5f1e8] transition-colors"
              >
                {t.no || "No"}
              </button>
              <button onClick={remove} className="rounded-lg bg-[#b24d2f] px-4 py-2 font-semibold text-white hover:bg-[#8a3d22] transition-colors">
                {t.yesDelete || "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default RecipeAdmin;
