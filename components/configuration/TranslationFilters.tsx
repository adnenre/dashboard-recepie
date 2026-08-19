// components/configuration/TranslationFilters.tsx

"use client";

import { useState, useEffect } from "react";
import { SUPPORTED_LOCALES, LOCALE_METADATA, type TranslationFilters } from "@/types/translation";
import { getNamespaces } from "@/lib/appwrite-translation";

interface TranslationFiltersProps {
  selectedLocale: string;
  onLocaleChange: (locale: string) => void;
  filters: TranslationFilters;
  onFilterChange: (filters: Partial<TranslationFilters>) => void;
  isLoading?: boolean;
}

export default function TranslationFilters({ selectedLocale, onLocaleChange, filters, onFilterChange, isLoading = false }: TranslationFiltersProps) {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Load namespaces on mount
  useEffect(() => {
    const loadNamespaces = async () => {
      try {
        const ns = await getNamespaces();
        setNamespaces(ns);
      } catch (error) {
        console.error("Failed to load namespaces:", error);
      }
    };
    loadNamespaces();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleLocaleChange = (locale: string) => {
    onLocaleChange(locale);
    onFilterChange({ locale });
  };

  const handleNamespaceChange = (namespace: string) => {
    onFilterChange({ namespace: namespace || undefined });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    onFilterChange({
      search: undefined,
      namespace: undefined,
      locale: selectedLocale,
    });
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end">
        {/* Language Selector */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
          <select
            value={selectedLocale}
            onChange={(e) => handleLocaleChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {LOCALE_METADATA[locale]?.flag || "🌐"} {LOCALE_METADATA[locale]?.name || locale}
              </option>
            ))}
          </select>
        </div>

        {/* Namespace Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Namespace</label>
          <select
            value={filters.namespace || ""}
            onChange={(e) => handleNamespaceChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-[2] min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by key or value..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.namespace) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.namespace && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              📂 {filters.namespace}
              <button onClick={() => handleNamespaceChange("")} className="ml-1 hover:text-blue-900 dark:hover:text-blue-100">
                ✕
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
              🔍 {filters.search}
              <button onClick={() => setSearchValue("")} className="ml-1 hover:text-purple-900 dark:hover:text-purple-100">
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
