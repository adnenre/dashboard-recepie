// components/configuration/TranslationTable.tsx

"use client";

import { useState } from "react";
import { Translation } from "@/types/translation";
import { LOCALE_METADATA } from "@/types/translation";

interface TranslationTableProps {
  translations: Translation[];
  isLoading: boolean;
  onEdit: (translation: Translation) => void;
  onDelete: (id: string) => void;
  selectedLocale: string;
}

export default function TranslationTable({ translations, isLoading, onEdit, onDelete, selectedLocale }: TranslationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (translation: Translation) => {
    setEditingId(translation.$id);
    setEditValue(translation.value);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = (translation: Translation) => {
    onEdit({ ...translation, value: editValue });
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, translation: Translation) => {
    if (e.key === "Enter") {
      handleSaveEdit(translation);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading translations...</span>
      </div>
    );
  }

  if (translations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No translations found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or add a new translation.</p>
      </div>
    );
  }

  const localeInfo = LOCALE_METADATA[selectedLocale as keyof typeof LOCALE_METADATA];

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Value ({localeInfo?.name || selectedLocale})
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Namespace</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {translations.map((translation) => (
            <tr key={translation.$id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              {/* Key */}
              <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{translation.key}</td>

              {/* Value */}
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {editingId === translation.$id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, translation)}
                      className="flex-1 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(translation)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="break-all">{translation.value}</span>
                    {translation.value === "" && <span className="text-xs text-red-500 dark:text-red-400 font-medium">⚠️ Empty</span>}
                  </div>
                )}
              </td>

              {/* Namespace */}
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  {translation.namespace || "common"}
                </span>
              </td>

              {/* Type */}
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {translation.type || "string"}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-sm text-right">
                <div className="flex items-center justify-end gap-2">
                  {editingId !== translation.$id && (
                    <>
                      <button
                        onClick={() => handleStartEdit(translation)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(translation.$id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(translation.$updatedAt).toLocaleDateString()}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer with count */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing <strong className="text-gray-900 dark:text-white">{translations.length}</strong> translations
          </span>
          <span>Last updated: {translations.length > 0 ? new Date(translations[0].$updatedAt).toLocaleString() : "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
