// hooks/useLocale.ts
import { useEffect, useState } from "react";
import { useLocaleStore } from "@/store/localeStore";
import { getDirection, translations } from "@/lib/i18n";

const useLocale = () => {
  const { locale, setLocale } = useLocaleStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration to complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update document when locale changes (only on client)
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = locale;
      document.documentElement.dir = getDirection(locale);
    }
  }, [locale, isHydrated]);

  const t = translations[locale];

  return {
    locale: isHydrated ? locale : "en", // Fallback during SSR
    setLocale,
    t,
    isHydrated,
  };
};

export default useLocale;
