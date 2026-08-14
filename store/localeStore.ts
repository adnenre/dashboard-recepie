// store/localeStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Locale } from "@/lib/i18n";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en", // Default value
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: "recep-locale", // Key in localStorage
      storage: createJSONStorage(() => localStorage), // Safe localStorage access
    },
  ),
);
