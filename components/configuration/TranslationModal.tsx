// components/configuration/TranslationModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Translation, SUPPORTED_LOCALES, LOCALE_METADATA } from "@/types/translation";
import { useTranslationStore } from "@/store/translationStore";

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  translation?: Translation | null;
  selectedLocale: string;
}

export default function TranslationModal({ isOpen, onClose, onSuccess, translation, selectedLocale }: TranslationModalProps) {
  const { addTranslation, editTranslation, isLoading } = useTranslationStore();

  const [formData, setFormData] = useState({
    key: "",
    locale: selectedLocale,
    value: "",
    namespace: "common",
    type: "string" as "string" | "function" | "array" | "object",
  });

  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or translation changes
  useEffect(() => {
    if (isOpen) {
      if (translation) {
        // Editing mode
        setFormData({
          key: translation.key,
          locale: translation.locale,
          value: translation.value,
          namespace: translation.namespace || "common",
          type: translation.type || "string",
        });
      } else {
        // Create mode
        setFormData({
          key: "",
          locale: selectedLocale,
          value: "",
          namespace: "common",
          type: "string",
        });
      }
      setError(null);
    }
  }, [isOpen, translation, selectedLocale]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.key.trim()) {
      setError("Key is required");
      return;
    }
    if (!formData.value.trim()) {
      setError("Value is required");
      return;
    }
    if (!formData.locale) {
      setError("Locale is required");
      return;
    }

    try {
      if (translation) {
        // Edit mode
        await editTranslation(translation.$id, {
          value: formData.value,
          namespace: formData.namespace,
        });
      } else {
        // Create mode
        await addTranslation({
          key: formData.key.trim(),
          locale: formData.locale,
          value: formData.value.trim(),
          namespace: formData.namespace,
          type: formData.type,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save translation");
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translation ? "✏️ Edit Translation" : "➕ Add Translation"}</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span className="text-gray-500 dark:text-gray-400">✕</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Key (disabled in edit mode) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              disabled={!!translation}
              placeholder="e.g., greeting, welcome, navHome"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {translation && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Key cannot be changed</p>}
          </div>

          {/* Locale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.locale}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
              disabled={!!translation}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {SUPPORTED_LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_METADATA[locale]?.flag || "🌐"} {LOCALE_METADATA[locale]?.name || locale}
                </option>
              ))}
            </select>
            {translation && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Locale cannot be changed</p>}
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Enter the translated text..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Namespace */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Namespace</label>
            <input
              type="text"
              value={formData.namespace}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              placeholder="common, ingredients, navigation, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              disabled={!!translation}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="string">String</option>
              <option value="function">Function</option>
              <option value="array">Array</option>
              <option value="object">Object</option>
            </select>
          </div>

          {/* Preview (only show for string type) */}
          {formData.type === "string" && formData.value && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
              <p className="text-sm text-gray-900 dark:text-white">{formData.value}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : translation ? (
                "💾 Update"
              ) : (
                "➕ Add"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
