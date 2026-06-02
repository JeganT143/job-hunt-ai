"use client";

import { useState } from "react";
import { X, Plus, Loader2, Briefcase } from "lucide-react";
import type { Application } from "./types";
import { ALL_STATUSES } from "./types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors";

interface Props {
  onClose: () => void;
  onAdded: (app: Application) => void;
}

export function AddApplicationModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    company: "",
    role: "",
    appliedDate: new Date().toISOString().slice(0, 10),
    status: "Applied",
    salary: "",
    jobUrl: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and Role are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company.trim(),
          role: form.role.trim(),
          appliedDate: new Date(form.appliedDate).toISOString(),
          status: form.status,
          salary: form.salary.trim() || undefined,
          jobUrl: form.jobUrl.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const created = await res.json();
      onAdded({ ...created, interviews: [], contacts: [] });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40">
            <Briefcase size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm flex-1">New Application</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">

            {/* Company + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company *">
                <input
                  className={inputCls}
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="Acme Corp"
                  autoFocus
                />
              </Field>
              <Field label="Role *">
                <input
                  className={inputCls}
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  placeholder="Senior Software Engineer"
                />
              </Field>
            </div>

            {/* Status + Applied Date */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Applied Date">
                <input className={inputCls} type="date" value={form.appliedDate} onChange={(e) => update("appliedDate", e.target.value)} />
              </Field>
            </div>

            {/* Salary + Job URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Salary / Range">
                <input className={inputCls} value={form.salary} onChange={(e) => update("salary", e.target.value)} placeholder="$150k – $180k" />
              </Field>
              <Field label="Job URL">
                <input className={inputCls} type="url" value={form.jobUrl} onChange={(e) => update("jobUrl", e.target.value)} placeholder="https://…" />
              </Field>
            </div>

            {/* Notes */}
            <Field label="Notes">
              <textarea
                className={`${inputCls} resize-none leading-relaxed font-[inherit]`}
                rows={5}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder={"Key requirements, compensation details, recruiter notes, why you're excited about this role…"}
              />
            </Field>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? "Saving…" : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
