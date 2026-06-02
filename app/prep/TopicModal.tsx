"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X, Pencil, Trash2, Check, Loader2, Plus, ExternalLink, BookOpen,
  Circle, CheckCircle2, RefreshCw,
} from "lucide-react";
import {
  CATEGORIES, PRIORITY_META, CATEGORY_META, STATUSES, COLUMNS,
  parseResources, serializeResources,
  type PrepTopic, type Resource,
} from "./types";

// ─── Reusable form primitives ─────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
      {children}
    </span>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="prose-custom text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-700 dark:text-slate-300">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-slate-700 dark:text-slate-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-700 dark:text-slate-300">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            return isBlock
              ? <pre className="my-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto text-xs font-mono"><code>{children}</code></pre>
              : <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-800 dark:text-slate-200">{children}</code>;
          },
          blockquote: ({ children }) => (
            <blockquote className="pl-3 border-l-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 italic my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Resource row (edit) ──────────────────────────────────────────────────────
function ResourceRow({
  resource,
  index,
  onChange,
  onRemove,
}: {
  resource: Resource;
  index: number;
  onChange: (i: number, field: keyof Resource, val: string) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 flex flex-col gap-1.5">
        <input
          className={inputCls}
          value={resource.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder="Label (e.g. Binary Trees Tutorial)"
        />
        <input
          className={inputCls}
          type="url"
          value={resource.url}
          onChange={(e) => onChange(index, "url", e.target.value)}
          placeholder="https://…"
        />
      </div>
      <button
        onClick={() => onRemove(index)}
        className="mt-1 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
interface Props {
  topic: PrepTopic;
  onClose: () => void;
  onUpdate: (t: PrepTopic) => void;
  onDelete: (id: string) => void;
}

export function TopicModal({ topic, onClose, onUpdate, onDelete }: Props) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(topic.title);
  const [editCategory, setEditCategory] = useState(topic.category);
  const [editPriority, setEditPriority] = useState(topic.priority);
  const [editStatus, setEditStatus] = useState(topic.status);
  const [editNotes, setEditNotes] = useState(topic.notes ?? "");
  const [editResources, setEditResources] = useState<Resource[]>(parseResources(topic.resources));

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function cancelEdit() {
    setEditTitle(topic.title);
    setEditCategory(topic.category);
    setEditPriority(topic.priority);
    setEditStatus(topic.status);
    setEditNotes(topic.notes ?? "");
    setEditResources(parseResources(topic.resources));
    setEditing(false);
  }

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/prep-topics/${topic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          priority: editPriority,
          status: editStatus,
          notes: editNotes.trim() || null,
          resources: serializeResources(editResources),
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdate({ ...updated, updatedAt: updated.updatedAt });
      setEditing(false);
    } catch { alert("Failed to save."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this prep topic?")) return;
    await fetch(`/api/prep-topics/${topic.id}`, { method: "DELETE" });
    onDelete(topic.id);
    handleClose();
  }

  async function changeStatus(newStatus: string) {
    setEditStatus(newStatus);
    if (!editing) {
      // Quick status change without entering edit mode
      const res = await fetch(`/api/prep-topics/${topic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate({ ...topic, status: newStatus, updatedAt: updated.updatedAt });
      }
    }
  }

  const resources = editing ? editResources : parseResources(topic.resources);
  const catMeta = CATEGORY_META[editing ? editCategory : topic.category] ?? CATEGORY_META.DSA;
  const priMeta = PRIORITY_META[editing ? editPriority : topic.priority] ?? PRIORITY_META.Medium;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <div
        className={`relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] transition-all duration-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-bold bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 pb-1"
              autoFocus
            />
          ) : (
            <h2 className="text-lg font-bold text-slate-900 dark:text-white pr-24">{topic.title}</h2>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2">
            {editing ? (
              <>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </>
            ) : (
              <>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${catMeta.badge}`}>
                  {topic.category}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priMeta.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${priMeta.dot}`} />
                  {topic.priority}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 flex items-center gap-1.5 transition-colors">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Edit">
                  <Pencil size={15} />
                </button>
                <button onClick={handleDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status pipeline */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto">
          {COLUMNS.map((col) => {
            const activeStatus = editing ? editStatus : topic.status;
            const isActive = activeStatus === col.id;
            return (
              <button
                key={col.id}
                onClick={() => changeStatus(col.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? col.id === "NotStarted"
                      ? "bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 shadow-sm"
                      : col.id === "InProgress"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {isActive && col.id === "NotStarted" && <Circle size={10} />}
                {isActive && col.id === "InProgress" && <RefreshCw size={10} className="animate-spin" />}
                {isActive && col.id === "Done" && <CheckCircle2 size={10} />}
                {col.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-slate-400" />
              <Label>Notes</Label>
            </div>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={10}
                className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
                placeholder={"Write notes in Markdown…\n\n# Big O Complexity\n- O(n log n) for merge sort\n\n**Key insight:** …"}
              />
            ) : topic.notes ? (
              <MarkdownBody content={topic.notes} />
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                <Pencil size={13} /> Add notes (supports Markdown)
              </button>
            )}
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ExternalLink size={14} className="text-slate-400" />
                <Label>Resources</Label>
                {resources.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    {resources.length}
                  </span>
                )}
              </div>
              {editing && (
                <button
                  onClick={() => setEditResources((prev) => [...prev, { url: "", label: "" }])}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium transition-colors"
                >
                  <Plus size={12} /> Add resource
                </button>
              )}
            </div>

            {editing ? (
              editResources.length === 0 ? (
                <button
                  onClick={() => setEditResources([{ url: "", label: "" }])}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-500 transition-colors"
                >
                  + Add a resource link
                </button>
              ) : (
                <div className="space-y-3">
                  {editResources.map((r, i) => (
                    <ResourceRow
                      key={i}
                      resource={r}
                      index={i}
                      onChange={(idx, field, val) =>
                        setEditResources((prev) => prev.map((res, j) => j === idx ? { ...res, [field]: val } : res))
                      }
                      onRemove={(idx) => setEditResources((prev) => prev.filter((_, j) => j !== idx))}
                    />
                  ))}
                </div>
              )
            ) : resources.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-600 italic">No resources added yet.</p>
            ) : (
              <div className="space-y-2">
                {resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={13} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                        {r.label || r.url}
                      </p>
                      {r.label && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{r.url}</p>
                      )}
                    </div>
                    <ExternalLink size={13} className="text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
