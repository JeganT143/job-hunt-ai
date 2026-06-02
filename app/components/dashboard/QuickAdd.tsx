"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, CheckSquare, BookOpen, X, Loader2 } from "lucide-react";

type ModalType = "application" | "todo" | "topic" | null;

const STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn"];
const PRIORITIES = ["Low", "Medium", "High"];
const TOPIC_STATUSES = ["NotStarted", "InProgress", "Done"];

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <input
        {...props}
        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--accent-dim)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
          props.onBlur?.(e);
        }}
      />
    </label>
  );
}

function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <select
        {...props}
        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all appearance-none"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-primary)",
        }}
      >
        {children}
      </select>
    </label>
  );
}

function Modal({
  title,
  icon,
  onClose,
  onSubmit,
  loading,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center gap-3 px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}
          >
            <span style={{ color: "var(--accent)" }}>{icon}</span>
          </div>
          <h2 className="font-semibold text-sm text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-xl transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "";
              (e.currentTarget as HTMLElement).style.color = "";
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-4">{children}</div>

          <div
            className="flex gap-3 px-6 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "var(--accent)",
                color: "var(--accent-fg)",
              }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {loading ? "Saving…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const close = useCallback(() => setOpen(null), []);

  async function submit(url: string, body: object) {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      close();
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleApp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    submit("/api/applications", {
      company: f.get("company"),
      role: f.get("role"),
      appliedDate: f.get("appliedDate") || new Date().toISOString().slice(0, 10),
      status: f.get("status"),
      salary: f.get("salary") || undefined,
      jobUrl: f.get("jobUrl") || undefined,
    });
  }

  function handleTodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    submit("/api/todos", {
      title: f.get("title"),
      priority: f.get("priority"),
      category: f.get("category") || undefined,
      dueDate: f.get("dueDate") || undefined,
    });
  }

  function handleTopic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    submit("/api/prep-topics", {
      category: f.get("category"),
      title: f.get("title"),
      priority: f.get("priority"),
      status: f.get("status"),
    });
  }

  const actions = [
    {
      type: "application" as ModalType,
      label: "Application",
      desc: "Track a new job application",
      icon: <Briefcase size={15} />,
      color: "var(--accent)",
      bg: "var(--accent-dim)",
      border: "var(--accent-border)",
    },
    {
      type: "todo" as ModalType,
      label: "Todo",
      desc: "Add a task to your list",
      icon: <CheckSquare size={15} />,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.09)",
      border: "rgba(251,191,36,0.22)",
    },
    {
      type: "topic" as ModalType,
      label: "Prep Topic",
      desc: "Log a study or prep area",
      icon: <BookOpen size={15} />,
      color: "#34d399",
      bg: "rgba(52,211,153,0.09)",
      border: "rgba(52,211,153,0.22)",
    },
  ];

  return (
    <>
      <div className="card p-6 flex flex-col h-full">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Quick Add
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Jump-start your tracking
          </p>
        </div>

        <div className="space-y-2.5 flex-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => setOpen(a.type)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all group"
              style={{
                background: a.bg,
                border: `1px solid ${a.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)";
                (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = "";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              <div className="flex-shrink-0" style={{ color: a.color }}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {a.label}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{a.desc}</p>
              </div>
              <Plus
                size={13}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ color: a.color }}
              />
            </button>
          ))}
        </div>
      </div>

      {open === "application" && (
        <Modal
          title="New Application"
          icon={<Briefcase size={15} />}
          onClose={close}
          onSubmit={handleApp}
          loading={loading}
        >
          <Input label="Company *" name="company" placeholder="Acme Corp" required />
          <Input label="Role *" name="role" placeholder="Senior Engineer" required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" name="status" defaultValue="Applied">
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Input
              label="Applied Date"
              name="appliedDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <Input label="Salary (optional)" name="salary" placeholder="$150k – $180k" />
          <Input label="Job URL (optional)" name="jobUrl" type="url" placeholder="https://…" />
        </Modal>
      )}

      {open === "todo" && (
        <Modal
          title="New Todo"
          icon={<CheckSquare size={15} />}
          onClose={close}
          onSubmit={handleTodo}
          loading={loading}
        >
          <Input
            label="Title *"
            name="title"
            placeholder="Research target companies"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" name="priority" defaultValue="Medium">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
            <Input label="Due Date (optional)" name="dueDate" type="date" />
          </div>
          <Input
            label="Category (optional)"
            name="category"
            placeholder="Research, Interview Prep…"
          />
        </Modal>
      )}

      {open === "topic" && (
        <Modal
          title="New Prep Topic"
          icon={<BookOpen size={15} />}
          onClose={close}
          onSubmit={handleTopic}
          loading={loading}
        >
          <Input
            label="Title *"
            name="title"
            placeholder="System Design Fundamentals"
            required
          />
          <Input
            label="Category *"
            name="category"
            placeholder="System Design, DSA, Behavioral…"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" name="priority" defaultValue="Medium">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
            <Select label="Status" name="status" defaultValue="NotStarted">
              {TOPIC_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        </Modal>
      )}
    </>
  );
}
