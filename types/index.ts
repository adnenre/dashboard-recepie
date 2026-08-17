export type Locale = "en" | "fr" | "ar";

export type Localized<T> = T | Partial<Record<Locale, T>>;

export type Ingredient = {
  name: string;
  grams: number;
  unit: string;
};

export type Step = {
  text: string;
  cooking?: boolean;
  timerMin?: number;
};

// ============================================================
// ✅ UPDATED: Main Recipe Types
// ============================================================

export type Recipe = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  prepTime: string;
  cookTime: string;
  time: string;
  duration: string;
  durationMin: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  // ✅ ADDED: methods field
  methods: string[];
  featured: boolean;
  titleLocales?: Partial<Record<Locale, string>>;
  descriptionLocales?: Partial<Record<Locale, string>>;
  categoryLocales?: Partial<Record<Locale, string>>;
  prepTimeLocales?: Partial<Record<Locale, string>>;
  cookTimeLocales?: Partial<Record<Locale, string>>;
  ingredientsLocales?: Partial<Record<Locale, Ingredient[]>>;
  stepsLocales?: Partial<Record<Locale, Step[]>>;
  tagsLocales?: Partial<Record<Locale, string[]>>;
  // ✅ ADDED: methodsLocales
  methodsLocales?: Partial<Record<Locale, string[]>>;
};

export type RecipeInput = Omit<Recipe, "id">;

export interface CookingMethod {
  id: string;
  label: string;
  icon: string;
  hasTemp: boolean;
}

export const COOKING_METHODS: CookingMethod[] = [
  { id: "four", label: "Four", icon: "thermometer", hasTemp: true },
  { id: "gaz", label: "Gaz", icon: "flame", hasTemp: false },
  { id: "induction", label: "Induction", icon: "zap", hasTemp: false },
  { id: "vapeur", label: "Vapeur", icon: "wind", hasTemp: true },
  { id: "mijoteur", label: "Mijoteur", icon: "clock", hasTemp: false },
  { id: "barbecue", label: "Barbecue", icon: "sun", hasTemp: false },
];
