"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search, Plus, ChevronUp, ChevronDown, ChevronsUpDown,
  Building2, Trash2, Check,
} from "lucide-react";
import { ApplicationDrawer } from "./ApplicationDrawer";
import { AddApplicationModal } from "./AddApplicationModal";
import type { Application } from "./types";
import { ALL_STATUSES, STATUS_META } from "./types";

type SortField = "company" | "role" | "status" | "appliedDate";
type SortDir = "asc" | "desc";

// ─── Status badge with inline dropdown ──────────────────────────────────────
function StatusBadge({
  app,
  onChange,
}: {
  app: Application;
  onChange: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[app.status] ?? STATUS_META.Withdrawn;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 transition-opacity hover:opacity-80 ${meta.badge} ${meta.ring}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
        {app.status}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 min-w-[150px]">
          {ALL_STATUSES.map((s) => {
            const sm = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); onChange(app.id, s); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${sm.dot}`} />
                <span className={`flex-1 text-left ${s === app.status ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                  {s}
                </span>
                {s === app.status && <Check size={12} className="text-violet-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sortable column header ──────────────────────────────────────────────────
function SortTh({
  field, label, sortField, sortDir, onSort,
  className = "",
}: {
  field: SortField; label: string; sortField: SortField; sortDir: SortDir;
  onSort: (f: SortField) => void; className?: string;
}) {
  const active = sortField === field;
  return (
    <th className={`px-4 py-3 text-left ${className}`}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        {label}
        <span className="ml-0.5 opacity-60">
          {active
            ? sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
            : <ChevronsUpDown size={11} className="opacity-50" />}
        </span>
      </button>
    </th>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function ApplicationsClient({ initialApps }: { initialApps: Application[] }) {
  const [apps, setApps] = useState<Application[]>(initialApps);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("appliedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawerApp, setDrawerApp] = useState<Application | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerApp(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortDir("asc"); }
      return field;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = apps.filter((a) => {
      const matchSearch = !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result = [...result].sort((a, b) => {
      let av: string | number = a[sortField] ?? "";
      let bv: string | number = b[sortField] ?? "";
      if (sortField === "appliedDate") {
        av = new Date(av as string).getTime();
        bv = new Date(bv as string).getTime();
      }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
    return result;
  }, [apps, search, statusFilter, sortField, sortDir]);

  const statusCounts = useMemo(() =>
    apps.reduce<Record<string, number>>((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; }, {}),
  [apps]);

  async function updateStatus(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setDrawerApp((prev) => (prev?.id === id ? { ...prev, status } : prev));
    await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function deleteApp(id: string) {
    if (!confirm("Delete this application and all its data? This cannot be undone.")) return;
    setApps((prev) => prev.filter((a) => a.id !== id));
    if (drawerApp?.id === id) setDrawerApp(null);
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
  }

  function handleAdded(app: Application) {
    setApps((prev) => [app, ...prev]);
    setAddOpen(false);
  }

  function handleUpdated(app: Application) {
    setApps((prev) => prev.map((a) => (a.id === app.id ? app : a)));
    setDrawerApp(app);
  }

  return (
    <div className="min-h-full">
      {/* Page header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm">Applications</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {apps.length}
            </span>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Application</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              !statusFilter
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            All <span className="ml-1 opacity-60">{apps.length}</span>
          </button>
          {ALL_STATUSES.map((s) => {
            const m = STATUS_META[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(active ? "" : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  active ? `${m.badge} ring-1 ${m.ring}` : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${m.dot} mr-1.5 align-middle`} />
                {s}
                {statusCounts[s] ? <span className="ml-1.5 opacity-60">{statusCounts[s]}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or role…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <SortTh field="company" label="Company" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="role" label="Role" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortTh field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="appliedDate" label="Applied" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Salary</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Interviews</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                        <Building2 size={28} />
                        <p className="text-sm">
                          {apps.length === 0 ? "No applications yet — add your first one!" : "No applications match your filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setDrawerApp(app)}
                      className="hover:bg-violet-50/30 dark:hover:bg-slate-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-900/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">
                              {app.company.slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{app.company}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3.5 text-slate-500 dark:text-slate-400">{app.role}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge app={app} onChange={updateStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(app.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {app.salary ?? <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        {app.interviews.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-medium">
                            <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-bold">
                              {app.interviews.length}
                            </span>
                            {app.interviews.length === 1 ? "round" : "rounds"}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteApp(app.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filtered.length === apps.length
                  ? `${apps.length} application${apps.length !== 1 ? "s" : ""}`
                  : `${filtered.length} of ${apps.length} applications`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {drawerApp && (
        <ApplicationDrawer
          app={drawerApp}
          onClose={() => setDrawerApp(null)}
          onStatusChange={updateStatus}
          onUpdate={handleUpdated}
          onDelete={deleteApp}
        />
      )}

      {/* Add application modal */}
      {addOpen && (
        <AddApplicationModal
          onClose={() => setAddOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
