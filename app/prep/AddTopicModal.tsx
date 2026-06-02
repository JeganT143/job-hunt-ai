"use client";

import { useState } from "react";
import { X, Plus, Loader2, BookOpen } from "lucide-react";
import {
  CATEGORIES, STATUSES,
  serializeResources,
  type PrepTopic, type Resource,
} from "./types";

const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

interface Props {
  onClose: () => void;
  onAdded: (topic: PrepTopic) => void;
}

export function AddTopicModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    title: "",
    category: "DSA" as string,
    priority: "Medium",
    status: "NotStarted",
    notes: "",
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function up(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setError("");
  }

  function addResource() {
    setResources((prev) => [...prev, { url: "", label: "" }]);
  }

  function updateResource(i: number, field: keyof Resource, val: string) {
    setResources((prev) => prev.map((r, j) => j === i ? { ...r, [field]: val } : r));
  }

  function removeResource(i: number) {
    setResources((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/prep-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          priority: form.priority,
          status: form.status,
          notes: form.notes.trim() || null,
          resources: resources.length > 0 ? serializeResources(resources) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      onAdded({ ...created, updatedAt: created.updatedAt });
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm flex-1">New Prep Topic</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Title */}
            <Field label="Title *">
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => up("title", e.target.value)}
                placeholder="e.g. Binary Trees & BST Traversals"
                autoFocus
              />
            </Field>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select className={inputCls} value={form.category} onChange={(e) => up("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className={inputCls} value={form.priority} onChange={(e) => up("priority", e.target.value)}>
                  {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            {/* Status */}
            <Field label="Initial Status">
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => up("status", s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      form.status === s
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {s === "NotStarted" ? "Not Started" : s === "InProgress" ? "In Progress" : "Done"}
                  </button>
                ))}
              </div>
            </Field>

            {/* Notes */}
            <Field label="Notes (Markdown supported)">
              <textarea
                className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
                rows={7}
                value={form.notes}
                onChange={(e) => up("notes", e.target.value)}
                placeholder={"# Overview\nDescribe what you want to study...\n\n## Key Concepts\n- Concept 1\n- Concept 2\n\n**Important:** Something crucial to remember."}
              />
            </Field>

            {/* Resources */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resources</span>
                <button
                  type="button"
                  onClick={addResource}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium"
                >
                  <Plus size={12} /> Add link
                </button>
              </div>

              {resources.length === 0 ? (
                <button
                  type="button"
                  onClick={addResource}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-500 transition-colors"
                >
                  + Add resource links (tutorials, docs, videos…)
                </button>
              ) : (
                <div className="space-y-3">
                  {resources.map((r, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 space-y-2">
                        <input
                          className={inputCls}
                          value={r.label}
                          onChange={(e) => updateResource(i, "label", e.target.value)}
                          placeholder="Label (e.g. NeetCode Binary Trees)"
                        />
                        <input
                          className={inputCls}
                          type="url"
                          value={r.url}
                          onChange={(e) => updateResource(i, "url", e.target.value)}
                          placeholder="https://…"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResource(i)}
                        className="mt-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? "Saving…" : "Add Topic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
