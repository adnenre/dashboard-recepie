"use client";

import { useEffect, useMemo, useState } from "react";
import { ChefHat, Edit3, LogOut, Plus, Search, Trash2 } from "lucide-react";
import { appwriteConfigured } from "@/lib/firebase";
import { listRecipes, localizedValue, removeRecipe, type Recipe } from "@/lib/recipes";
import { getDirection, localeLabels, locales, type Locale, translations } from "@/lib/i18n";

export function RecipeAdmin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [queryText, setQueryText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [notice, setNotice] = useState("");
  const t = translations[locale];

  useEffect(() => {
    setLoggedIn(sessionStorage.getItem("recep-admin") === "true");
    const saved = localStorage.getItem("recep-locale") as Locale | null;
    if (saved && locales.includes(saved)) setLocale(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("recep-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);
  useEffect(() => {
    if (!loggedIn) return;
    listRecipes()
      .then(setRecipes)
      .catch(() => setNotice(appwriteConfigured ? "Could not load recipes." : "Configure Appwrite to load saved recipes."));
  }, [loggedIn]);

  const filtered = useMemo(
    () =>
      recipes.filter((recipe) =>
        `${localizedValue(recipe.title, locale)} ${localizedValue(recipe.category, locale)} ${localizedValue(recipe.tags ?? [], locale).join(" ")}`
          .toLowerCase()
          .includes(queryText.toLowerCase()),
      ),
    [recipes, queryText, locale],
  );
  const login = (event: React.FormEvent) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    if (form.get("username") === "admin" && form.get("password") === "admin") {
      sessionStorage.setItem("recep-admin", "true");
      setLoggedIn(true);
    } else setNotice(t.invalidCredentials);
  };
  const logout = () => {
    sessionStorage.removeItem("recep-admin");
    setLoggedIn(false);
  };
  const edit = (recipe: Recipe) => {
    sessionStorage.setItem("recep-edit-recipe", JSON.stringify(recipe));
    window.location.href = `/recipes/edit?id=${encodeURIComponent(recipe.id)}`;
  };
  const remove = async () => {
    if (!deleteTarget) return;
    try {
      if (appwriteConfigured) await removeRecipe(deleteTarget.id);
      setRecipes((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotice("Recipe deleted.");
    } catch {
      setNotice("Delete failed.");
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

  if (!loggedIn)
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
            <input
              name="username"
              defaultValue="admin"
              placeholder={t.usernamePlaceholder}
              className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
            />
            <input
              name="password"
              type="password"
              placeholder={t.passwordPlaceholder}
              className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
            />
            {notice && <p className="text-sm text-[#b24d2f]">{notice}</p>}
            <button className="rounded-xl bg-[#26352d] px-4 py-3 font-semibold text-white">{t.signIn}</button>
          </div>
        </form>
      </main>
    );

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
            {language}
            <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
              <LogOut />
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
              window.location.href = "/recipes/new";
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#d96c45] px-5 py-3 font-semibold text-white"
          >
            <Plus />
            {t.newRecipe}
          </button>
        </div>
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#ded7cb] bg-[#fffdf8] px-4 py-3">
          <Search className="text-[#8a7765]" />
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
              <img src={recipe.image} alt={localizedValue(recipe.title, locale)} className="h-48 w-full object-cover" />
              <div className="p-5">
                <p className="mb-2 text-xs uppercase tracking-widest text-[#d96c45]">{localizedValue(recipe.category, locale)}</p>
                <h3 className="font-serif text-2xl font-semibold">{localizedValue(recipe.title, locale)}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-[#6e746d]">{localizedValue(recipe.description, locale)}</p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => edit(recipe)}
                    className="flex items-center gap-2 rounded-lg border border-[#ded7cb] px-3 py-2 text-sm font-semibold"
                  >
                    <Edit3 />
                    {t.edit}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(recipe)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#b24d2f]"
                  >
                    <Trash2 />
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
            <h2 className="font-serif text-2xl font-semibold">Delete recipe?</h2>
            <p className="mt-2 text-sm text-[#6e746d]">Are you sure you want to delete “{localizedValue(deleteTarget.title, locale)}”?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-[#ded7cb] px-4 py-2 font-semibold">
                No
              </button>
              <button onClick={remove} className="rounded-lg bg-[#b24d2f] px-4 py-2 font-semibold text-white">
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
