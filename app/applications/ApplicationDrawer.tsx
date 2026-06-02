"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Trash2, ExternalLink, Plus, Pencil, Check, ChevronDown,
  Calendar, DollarSign, Link2, FileText, Loader2, Phone,
  Monitor, Cog, UserRound, Award, Mail, Link2 as LinkedInIcon,
} from "lucide-react";
import type { Application, Interview, Contact } from "./types";
import { ALL_STATUSES, STATUS_META, INTERVIEW_TYPES, INTERVIEW_OUTCOMES } from "./types";

// ─── Field helpers ───────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">{children}</p>;
}

function FieldValue({ children, placeholder = "—" }: { children?: React.ReactNode; placeholder?: string }) {
  return (
    <p className={`text-sm ${children ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600 italic"}`}>
      {children || placeholder}
    </p>
  );
}

function InlineInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{label}</span>
      <input
        {...props}
        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
      />
    </label>
  );
}

function InlineSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{label}</span>
      <select
        {...props}
        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
      >
        {children}
      </select>
    </label>
  );
}

function InlineTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{label}</span>
      <textarea
        {...props}
        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none transition-colors leading-relaxed"
      />
    </label>
  );
}

const TYPE_ICON: Record<string, React.ElementType> = {
  Phone: Phone,
  Technical: Monitor,
  "System Design": Cog,
  HR: UserRound,
  Final: Award,
};

const OUTCOME_STYLE: Record<string, string> = {
  Pending: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
  Passed: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  Failed: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
};

// ─── Interview card / form ────────────────────────────────────────────────────
function InterviewItem({
  interview,
  applicationId,
  onSave,
  onDelete,
}: {
  interview: Interview;
  applicationId: string;
  onSave: (i: Interview) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    round: interview.round,
    type: interview.type,
    scheduledAt: interview.scheduledAt.slice(0, 16),
    outcome: interview.outcome,
    notes: interview.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/interviews/${interview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onSave({ ...updated, scheduledAt: updated.scheduledAt });
      setEditing(false);
    } catch { alert("Failed to save interview."); }
    finally { setSaving(false); }
  }

  const TypeIcon = TYPE_ICON[interview.type] ?? Phone;

  if (!editing) {
    return (
      <div className="group flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
          <TypeIcon size={14} className="text-slate-500 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Round {interview.round}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{interview.type}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date(interview.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          {interview.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{interview.notes}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-start gap-1">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${OUTCOME_STYLE[interview.outcome] ?? OUTCOME_STYLE.Pending}`}>
            {interview.outcome}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(interview.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-800/50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InlineInput
          label="Round"
          type="number"
          min={1}
          value={form.round}
          onChange={(e) => setForm((f) => ({ ...f, round: +e.target.value }))}
        />
        <InlineSelect label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </InlineSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InlineInput
          label="Date & Time"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
        />
        <InlineSelect label="Outcome" value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}>
          {INTERVIEW_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
        </InlineSelect>
      </div>
      <InlineTextarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="How it went, key topics…" />
      <div className="flex gap-2">
        <button onClick={() => setEditing(false)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Save
        </button>
      </div>
    </div>
  );
}

function AddInterviewForm({
  applicationId,
  nextRound,
  onSave,
  onCancel,
}: {
  applicationId: string;
  nextRound: number;
  onSave: (i: Interview) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ round: nextRound, type: "Phone", scheduledAt: "", outcome: "Pending", notes: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scheduledAt) { alert("Please set a date and time."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, applicationId, scheduledAt: new Date(form.scheduledAt).toISOString() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      onSave({ ...created, scheduledAt: created.scheduledAt });
    } catch { alert("Failed to add interview."); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-800/50 space-y-3">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Interview</p>
      <div className="grid grid-cols-2 gap-3">
        <InlineInput label="Round" type="number" min={1} value={form.round} onChange={(e) => setForm((f) => ({ ...f, round: +e.target.value }))} />
        <InlineSelect label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </InlineSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InlineInput label="Date & Time *" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} required />
        <InlineSelect label="Outcome" value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}>
          {INTERVIEW_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
        </InlineSelect>
      </div>
      <InlineTextarea label="Notes (optional)" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Interviewer name, prep notes…" />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </button>
      </div>
    </form>
  );
}

// ─── Contact card / form ──────────────────────────────────────────────────────
function ContactItem({
  contact,
  onSave,
  onDelete,
}: {
  contact: Contact;
  onSave: (c: Contact) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: contact.name,
    role: contact.role ?? "",
    email: contact.email ?? "",
    linkedIn: contact.linkedIn ?? "",
    notes: contact.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onSave({ ...contact, ...form });
      setEditing(false);
    } catch { alert("Failed to save contact."); }
    finally { setSaving(false); }
  }

  if (!editing) {
    return (
      <div className="group flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-200 to-violet-100 dark:from-violet-800 dark:to-violet-900 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 uppercase">
            {contact.name.slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{contact.name}</p>
          {contact.role && <p className="text-xs text-slate-500 dark:text-slate-400">{contact.role}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {contact.email && (
              <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
                <Mail size={10} /> {contact.email}
              </a>
            )}
            {contact.linkedIn && (
              <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
                <LinkedInIcon size={10} /> LinkedIn
              </a>
            )}
          </div>
          {contact.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{contact.notes}</p>}
        </div>
        <div className="flex-shrink-0 flex items-start gap-1">
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(contact.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-800/50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InlineInput label="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <InlineInput label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Recruiter, HM…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InlineInput label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <InlineInput label="LinkedIn URL" type="url" value={form.linkedIn} onChange={(e) => setForm((f) => ({ ...f, linkedIn: e.target.value }))} placeholder="https://…" />
      </div>
      <InlineTextarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
        </button>
      </div>
    </div>
  );
}

function AddContactForm({
  applicationId,
  onSave,
  onCancel,
}: {
  applicationId: string;
  onSave: (c: Contact) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ name: "", role: "", email: "", linkedIn: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, applicationId }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      onSave(created);
    } catch { alert("Failed to add contact."); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-800/50 space-y-3">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">New Contact</p>
      <div className="grid grid-cols-2 gap-3">
        <InlineInput label="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <InlineInput label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Recruiter, HM…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InlineInput label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <InlineInput label="LinkedIn URL" type="url" value={form.linkedIn} onChange={(e) => setForm((f) => ({ ...f, linkedIn: e.target.value }))} placeholder="https://…" />
      </div>
      <InlineTextarea label="Notes (optional)" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </button>
      </div>
    </form>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, count, action, children }: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h4>
          {count !== undefined && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">{count}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
interface Props {
  app: Application;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onUpdate: (app: Application) => void;
  onDelete: (id: string) => void;
}

export function ApplicationDrawer({ app, onClose, onStatusChange, onUpdate, onDelete }: Props) {
  const [visible, setVisible] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>(app.interviews);
  const [contacts, setContacts] = useState<Contact[]>(app.contacts);

  // Edit state for main details
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company: app.company,
    role: app.role,
    appliedDate: app.appliedDate.slice(0, 10),
    salary: app.salary ?? "",
    jobUrl: app.jobUrl ?? "",
  });
  const [notes, setNotes] = useState(app.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Add forms
  const [addInterview, setAddInterview] = useState(false);
  const [addContact, setAddContact] = useState(false);

  // Mount animation
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Sync if app prop changes from outside (e.g. status update from table)
  useEffect(() => {
    setInterviews(app.interviews);
    setContacts(app.contacts);
    setNotes(app.notes ?? "");
    if (!editing) {
      setEditForm({
        company: app.company, role: app.role,
        appliedDate: app.appliedDate.slice(0, 10),
        salary: app.salary ?? "", jobUrl: app.jobUrl ?? "",
      });
    }
  }, [app.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function buildUpdatedApp(overrides: Partial<Application> = {}): Application {
    return { ...app, interviews, contacts, notes, ...overrides };
  }

  async function saveDetails() {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, appliedDate: new Date(editForm.appliedDate).toISOString() }),
      });
      if (!res.ok) throw new Error();
      const updated: Application = await res.json();
      onUpdate(buildUpdatedApp({ ...updated, updatedAt: updated.updatedAt }));
      setEditing(false);
    } catch { alert("Failed to save changes."); }
    finally { setSaving(false); }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      onUpdate(buildUpdatedApp({ notes }));
      setEditingNotes(false);
    } catch { alert("Failed to save notes."); }
    finally { setSavingNotes(false); }
  }

  async function deleteInterview(id: string) {
    if (!confirm("Remove this interview?")) return;
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    const next = interviews.filter((i) => i.id !== id);
    onUpdate(buildUpdatedApp({ interviews: next }));
    await fetch(`/api/interviews/${id}`, { method: "DELETE" });
  }

  async function deleteContact(id: string) {
    if (!confirm("Remove this contact?")) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
    const next = contacts.filter((c) => c.id !== id);
    onUpdate(buildUpdatedApp({ contacts: next }));
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
  }

  const meta = STATUS_META[app.status] ?? STATUS_META.Withdrawn;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-250 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-250 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}>

        {/* Panel header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={editForm.company}
                  onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full text-lg font-bold bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 pb-1"
                  placeholder="Company"
                />
                <input
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 focus:outline-none focus:border-violet-500 pb-1"
                  placeholder="Role"
                />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{app.company}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{app.role}</p>
              </>
            )}
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={saveDetails} disabled={saving} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 flex items-center gap-1.5 transition-colors">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Edit details">
                <Pencil size={15} />
              </button>
            )}
            <button onClick={() => onDelete(app.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors" title="Delete application">
              <Trash2 size={15} />
            </button>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Status pipeline */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {ALL_STATUSES.map((s) => {
              const sm = STATUS_META[s];
              const active = app.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(app.id, s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active ? `${sm.pill} shadow-sm ring-2 ring-offset-1 dark:ring-offset-slate-900 ring-offset-white ${sm.ring.replace("ring-", "ring-")}` : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {active && <Check size={10} />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">

          {/* Details */}
          <div className="pt-5 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-4 pb-5">
              {editing ? (
                <>
                  <InlineInput label="Applied Date" type="date" value={editForm.appliedDate} onChange={(e) => setEditForm((f) => ({ ...f, appliedDate: e.target.value }))} />
                  <InlineInput label="Salary" value={editForm.salary} onChange={(e) => setEditForm((f) => ({ ...f, salary: e.target.value }))} placeholder="$150k – $180k" />
                  <div className="col-span-2">
                    <InlineInput label="Job URL" type="url" value={editForm.jobUrl} onChange={(e) => setEditForm((f) => ({ ...f, jobUrl: e.target.value }))} placeholder="https://…" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <FieldLabel>Applied Date</FieldLabel>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <FieldValue>{new Date(app.appliedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</FieldValue>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Salary</FieldLabel>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={13} className="text-slate-400" />
                      <FieldValue placeholder="Not specified">{app.salary}</FieldValue>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>Job URL</FieldLabel>
                    {app.jobUrl ? (
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline truncate">
                        <Link2 size={13} /> {app.jobUrl}
                        <ExternalLink size={11} className="flex-shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Link2 size={13} className="text-slate-400" />
                        <FieldValue placeholder="No URL" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          <Section
            title="Notes"
            action={
              !editingNotes ? (
                <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                  <Pencil size={11} /> Edit
                </button>
              ) : null
            }
          >
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Add notes, key points, action items, follow-ups…"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none leading-relaxed"
                />
                <div className="flex gap-2">
                  <button onClick={() => { setNotes(app.notes ?? ""); setEditingNotes(false); }} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveNotes} disabled={savingNotes} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 flex items-center justify-center gap-1 transition-colors">
                    {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                  </button>
                </div>
              </div>
            ) : notes ? (
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{notes}</p>
            ) : (
              <button onClick={() => setEditingNotes(true)} className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                <FileText size={14} /> Add notes…
              </button>
            )}
          </Section>

          {/* Interviews */}
          <Section
            title="Interviews"
            count={interviews.length}
            action={
              !addInterview ? (
                <button onClick={() => setAddInterview(true)} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors font-medium">
                  <Plus size={12} /> Add
                </button>
              ) : null
            }
          >
            <div className="space-y-2">
              {interviews.map((i) => (
                <InterviewItem
                  key={i.id}
                  interview={i}
                  applicationId={app.id}
                  onSave={(updated) => {
                    const next = interviews.map((x) => (x.id === updated.id ? updated : x));
                    setInterviews(next);
                    onUpdate(buildUpdatedApp({ interviews: next }));
                  }}
                  onDelete={deleteInterview}
                />
              ))}
              {addInterview && (
                <AddInterviewForm
                  applicationId={app.id}
                  nextRound={(interviews[interviews.length - 1]?.round ?? 0) + 1}
                  onSave={(created) => {
                    const next = [...interviews, created];
                    setInterviews(next);
                    onUpdate(buildUpdatedApp({ interviews: next }));
                    setAddInterview(false);
                  }}
                  onCancel={() => setAddInterview(false)}
                />
              )}
              {interviews.length === 0 && !addInterview && (
                <button onClick={() => setAddInterview(true)} className="w-full py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 dark:text-slate-600 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                  + Add first interview round
                </button>
              )}
            </div>
          </Section>

          {/* Contacts */}
          <Section
            title="Contacts"
            count={contacts.length}
            action={
              !addContact ? (
                <button onClick={() => setAddContact(true)} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors font-medium">
                  <Plus size={12} /> Add
                </button>
              ) : null
            }
          >
            <div className="space-y-2">
              {contacts.map((c) => (
                <ContactItem
                  key={c.id}
                  contact={c}
                  onSave={(updated) => {
                    const next = contacts.map((x) => (x.id === updated.id ? updated : x));
                    setContacts(next);
                    onUpdate(buildUpdatedApp({ contacts: next }));
                  }}
                  onDelete={deleteContact}
                />
              ))}
              {addContact && (
                <AddContactForm
                  applicationId={app.id}
                  onSave={(created) => {
                    const next = [...contacts, created];
                    setContacts(next);
                    onUpdate(buildUpdatedApp({ contacts: next }));
                    setAddContact(false);
                  }}
                  onCancel={() => setAddContact(false)}
                />
              )}
              {contacts.length === 0 && !addContact && (
                <button onClick={() => setAddContact(true)} className="w-full py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 dark:text-slate-600 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                  + Add a contact
                </button>
              )}
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}
