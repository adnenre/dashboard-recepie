// store/translationStore.ts

import { create } from "zustand";
import { Translation, TranslationFilters } from "@/types/translation";
import { getTranslations, createTranslation, updateTranslation, deleteTranslation, getTranslationsByLocale } from "@/lib/appwrite-translation";

interface TranslationState {
  // State
  translations: Translation[];
  isLoading: boolean;
  error: string | null;
  filters: TranslationFilters;
  selectedLocale: string;

  // Actions
  fetchTranslations: (filters?: TranslationFilters) => Promise<void>;
  fetchTranslationsByLocale: (locale: string) => Promise<Record<string, string>>;
  addTranslation: (data: {
    key: string;
    locale: string;
    value: string;
    namespace?: string;
    type?: "string" | "function" | "array" | "object";
  }) => Promise<Translation>;
  editTranslation: (id: string, data: { value?: string; namespace?: string }) => Promise<Translation>;
  removeTranslation: (id: string) => Promise<void>;
  setFilters: (filters: TranslationFilters) => void;
  setSelectedLocale: (locale: string) => void;
  clearError: () => void;
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  // Initial state
  translations: [],
  isLoading: false,
  error: null,
  filters: {},
  selectedLocale: "fr",

  // Fetch translations with filters
  fetchTranslations: async (filters?: TranslationFilters) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilters = filters || get().filters;
      const translations = await getTranslations(currentFilters);
      set({ translations, isLoading: false, filters: currentFilters });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to fetch translations",
      });
      throw error;
    }
  },

  // Fetch translations by locale (returns key-value object)
  fetchTranslationsByLocale: async (locale: string) => {
    try {
      const translations = await getTranslationsByLocale(locale);
      return translations;
    } catch (error: any) {
      set({
        error: error.message || `Failed to fetch translations for ${locale}`,
      });
      throw error;
    }
  },

  // Add new translation
  addTranslation: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newTranslation = await createTranslation({
        key: data.key,
        locale: data.locale,
        value: data.value,
        type: data.type || "string",
        namespace: data.namespace || "common",
      });

      // Update the translations list
      set((state) => ({
        translations: [newTranslation, ...state.translations],
        isLoading: false,
      }));

      return newTranslation;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to create translation",
      });
      throw error;
    }
  },

  // Edit translation
  editTranslation: async (id: string, data: { value?: string; namespace?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateTranslation(id, data);

      // Update the translations list
      set((state) => ({
        translations: state.translations.map((t) => (t.$id === id ? updated : t)),
        isLoading: false,
      }));

      return updated;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to update translation",
      });
      throw error;
    }
  },

  // Delete translation
  removeTranslation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteTranslation(id);

      // Remove from translations list
      set((state) => ({
        translations: state.translations.filter((t) => t.$id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to delete translation",
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters: TranslationFilters) => {
    set({ filters });
  },

  // Set selected locale
  setSelectedLocale: (locale: string) => {
    set({ selectedLocale: locale });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
