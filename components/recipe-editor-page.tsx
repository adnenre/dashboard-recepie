// components/RecipeEditorPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, Plus, Save, Trash2, Timer, Flame } from "lucide-react";
import { appwriteConfigured } from "@/lib/firebase";
import { createRecipe, updateRecipe, listRecipes, batchUpdateFeatured } from "@/lib/recipes";
import { type Recipe, type RecipeInput, type Ingredient, type Step, COOKING_METHODS } from "@/types";
import { useLocale } from "@/hooks";

// Form state with Ingredient and Step objects
type FormState = {
  title: string;
  description: string;
  image: string;
  category: string;
  prepTime: string;
  cookTime: string;
  time: string;
  duration: string;
  durationMin: string;
  servings: string;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  methods: string[]; // ✅ ADDED: Array of method IDs
  featured: boolean;
};

// Blank state with proper object structure
const blank: FormState = {
  title: "",
  description: "",
  image: "",
  category: "Breakfast",
  prepTime: "",
  cookTime: "",
  time: "",
  duration: "",
  durationMin: "",
  servings: "2",
  difficulty: "Easy",
  ingredients: [{ name: "", grams: 0, unit: "g" }],
  steps: [{ text: "", cooking: false, timerMin: 0 }],
  tags: [],
  methods: [],
  featured: false,
};

function RecipeEditorPage({ mode = "edit", recipeId = "" }: { mode?: "create" | "edit"; recipeId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(blank);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  const { t } = useLocale();

  useEffect(() => {
    if (mode === "create") {
      setLoading(false);
      return;
    }

    const cached = sessionStorage.getItem("recep-edit-recipe");
    const demo = cached ? (JSON.parse(cached) as Recipe) : null;

    listRecipes()
      .then((recipes) => {
        setAllRecipes(recipes);
        const recipe = recipes.find((item) => item.id === recipeId) ?? demo;
        if (!recipe) {
          setNotice(t.edit_recipeNotFound || "Recipe not found.");
          return;
        }
        setForm({
          title: typeof recipe.title === "string" ? recipe.title : "",
          description: typeof recipe.description === "string" ? recipe.description : "",
          image: recipe.image ?? "",
          category: typeof recipe.category === "string" ? recipe.category : "Dinner",
          prepTime: typeof recipe.prepTime === "string" ? recipe.prepTime : "",
          cookTime: typeof recipe.cookTime === "string" ? recipe.cookTime : "",
          time: typeof recipe.time === "string" ? recipe.time : "",
          duration: typeof recipe.duration === "string" ? recipe.duration : "",
          durationMin: typeof recipe.durationMin === "string" ? recipe.durationMin : "",
          servings: String(recipe.servings ?? 1),
          difficulty: recipe.difficulty ?? "Easy",
          ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length ? recipe.ingredients : [{ name: "", grams: 0, unit: "g" }],
          steps: Array.isArray(recipe.steps) && recipe.steps.length ? recipe.steps : [{ text: "", cooking: false, timerMin: 0 }],
          tags: Array.isArray(recipe.tags) ? recipe.tags : [],
          // ✅ ADDED: Parse methods
          methods: Array.isArray(recipe.methods) ? recipe.methods : [],
          featured: Boolean(recipe.featured),
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load recipe:", error);
        if (demo) {
          setForm({
            title: typeof demo.title === "string" ? demo.title : "",
            description: typeof demo.description === "string" ? demo.description : "",
            image: demo.image ?? "",
            category: typeof demo.category === "string" ? demo.category : "Dinner",
            prepTime: typeof demo.prepTime === "string" ? demo.prepTime : "",
            cookTime: typeof demo.cookTime === "string" ? demo.cookTime : "",
            time: typeof demo.time === "string" ? demo.time : "",
            duration: typeof demo.duration === "string" ? demo.duration : "",
            durationMin: typeof demo.durationMin === "string" ? demo.durationMin : "",
            servings: String(demo.servings ?? 1),
            difficulty: demo.difficulty ?? "Easy",
            ingredients: Array.isArray(demo.ingredients) && demo.ingredients.length ? demo.ingredients : [{ name: "", grams: 0, unit: "g" }],
            steps: Array.isArray(demo.steps) && demo.steps.length ? demo.steps : [{ text: "", cooking: false, timerMin: 0 }],
            tags: Array.isArray(demo.tags) ? demo.tags : [],
            methods: Array.isArray(demo.methods) ? demo.methods : [],
            featured: Boolean(demo.featured),
          });
        } else {
          setNotice(t.edit_couldNotLoadRecipe || "Could not load recipe.");
        }
        setLoading(false);
      });
  }, [mode, recipeId, t]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  // ✅ Ingredient handlers - adds all 3 fields together
  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...form.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    update("ingredients", newIngredients);
  };

  const addIngredient = () => {
    update("ingredients", [
      ...form.ingredients,
      {
        name: "",
        grams: 0,
        unit: "g",
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    if (form.ingredients.length <= 1) {
      setNotice(t.edit_needIngredient || "You need at least one ingredient.");
      return;
    }
    update(
      "ingredients",
      form.ingredients.filter((_, i) => i !== index),
    );
  };

  // ✅ Step handlers - adds all 3 fields together
  const updateStep = (index: number, field: keyof Step, value: string | number | boolean) => {
    const newSteps = [...form.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    update("steps", newSteps);
  };

  const addStep = () => {
    update("steps", [
      ...form.steps,
      {
        text: "",
        cooking: false,
        timerMin: 0,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (form.steps.length <= 1) {
      setNotice(t.edit_needStep || "You need at least one step.");
      return;
    }
    update(
      "steps",
      form.steps.filter((_, i) => i !== index),
    );
  };

  // ✅ Tag handlers
  const addTag = () => {
    update("tags", [...form.tags, ""]);
  };

  const updateTag = (index: number, value: string) => {
    const newTags = [...form.tags];
    newTags[index] = value;
    update("tags", newTags);
  };

  const removeTag = (index: number) => {
    update(
      "tags",
      form.tags.filter((_, i) => i !== index),
    );
  };

  // ✅ NEW: Method handlers - toggle selection
  const toggleMethod = (methodId: string) => {
    const currentMethods = form.methods;
    const newMethods = currentMethods.includes(methodId) ? currentMethods.filter((id) => id !== methodId) : [...currentMethods, methodId];
    update("methods", newMethods);
  };

  // ✅ NEW: Check if a method is selected
  const isMethodSelected = (methodId: string): boolean => {
    return form.methods.includes(methodId);
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();

    // Validate title and description
    if (!form.title.trim() || !form.description.trim()) {
      return setNotice(t.edit_titleAndDescriptionRequired || "Title and description are required.");
    }

    const validIngredients = form.ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) {
      return setNotice(t.edit_needIngredient || "Please add at least one ingredient with a name.");
    }

    const hasEmptyIngredient = form.ingredients.some((ing) => !ing.name.trim() && (ing.grams > 0 || ing.unit));
    if (hasEmptyIngredient) {
      return setNotice(t.edit_fillIngredientName || "Please fill in the ingredient name or remove the empty ingredient.");
    }

    const validSteps = form.steps.filter((step) => step.text.trim());
    if (validSteps.length === 0) {
      return setNotice(t.edit_needStep || "Please add at least one step with instructions.");
    }

    const hasEmptyStep = form.steps.some((step) => !step.text.trim() && (step.cooking || step.timerMin));
    if (hasEmptyStep) {
      return setNotice(t.edit_fillStepText || "Please fill in the step instruction or remove the empty step.");
    }

    setSaving(true);
    setNotice("");

    const input: RecipeInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image || "",
      category: form.category,
      prepTime: form.prepTime || "",
      cookTime: form.cookTime || "",
      time: form.time || "",
      duration: form.duration || "",
      durationMin: form.durationMin || "",
      servings: Math.max(1, Number(form.servings) || 1),
      difficulty: form.difficulty,
      ingredients: validIngredients,
      steps: validSteps,
      tags: form.tags.filter((tag) => tag.trim()),
      // ✅ ADDED: Include methods
      methods: form.methods,
      featured: form.featured,
    };

    try {
      if (mode === "edit") {
        await updateRecipe(recipeId, input);

        let recipes = allRecipes;
        if (recipes.length === 0) {
          recipes = await listRecipes();
          setAllRecipes(recipes);
        }

        const updatedRecipes = recipes.map((recipe) => ({
          id: recipe.id,
          featured: form.featured ? recipe.id === recipeId : false,
        }));

        const result = await batchUpdateFeatured(updatedRecipes);

        console.log(`✅ Updated ${result.updatedCount} recipes`);
        console.log(`✅ ${result.featuredCount} recipe(s) featured`);

        setNotice(t.edit_recipeUpdated || "Recipe updated successfully.");
      } else {
        await createRecipe(input);
        setNotice(t.edit_recipeCreated || "Recipe created successfully.");
        if (mode === "create") setForm(blank);
      }
    } catch (error: any) {
      console.error("Save error:", error);

      if (error.message?.includes("Authentication required") || error.message?.includes("401")) {
        setNotice("Please log in to save recipes.");
      } else if (error.message?.includes("Admin privileges required") || error.message?.includes("403")) {
        setNotice("Admin privileges required to save recipes.");
      } else if (!appwriteConfigured) {
        setNotice(t.edit_previewMode || "Preview mode: configure Appwrite to persist recipes.");
      } else {
        setNotice(error.message || t.edit_couldNotSave || "Could not save recipe. Check Appwrite collection attributes.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-6 py-8 text-[#26352d]">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-8 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#fffdf8]"
        >
          <ArrowLeft /> {t.edit_backToRecipes}
        </button>
        <div className="rounded-[1.75rem] border border-[#ded7cb] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#d96c45] text-white">
              <ChefHat />
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d96c45]">{t.edit_recipeEditor}</p>
              <h1 className="font-serif text-3xl font-semibold">{mode === "edit" ? t.edit_editRecipe : t.edit_newRecipe}</h1>
            </div>
          </div>
          {loading ? (
            <p>{t.edit_loading}</p>
          ) : (
            <form onSubmit={save} className="flex flex-col gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                  {t.edit_recipeTitle}
                  <input
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3 outline-none focus:border-[#d96c45]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                  {t.edit_description}
                  <textarea
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={4}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3 outline-none focus:border-[#d96c45]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_category}
                  <select
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  >
                    <option value="Breakfast">{t.edit_breakfast}</option>
                    <option value="Lunch">{t.edit_lunch}</option>
                    <option value="Dinner">{t.edit_dinner}</option>
                    <option value="Dessert">{t.edit_dessert}</option>
                    <option value="Drinks">{t.edit_drinks}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_difficulty}
                  <select
                    value={form.difficulty}
                    onChange={(event) => update("difficulty", event.target.value as FormState["difficulty"])}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  >
                    <option value="Easy">{t.edit_easy}</option>
                    <option value="Medium">{t.edit_medium}</option>
                    <option value="Hard">{t.edit_hard}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_prepTime}
                  <input
                    value={form.prepTime}
                    onChange={(event) => update("prepTime", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_cookTime}
                  <input
                    value={form.cookTime}
                    onChange={(event) => update("cookTime", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_time}
                  <input
                    value={form.time}
                    onChange={(event) => update("time", event.target.value)}
                    placeholder="40 min"
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_duration}
                  <input
                    value={form.duration}
                    onChange={(event) => update("duration", event.target.value)}
                    placeholder="40 min"
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_durationMin}
                  <input
                    value={form.durationMin}
                    onChange={(event) => update("durationMin", event.target.value)}
                    placeholder="40"
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t.edit_serves}
                  <input
                    type="number"
                    min="1"
                    value={form.servings}
                    onChange={(event) => update("servings", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                  {t.edit_imageUrl}
                  <input
                    value={form.image}
                    onChange={(event) => update("image", event.target.value)}
                    className="rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                  />
                </label>
              </div>

              {/* ✅ NEW: Cooking Methods Section - Multi-select */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">Modes de cuisson</h2>
                  <span className="text-xs text-muted-foreground">
                    {form.methods.length} sélectionné{form.methods.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 ">
                  {COOKING_METHODS.map((method) => {
                    const isSelected = isMethodSelected(method.id);
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => toggleMethod(method.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#d96c45] border-[#d96c45] text-white shadow-sm"
                            : "bg-white border-[#d9d1c3] text-[#26352d] hover:bg-[#f5f1e8]"
                        }`}
                      >
                        <Flame className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#d96c45]"}`} />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
                {form.methods.length === 0 && <p className="text-xs text-muted-foreground">Sélectionnez au moins un mode de cuisson</p>}
              </section>

              {/* Ingredients Section */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">{t.edit_ingredients}</h2>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f1ece3]"
                  >
                    <Plus /> {t.edit_add}
                  </button>
                </div>
                {form.ingredients.map((ingredient, index) => (
                  <div
                    key={`ingredient-${index}`}
                    className="flex flex-col sm:flex-row gap-2 p-3 sm:p-0 rounded-xl sm:rounded-none border border-[#f0ede8] sm:border-0 bg-white/80 sm:bg-transparent"
                  >
                    {/* Nom - largeur complète sur mobile */}
                    <input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder={t.edit_ingredientName || "Ingredient name"}
                      className="flex-1 rounded-xl border border-[#d9d1c3] bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm"
                    />

                    {/* Groupe quantité/unité/bouton sur une ligne */}
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                      <div className="flex items-center justify-center sm:justify-center gap-2">
                        <input
                          type="number"
                          value={ingredient.grams || ""}
                          onChange={(e) => updateIngredient(index, "grams", parseFloat(e.target.value) || 0)}
                          placeholder={t.edit_quantity || "Qty"}
                          className=" w-16 sm:w-20 rounded-xl border border-[#d9d1c3] bg-white px-3 py-2.5 sm:py-3 text-sm"
                          min="0"
                          step="0.5"
                        />

                        <select
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                          className="w-16 sm:w-20 rounded-xl border border-[#d9d1c3] bg-white px-2 sm:px-4 py-2.5 sm:py-3 text-sm appearance-none"
                        >
                          <option value="g">{t.unit_g || "g"}</option>
                          <option value="ml">{t.unit_ml || "ml"}</option>
                          <option value="pcs">{t.unit_pcs || "pcs"}</option>
                          <option value="c.s.">{t.unit_cs || "c.s."}</option>
                          <option value="c.c.">{t.unit_cc || "c.c."}</option>
                          <option value="roul.">{t.unit_roul || "roul."}</option>
                          <option value="gousse">{t.unit_gousse || "gousse"}</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-center sm:justify-center">
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          aria-label={t.edit_removeIngredient}
                          className="shrink-0 rounded-lg px-2 sm:px-3 py-2.5 sm:py-3 text-[#b24d2f] hover:bg-[#f1ece3] transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Steps Section */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">{t.edit_steps}</h2>
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f1ece3]"
                  >
                    <Plus /> {t.edit_add}
                  </button>
                </div>
                {form.steps.map((step, index) => (
                  <div
                    key={`step-${index}`}
                    className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 sm:p-1.5 rounded-lg border border-[#e8e3d8] bg-white/40"
                  >
                    {/* Numéro */}
                    <div className="flex items-center justify-center sm:justify-center">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#b24d2f] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                    </div>

                    {/* Texte - très compact */}
                    <textarea
                      value={step.text}
                      onChange={(e) => updateStep(index, "text", e.target.value)}
                      rows={1}
                      placeholder={t.edit_stepInstruction || "Step"}
                      className="flex-1 min-w-0 rounded-lg border border-[#d9d1c3] bg-white px-4  py-4  text-[11px] sm:text-xs min-h-7.5 sm:min-h-8 resize-y"
                    />

                    {/* Contrôles - compact */}
                    <div className="flex flex-row gap-1.5 items-center justify-center sm:justify-center">
                      <label className="flex items-center gap-0.5 text-[10px] sm:text-xs whitespace-nowrap cursor-pointer">
                        <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <input
                          type="checkbox"
                          checked={step.cooking || false}
                          onChange={(e) => updateStep(index, "cooking", e.target.checked)}
                          className="rounded w-3 h-3 sm:w-3.5 sm:h-3.5"
                        />
                        <span className="hidden sm:inline">{t.edit_cooking || "Cook"}</span>
                      </label>

                      <input
                        type="number"
                        value={step.timerMin || ""}
                        onChange={(e) => updateStep(index, "timerMin", parseInt(e.target.value) || 0)}
                        placeholder="Min"
                        className="w-10 sm:w-14 rounded-lg border border-[#d9d1c3] bg-white px-1 sm:px-1.5 py-1 sm:py-1.5 text-[10px] sm:text-xs text-center"
                        min="0"
                        step="1"
                      />
                    </div>

                    {/* Supprimer */}
                    <div className="flex items-center justify-center sm:justify-center">
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        aria-label={t.edit_removeStep}
                        className="shrink-0 rounded-lg px-2 sm:px-3 py-2.5 sm:py-3 text-[#b24d2f] hover:bg-[#f1ece3] transition-colors"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Tags Section */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">{t.edit_tags || "Tags"}</h2>
                  <button
                    type="button"
                    onClick={addTag}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f1ece3]"
                  >
                    <Plus /> {t.edit_addTag || "Add Tag"}
                  </button>
                </div>
                {form.tags.map((tag, index) => (
                  <div key={`tag-${index}`} className="flex gap-2">
                    <input
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      placeholder={t.edit_tagName || "Tag name"}
                      className="flex-1 rounded-xl border border-[#d9d1c3] bg-white px-4 py-3"
                    />
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="shrink-0 rounded-lg px-2 sm:px-3 py-2.5 sm:py-3 text-[#b24d2f] hover:bg-[#f1ece3] transition-colors"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
              </section>

              <label className="flex items-center gap-3 text-sm font-medium">
                <input type="checkbox" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} />
                {t.edit_featureThisRecipe}
              </label>

              {notice && <p className={`text-sm ${notice.includes("success") ? "text-green-600" : "text-[#b24d2f]"}`}>{notice}</p>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.push("/")} className="rounded-xl border border-[#ded7cb] px-5 py-3 font-semibold">
                  {t.edit_cancel}
                </button>
                <button
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#26352d] px-5 py-3 font-semibold text-white disabled:opacity-60 hover:bg-[#3a4a3f] transition-colors"
                >
                  <Save /> {saving ? t.edit_saving : mode === "edit" ? t.edit_saveChanges : t.edit_createRecipe}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default RecipeEditorPage;
