// types/translation.ts

/**
 * Translation document structure in Appwrite
 */
export interface Translation {
  $id: string; // Appwrite document ID
  $createdAt: string; // Appwrite auto-generated
  $updatedAt: string; // Appwrite auto-generated
  key: string; // Translation key (e.g., "greeting")
  locale: string; // Language code (fr, en, ar)
  value: string; // Translated text
  type?: "string" | "function" | "array" | "object"; // Data type
  namespace?: string; // Grouping (common, ingredients, etc.)
}

/**
 * Translation filter options for API queries
 */
export interface TranslationFilters {
  locale?: string; // Filter by language
  namespace?: string; // Filter by namespace
  search?: string; // Search in key or value
}

/**
 * Create translation payload
 */
export interface CreateTranslationPayload {
  key: string;
  locale: string;
  value: string;
  type?: "string" | "function" | "array" | "object";
  namespace?: string;
}

/**
 * Update translation payload
 */
export interface UpdateTranslationPayload {
  value?: string;
  type?: "string" | "function" | "array" | "object";
  namespace?: string;
}

/**
 * Supported languages
 */
export const SUPPORTED_LOCALES = ["fr", "en", "ar"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Locale metadata for UI display
 */
export const LOCALE_METADATA: Record<
  SupportedLocale,
  {
    code: SupportedLocale;
    name: string;
    flag: string;
    direction: "ltr" | "rtl";
  }
> = {
  fr: {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },
  en: {
    code: "en",
    name: "English",
    flag: "🇬🇧",
    direction: "ltr",
  },
  ar: {
    code: "ar",
    name: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },
};
