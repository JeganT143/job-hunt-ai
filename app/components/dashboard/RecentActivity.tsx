"use client";
import { useState } from "react";
import { Briefcase, CheckSquare, Clock, AlertCircle } from "lucide-react";

const STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  Applied:   { color: "#22d3ee", bg: "rgba(34,211,238,0.09)",  border: "rgba(34,211,238,0.2)"  },
  Screening: { color: "#fbbf24", bg: "rgba(251,191,36,0.09)",  border: "rgba(251,191,36,0.2)"  },
  Interview: { color: "#a78bfa", bg: "rgba(167,139,250,0.09)", border: "rgba(167,139,250,0.2)" },
  Offer:     { color: "#34d399", bg: "rgba(52,211,153,0.09)",  border: "rgba(52,211,153,0.2)"  },
  Rejected:  { color: "#f87171", bg: "rgba(248,113,113,0.09)", border: "rgba(248,113,113,0.2)" },
  Withdrawn: { color: "#64748b", bg: "rgba(100,116,139,0.09)", border: "rgba(100,116,139,0.2)" },
};

const PRIORITY_COLOR: Record<string, string> = {
  High:   "#f87171",
  Medium: "#fbbf24",
  Low:    "#64748b",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface RecentApp {
  id: string;
  company: string;
  role: string;
  status: string;
  createdAt: string;
}

interface RecentTodo {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueDate: string | null;
  createdAt: string;
}

interface Props {
  recentApps: RecentApp[];
  recentTodos: RecentTodo[];
}

type Tab = "applications" | "todos";

function CompanyAvatar({ company }: { company: string }) {
  const initials = company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
      style={{
        background: "var(--accent-dim)",
        border: "1px solid var(--accent-border)",
        color: "var(--accent)",
      }}
    >
      {initials}
    </div>
  );
}

export function RecentActivity({ recentApps, recentTodos }: Props) {
  const [tab, setTab] = useState<Tab>("applications");

  return (
    <div className="card p-6 flex flex-col min-h-[400px]">
      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Recent Activity
        </h3>
        <div
          className="flex gap-0.5 p-0.5 rounded-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          {(["applications", "todos"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                tab === t
                  ? "shadow-sm text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
              style={
                tab === t
                  ? { background: "var(--bg-surface)", border: "1px solid var(--border)" }
                  : {}
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Applications list */}
      {tab === "applications" ? (
        <div className="space-y-1 flex-1">
          {recentApps.length === 0 ? (
            <EmptyState icon={<Briefcase size={20} />} text="No applications yet" />
          ) : (
            recentApps.map((app) => {
              const meta = STATUS_META[app.status] ?? STATUS_META.Withdrawn;
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  <CompanyAvatar company={app.company} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {app.role}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {app.company}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-lg font-medium"
                      style={{
                        color: meta.color,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      {app.status}
                    </span>
                    <span
                      className="text-[11px] flex items-center gap-1 min-w-[46px] justify-end"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Clock size={9} />
                      {timeAgo(app.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Todos list */
        <div className="space-y-1 flex-1">
          {recentTodos.length === 0 ? (
            <EmptyState icon={<CheckSquare size={20} />} text="No todos yet" />
          ) : (
            recentTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "";
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: todo.done
                      ? "rgba(52,211,153,0.09)"
                      : "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <CheckSquare
                    size={14}
                    style={{ color: todo.done ? "#34d399" : "var(--text-muted)" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      todo.done ? "line-through" : ""
                    }`}
                    style={{
                      color: todo.done ? "var(--text-muted)" : "var(--text-primary)",
                    }}
                  >
                    {todo.title}
                  </p>
                  {todo.dueDate && (
                    <p
                      className="text-xs flex items-center gap-1 mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <AlertCircle size={9} />
                      Due{" "}
                      {new Date(todo.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: PRIORITY_COLOR[todo.priority] ?? "#64748b" }}
                  />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(todo.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center flex-1 py-10 gap-2"
      style={{ color: "var(--text-muted)" }}
    >
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
}
