"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChefHat, Plus, Save, Trash2 } from "lucide-react";
import { appwriteConfigured } from "@/lib/firebase";
import { createRecipe, listRecipes, updateRecipe, type Recipe, type RecipeInput } from "@/lib/recipes";

type FormState = Omit<RecipeInput, "servings"> & { servings: string };
const blank: FormState = {
  title: "",
  description: "",
  image: "",
  category: "Breakfast",
  prepTime: "",
  cookTime: "",
  servings: "2",
  difficulty: "Easy",
  ingredients: [""],
  steps: [""],
  tags: [],
  featured: false,
};

export function RecipeEditorPage({ mode = "edit", recipeId = "" }: { mode?: "create" | "edit"; recipeId?: string }) {
  const [form, setForm] = useState<FormState>(blank);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (mode === "create") return;
    const cached = sessionStorage.getItem("recep-edit-recipe");
    const demo = cached ? (JSON.parse(cached) as Recipe) : null;
    listRecipes()
      .then((items) => {
        const recipe = items.find((item) => item.id === recipeId) ?? demo;
        if (!recipe) return setNotice("Recipe not found.");
        setForm({
          title: typeof recipe.title === "string" ? recipe.title : "",
          description: typeof recipe.description === "string" ? recipe.description : "",
          image: recipe.image ?? "",
          category: typeof recipe.category === "string" ? recipe.category : "Dinner",
          prepTime: typeof recipe.prepTime === "string" ? recipe.prepTime : "",
          cookTime: typeof recipe.cookTime === "string" ? recipe.cookTime : "",
          servings: String(recipe.servings ?? 1),
          difficulty: recipe.difficulty ?? "Easy",
          ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length ? recipe.ingredients : [""],
          steps: Array.isArray(recipe.steps) && recipe.steps.length ? recipe.steps : [""],
          tags: Array.isArray(recipe.tags) ? recipe.tags : [],
          featured: Boolean(recipe.featured),
        });
      })
      .catch(() => {
        if (!demo) setNotice("Could not load recipe.");
      })
      .finally(() => setLoading(false));
  }, [mode, recipeId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateList = (key: "ingredients" | "steps", index: number, value: string) =>
    update(
      key,
      form[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  const addListItem = (key: "ingredients" | "steps") => update(key, [...form[key], ""]);
  const removeListItem = (key: "ingredients" | "steps", index: number) =>
    update(
      key,
      form[key].filter((_, itemIndex) => itemIndex !== index),
    );

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return setNotice("Title and description are required.");
    setSaving(true);
    const input: RecipeInput = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      servings: Math.max(1, Number(form.servings) || 1),
      ingredients: form.ingredients.filter(Boolean),
      steps: form.steps.filter(Boolean),
      tags: form.tags,
    };
    try {
      if (mode === "edit") await updateRecipe(recipeId, input);
      else await createRecipe(input);
      setNotice(mode === "edit" ? "Recipe updated successfully." : "Recipe created successfully.");
      if (mode === "create") setForm(blank);
    } catch {
      if (!appwriteConfigured) setNotice("Preview mode: configure Appwrite to persist recipes.");
      else setNotice("Could not save recipe. Check Appwrite collection attributes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-6 py-8 text-[#26352d]">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="mb-8 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#fffdf8]"
        >
          <ArrowLeft /> Back to recipes
        </button>
        <div className="rounded-[1.75rem] border border-[#ded7cb] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#d96c45] text-white">
              <ChefHat />
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d96c45]">Recipe editor</p>
              <h1 className="font-serif text-3xl font-semibold">{mode === "edit" ? "Edit recipe" : "New recipe"}</h1>
            </div>
          </div>
          {loading ? (
            <p>Loading recipe...</p>
          ) : (
            <form onSubmit={save} className="flex flex-col gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                  Recipe title
                  <input
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3 outline-none focus:border-[#d96c45]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={4}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3 outline-none focus:border-[#d96c45]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Category
                  <select
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Dessert</option>
                    <option>Drinks</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Difficulty
                  <select
                    value={form.difficulty}
                    onChange={(event) => update("difficulty", event.target.value as RecipeInput["difficulty"])}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Prep time
                  <input
                    value={form.prepTime}
                    onChange={(event) => update("prepTime", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Cook time
                  <input
                    value={form.cookTime}
                    onChange={(event) => update("cookTime", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Serves
                  <input
                    type="number"
                    min="1"
                    value={form.servings}
                    onChange={(event) => update("servings", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                  Image URL
                  <input
                    value={form.image}
                    onChange={(event) => update("image", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
              </div>
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">Ingredients</h2>
                  <button
                    type="button"
                    onClick={() => addListItem("ingredients")}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f1ece3]"
                  >
                    <Plus /> Add
                  </button>
                </div>
                {form.ingredients.map((item, index) => (
                  <div key={`ingredient-${index}`} className="flex gap-2">
                    <input
                      value={item}
                      onChange={(event) => updateList("ingredients", index, event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem("ingredients", index)}
                      aria-label="Remove ingredient"
                      className="rounded-lg px-3 text-[#b24d2f] hover:bg-[#f1ece3]"
                    >
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </section>
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">Steps</h2>
                  <button
                    type="button"
                    onClick={() => addListItem("steps")}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f1ece3]"
                  >
                    <Plus /> Add
                  </button>
                </div>
                {form.steps.map((item, index) => (
                  <div key={`step-${index}`} className="flex gap-2">
                    <textarea
                      value={item}
                      onChange={(event) => updateList("steps", index, event.target.value)}
                      rows={2}
                      className="min-w-0 flex-1 rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem("steps", index)}
                      aria-label="Remove step"
                      className="rounded-lg px-3 text-[#b24d2f] hover:bg-[#f1ece3]"
                    >
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </section>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input type="checkbox" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} /> Feature this recipe
              </label>
              {notice && <p className="text-sm text-[#6e746d]">{notice}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="rounded-xl border border-[#ded7cb] px-5 py-3 font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#26352d] px-5 py-3 font-semibold text-white disabled:opacity-60"
                >
                  <Save /> {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Create recipe"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
