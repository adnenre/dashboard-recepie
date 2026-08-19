// components/configuration/TranslationStats.tsx

"use client";

import { Translation } from "@/types/translation";
import { SUPPORTED_LOCALES, LOCALE_METADATA } from "@/types/translation";

interface TranslationStatsProps {
  translations: Translation[];
  selectedLocale: string;
}

export default function TranslationStats({ translations, selectedLocale }: TranslationStatsProps) {
  // Count translations by locale
  const localeCounts: Record<string, number> = {};
  SUPPORTED_LOCALES.forEach((locale) => {
    localeCounts[locale] = translations.filter((t) => t.locale === locale).length;
  });

  // Count by namespace
  const namespaceCounts: Record<string, number> = {};
  translations.forEach((t) => {
    const ns = t.namespace || "common";
    namespaceCounts[ns] = (namespaceCounts[ns] || 0) + 1;
  });

  // Find most used namespace
  let mostUsedNamespace = "common";
  let maxCount = 0;
  Object.entries(namespaceCounts).forEach(([ns, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedNamespace = ns;
    }
  });

  const totalKeys = new Set(translations.map((t) => t.key)).size;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total translations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Translations</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{translations.length}</p>
          </div>
          <div className="text-3xl">📝</div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{totalKeys} unique keys across all languages</p>
      </div>

      {/* Current locale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {LOCALE_METADATA[selectedLocale as keyof typeof LOCALE_METADATA]?.name || selectedLocale}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{localeCounts[selectedLocale] || 0}</p>
          </div>
          <div className="text-3xl">{LOCALE_METADATA[selectedLocale as keyof typeof LOCALE_METADATA]?.flag || "🌐"}</div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {selectedLocale === "en" ? "🇬🇧" : selectedLocale === "fr" ? "🇫🇷" : "🇸🇦"} translations
        </p>
      </div>

      {/* By locale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">By Language</p>
        <div className="space-y-1">
          {SUPPORTED_LOCALES.map((locale) => (
            <div key={locale} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {LOCALE_METADATA[locale]?.flag || "🌐"} {LOCALE_METADATA[locale]?.name || locale}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{localeCounts[locale] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Namespace stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Namespaces</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(namespaceCounts).length}</p>
          </div>
          <div className="text-3xl">📂</div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Most used: {mostUsedNamespace} ({maxCount})
        </p>
      </div>
    </div>
  );
}
