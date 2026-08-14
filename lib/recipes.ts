import { databases, appwriteDatabaseId, appwriteCollectionId } from './firebase'
import { ID, Query } from 'appwrite'

export type Locale = 'en' | 'fr' | 'ar'
export type Localized<T> = T | Partial<Record<Locale, T>>

export type Recipe = {
  id: string
  title: string
  description: string
  image: string
  category: string
  prepTime: string
  cookTime: string
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  ingredients: string[]
  steps: string[]
  tags: string[]
  featured: boolean
  titleLocales?: Partial<Record<Locale, string>>
  descriptionLocales?: Partial<Record<Locale, string>>
  categoryLocales?: Partial<Record<Locale, string>>
  prepTimeLocales?: Partial<Record<Locale, string>>
  cookTimeLocales?: Partial<Record<Locale, string>>
  ingredientsLocales?: Partial<Record<Locale, string[]>>
  stepsLocales?: Partial<Record<Locale, string[]>>
  tagsLocales?: Partial<Record<Locale, string[]>>
}

export function localizedValue<T>(value: Localized<T>, locale: Locale): T {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value as T
  const localized = value as Partial<Record<Locale, T>>
  return localized[locale] ?? localized.en ?? localized.fr ?? localized.ar ?? ('' as T)
}

export type RecipeInput = Omit<Recipe, 'id'>

const recipesRef = () => ({ databaseId: appwriteDatabaseId, collectionId: appwriteCollectionId })

function normalizeRecipe(id: string, data: Record<string, unknown>): Recipe {
  const localized = (key: keyof Recipe, fallback: unknown) => {
    const value = data[key as string]
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { value: value ?? fallback, locales: undefined }
    const locales = value as Partial<Record<Locale, unknown>>
    return { value: locales.en ?? locales.fr ?? locales.ar ?? fallback, locales }
  }
  const title = localized('title', '')
  const description = localized('description', '')
  const category = localized('category', '')
  const prepTime = localized('prepTime', '')
  const cookTime = localized('cookTime', '')
  const ingredients = localized('ingredients', [])
  const steps = localized('steps', [])
  const tags = localized('tags', [])
  return { id, title: title.value as string, description: description.value as string, image: String(data.image ?? ''), category: category.value as string, prepTime: prepTime.value as string, cookTime: cookTime.value as string, servings: Number(data.servings ?? 1), difficulty: (data.difficulty as Recipe['difficulty']) ?? 'Easy', ingredients: ingredients.value as string[], steps: steps.value as string[], tags: tags.value as string[], featured: Boolean(data.featured), titleLocales: title.locales as Recipe['titleLocales'], descriptionLocales: description.locales as Recipe['descriptionLocales'], categoryLocales: category.locales as Recipe['categoryLocales'], prepTimeLocales: prepTime.locales as Recipe['prepTimeLocales'], cookTimeLocales: cookTime.locales as Recipe['cookTimeLocales'], ingredientsLocales: ingredients.locales as Recipe['ingredientsLocales'], stepsLocales: steps.locales as Recipe['stepsLocales'], tagsLocales: tags.locales as Recipe['tagsLocales'] }
}

export async function listRecipes() {
  const snapshot = await databases.listDocuments(recipesRef().databaseId, recipesRef().collectionId, [Query.orderDesc('$createdAt')])
  return snapshot.documents.map((item) => normalizeRecipe(item.$id, item as unknown as Record<string, unknown>))
}

export async function createRecipe(input: RecipeInput) {
  const result = await databases.createDocument(recipesRef().databaseId, recipesRef().collectionId, ID.unique(), input)
  return { id: result.$id, ...input }
}

export async function updateRecipe(id: string, input: RecipeInput) {
  const result = await databases.updateDocument(recipesRef().databaseId, recipesRef().collectionId, id, input)
  return { id: result.$id, ...input }
}

export async function removeRecipe(id: string) {
  await databases.deleteDocument(recipesRef().databaseId, recipesRef().collectionId, id)
}

export async function seedRecipes(recipes: RecipeInput[]) {
  return Promise.all(recipes.map((recipe) => createRecipe(recipe)))
}
