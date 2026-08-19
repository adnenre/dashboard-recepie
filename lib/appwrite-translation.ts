// lib/appwrite/translations.ts

import { Client, Databases, Query, ID } from "appwrite";
import { Translation, TranslationFilters, CreateTranslationPayload, UpdateTranslationPayload } from "@/types/translation";

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "");

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const TRANSLATIONS_TABLE_ID = "translations";

/**
 * Get all translations with optional filters
 */
export async function getTranslations(filters?: TranslationFilters): Promise<Translation[]> {
  const queries: string[] = [];

  if (filters?.locale) {
    queries.push(Query.equal("locale", filters.locale));
  }

  if (filters?.namespace) {
    queries.push(Query.equal("namespace", filters.namespace));
  }

  if (filters?.search) {
    queries.push(Query.search("key", filters.search));
  }

  queries.push(Query.limit(1000)); // Adjust as needed

  try {
    const response = await databases.listDocuments(DATABASE_ID, TRANSLATIONS_TABLE_ID, queries);
    return response.documents as unknown as Translation[];
  } catch (error) {
    console.error("Error fetching translations:", error);
    throw error;
  }
}

/**
 * Get translations grouped by locale (returns object with locale as key)
 */
export async function getTranslationsByLocale(locale: string): Promise<Record<string, string>> {
  const translations = await getTranslations({ locale });
  const result: Record<string, string> = {};

  translations.forEach((t) => {
    result[t.key] = t.value;
  });

  return result;
}

/**
 * Get a single translation by ID
 */
export async function getTranslationById(id: string): Promise<Translation | null> {
  try {
    const response = await databases.getDocument(DATABASE_ID, TRANSLATIONS_TABLE_ID, id);
    return response as unknown as Translation;
  } catch (error) {
    console.error("Error fetching translation:", error);
    return null;
  }
}

/**
 * Get translation by key and locale
 */
export async function getTranslationByKey(key: string, locale: string): Promise<Translation | null> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, TRANSLATIONS_TABLE_ID, [
      Query.equal("key", key),
      Query.equal("locale", locale),
      Query.limit(1),
    ]);

    if (response.documents.length > 0) {
      return response.documents[0] as unknown as Translation;
    }
    return null;
  } catch (error) {
    console.error("Error fetching translation by key:", error);
    return null;
  }
}

/**
 * Create a new translation
 */
export async function createTranslation(data: CreateTranslationPayload): Promise<Translation> {
  try {
    const response = await databases.createDocument(DATABASE_ID, TRANSLATIONS_TABLE_ID, ID.unique(), {
      key: data.key,
      locale: data.locale,
      value: data.value,
      type: data.type || "string",
      namespace: data.namespace || "common",
    });
    return response as unknown as Translation;
  } catch (error) {
    console.error("Error creating translation:", error);
    throw error;
  }
}

/**
 * Update an existing translation
 */
export async function updateTranslation(id: string, data: UpdateTranslationPayload): Promise<Translation> {
  try {
    const response = await databases.updateDocument(DATABASE_ID, TRANSLATIONS_TABLE_ID, id, data);
    return response as unknown as Translation;
  } catch (error) {
    console.error("Error updating translation:", error);
    throw error;
  }
}

/**
 * Delete a translation
 */
export async function deleteTranslation(id: string): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, TRANSLATIONS_TABLE_ID, id);
  } catch (error) {
    console.error("Error deleting translation:", error);
    throw error;
  }
}

/**
 * Bulk import translations
 */
export async function bulkImportTranslations(translations: CreateTranslationPayload[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const translation of translations) {
    try {
      await createTranslation(translation);
      success++;
    } catch (error) {
      console.error("Failed to import translation:", translation.key, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Get all unique namespaces
 */
export async function getNamespaces(): Promise<string[]> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, TRANSLATIONS_TABLE_ID, [Query.limit(1000)]);

    const namespaces = new Set<string>();
    (response.documents as unknown as Translation[]).forEach((t) => {
      if (t.namespace) {
        namespaces.add(t.namespace);
      }
    });

    return Array.from(namespaces);
  } catch (error) {
    console.error("Error fetching namespaces:", error);
    return [];
  }
}
