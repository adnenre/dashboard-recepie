// app/configuration/translations/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Search, Plus, Edit3, Trash2, ArrowLeft, Languages, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/hooks";
import { useTranslationStore } from "@/store/translationStore";
import { SUPPORTED_LOCALES, LOCALE_METADATA } from "@/types/translation";

export default function TranslationsPage() {
  const router = useRouter();
  const { user, loggedIn, loading: authLoading } = useAuth();
  const { locale, setLocale, t } = useLocale();

  const { translations, isLoading, error, filters, selectedLocale, fetchTranslations, setFilters, setSelectedLocale, removeTranslation, clearError } =
    useTranslationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTranslation, setNewTranslation] = useState({
    key: "",
    value: "",
    namespace: "common",
  });

  // Load translations when logged in and locale/selectedLocale changes
  useEffect(() => {
    if (loggedIn) {
      fetchTranslations({ locale: selectedLocale });
    }
  }, [loggedIn, selectedLocale]);

  // Sync selectedLocale with locale from useLocale
  useEffect(() => {
    if (locale && SUPPORTED_LOCALES.includes(locale as any)) {
      setSelectedLocale(locale);
    }
  }, [locale]);

  // Filter translations based on search
  const filteredTranslations = translations.filter((trans) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return trans.key.toLowerCase().includes(query) || trans.value.toLowerCase().includes(query);
  });

  // Handle edit
  const startEdit = (trans: any) => {
    setEditingKey(trans.$id);
    setEditValue(trans.value);
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    try {
      await useTranslationStore.getState().editTranslation(id, { value: editValue });
      setEditingKey(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  // Handle delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeTranslation(deleteTarget.$id);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Handle add
  const handleAdd = async () => {
    if (!newTranslation.key.trim() || !newTranslation.value.trim()) return;
    try {
      await useTranslationStore.getState().addTranslation({
        key: newTranslation.key.trim(),
        locale: selectedLocale,
        value: newTranslation.value.trim(),
        namespace: newTranslation.namespace,
      });
      setShowAddModal(false);
      setNewTranslation({ key: "", value: "", namespace: "common" });
    } catch (error) {
      console.error("Failed to add translation:", error);
    }
  };

  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale as any);
    setSelectedLocale(newLocale);
  };

  // Loading state
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
          <p className="mt-4 text-muted-foreground">{t.loading || "Loading..."}</p>
        </div>
      </main>
    );
  }

  // Not logged in
  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="text-center">
          <Globe className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-semibold">Translation Manager</h1>
          <p className="mt-2 text-muted-foreground">Please log in to manage translations.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // Main translations dashboard
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Globe className="size-5" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">configuration</p>
              <h1 className="font-serif text-2xl font-semibold">Translations</h1>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Language Selector & Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <Languages className="text-muted-foreground size-5" />
            <select
              value={selectedLocale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_METADATA[loc]?.flag || "🌐"} {LOCALE_METADATA[loc]?.name || loc}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">{translations.length} translations</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Plus className="size-5" />
            Add Translation
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            <AlertCircle className="size-5" />
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="ml-auto text-sm hover:opacity-70">
              ✕
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Search className="text-muted-foreground size-5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search translations by key or value..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Translations Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">Loading translations...</span>
            </div>
          ) : filteredTranslations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-muted-foreground">No translations found</p>
              <p className="text-sm text-muted-foreground/70">Try adjusting your search or add a new translation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">Key</th>
                    <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">Namespace</th>
                    <th className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTranslations.map((trans) => (
                    <tr key={trans.$id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-foreground">{trans.key}</td>
                      <td className="px-4 py-3 text-sm">
                        {editingKey === trans.$id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(trans.$id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className="flex-1 rounded-lg border border-ring px-3 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEdit(trans.$id)}
                              className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={trans.value ? "" : "text-destructive"}>{trans.value || "⚠️ Empty"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {trans.namespace || "common"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingKey !== trans.$id && (
                            <>
                              <button
                                onClick={() => startEdit(trans)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
                              >
                                <Edit3 className="size-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(trans)}
                                className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
              <h2 className="font-serif text-2xl font-semibold">Delete translation?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Are you sure you want to delete "{deleteTarget.key}"?</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold hover:bg-muted transition-colors"
                >
                  No
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-lg bg-destructive px-4 py-2 font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
              <h2 className="font-serif text-2xl font-semibold">Add Translation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Adding translation for {LOCALE_METADATA[selectedLocale as keyof typeof LOCALE_METADATA]?.name || selectedLocale}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Key</label>
                  <input
                    type="text"
                    value={newTranslation.key}
                    onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                    placeholder="e.g., welcome"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Value</label>
                  <textarea
                    value={newTranslation.value}
                    onChange={(e) => setNewTranslation({ ...newTranslation, value: e.target.value })}
                    placeholder="Enter the translated text..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Namespace</label>
                  <input
                    type="text"
                    value={newTranslation.namespace}
                    onChange={(e) => setNewTranslation({ ...newTranslation, namespace: e.target.value })}
                    placeholder="common"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-border px-4 py-2 font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  Add Translation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
