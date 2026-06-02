"use client";

import {
  useState, useMemo, useRef, useCallback, useEffect, KeyboardEvent,
} from "react";
import {
  Plus, Check, Trash2, ChevronDown, ChevronRight, LayoutList,
  CalendarDays, Circle, CheckCircle2, AlertCircle, Clock,
  Calendar, Inbox, Filter, ListChecks, Flame,
} from "lucide-react";
import {
  groupTodos, formatDueDate, PRIORITY_META, PRIORITY_ORDER,
  type Todo, type TodoGroups,
} from "./types";
import { WeeklyCalendar } from "./WeeklyCalendar";

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
        checked
          ? "bg-emerald-500 border-emerald-500"
          : "border-slate-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500"
      }`}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
    >
      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
    </button>
  );
}

// ─── Todo row ─────────────────────────────────────────────────────────────────
export function TodoItem({
  todo,
  onToggle,
  onDelete,
  compact = false,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const priMeta = PRIORITY_META[todo.priority] ?? PRIORITY_META.Medium;
  const due = todo.dueDate ? formatDueDate(todo.dueDate) : null;

  if (compact) {
    return (
      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 group hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors">
        <Checkbox checked={todo.done} onChange={() => onToggle(todo.id)} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-snug ${todo.done ? "line-through text-slate-400 dark:text-slate-600" : "text-slate-800 dark:text-slate-200"}`}>
            {todo.title}
          </p>
          {due && (
            <p className={`text-[10px] mt-0.5 ${due.overdue ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}>
              {due.label}
            </p>
          )}
        </div>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${priMeta.dot}`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
      <Checkbox checked={todo.done} onChange={() => onToggle(todo.id)} />

      <span className={`flex-1 min-w-0 text-sm transition-colors ${
        todo.done
          ? "line-through text-slate-400 dark:text-slate-600"
          : "text-slate-900 dark:text-slate-100"
      }`}>
        {todo.title}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {todo.priority && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${priMeta.badge} ${priMeta.ring}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priMeta.dot}`} />
            {todo.priority}
          </span>
        )}

        {todo.category && (
          <span className="hidden md:inline-flex text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {todo.category}
          </span>
        )}

        {due && (
          <span className={`text-xs flex items-center gap-1 font-medium ${
            due.overdue
              ? "text-rose-500 dark:text-rose-400"
              : "text-slate-400 dark:text-slate-500"
          }`}>
            {due.overdue && <AlertCircle size={11} />}
            {due.label}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          aria-label="Delete todo"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Group section ─────────────────────────────────────────────────────────────
function TodoGroup({
  label, count, icon, accent, todos, onToggle, onDelete,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  accent: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <span className={`flex-shrink-0 ${accent}`}>{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>{label}</span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
          {count}
        </span>
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ─── Quick-add bar ─────────────────────────────────────────────────────────────
function QuickAdd({
  categories,
  onAdd,
}: {
  categories: string[];
  onAdd: (title: string, priority: string, category: string, dueDate: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const t = title.trim();
    if (!t) return;
    setAdding(true);
    await onAdd(t, priority, category, dueDate);
    setTitle("");
    setCategory("");
    setDueDate("");
    setAdding(false);
    inputRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="card px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500 transition-all">
      <div className={`w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0 transition-colors ${
        title.trim() ? "border-violet-400 dark:border-violet-500" : ""
      }`}>
        {adding ? (
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
        ) : (
          title.trim() ? <span className="w-2 h-2 bg-violet-400 rounded-full" /> : null
        )}
      </div>

      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Add a todo… press Enter to save"
        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
      />

      {/* Priority mini-select */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="text-xs bg-transparent text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        aria-label="Priority"
      >
        <option value="High">🔴 High</option>
        <option value="Medium">🟡 Medium</option>
        <option value="Low">⚪ Low</option>
      </select>

      {/* Category */}
      <input
        list="category-options"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        className="hidden sm:block w-24 text-xs bg-transparent text-slate-500 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:text-slate-700 dark:focus:text-slate-300 transition-colors"
      />
      <datalist id="category-options">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      {/* Due date */}
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="hidden sm:block text-xs bg-transparent text-slate-400 dark:text-slate-500 focus:outline-none focus:text-slate-700 dark:focus:text-slate-300 cursor-pointer transition-colors"
        aria-label="Due date"
      />

      <button
        onClick={submit}
        disabled={!title.trim() || adding}
        className="flex-shrink-0 p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-30 text-white transition-all disabled:cursor-not-allowed"
        aria-label="Add todo"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function TodosClient({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [catFilter, setCatFilter] = useState("");
  const [priFilter, setPriFilter] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const filtered = useMemo(() => {
    return todos.filter(
      (t) => (!catFilter || t.category === catFilter) && (!priFilter || t.priority === priFilter)
    );
  }, [todos, catFilter, priFilter]);

  const groups: TodoGroups = useMemo(() => groupTodos(filtered), [filtered]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const t of todos) if (t.category) s.add(t.category);
    return Array.from(s).sort();
  }, [todos]);

  const hasActive = groups.activeCount > 0;
  const hasCompleted = groups.completed.length > 0;

  // ── Mutations ──
  const addTodo = useCallback(async (
    title: string,
    priority: string,
    category: string,
    dueDate: string
  ) => {
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority,
          category: category.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      if (!res.ok) return;
      const created = await res.json();
      setTodos((prev) => [{
        ...created,
        dueDate: created.dueDate ?? null,
        createdAt: created.createdAt,
      }, ...prev]);
    } catch { /* silent */ }
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }),
    });
  }, [todos]);

  const deleteTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }, []);

  const markAllDone = useCallback(async () => {
    const active = todos.filter((t) => !t.done);
    if (!active.length) return;
    setTodos((prev) => prev.map((t) => ({ ...t, done: true })));
    await Promise.all(
      active.map((t) =>
        fetch(`/api/todos/${t.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: true }),
        })
      )
    );
  }, [todos]);

  const deleteCompleted = useCallback(async () => {
    const done = todos.filter((t) => t.done);
    if (!done.length) return;
    if (!confirm(`Delete ${done.length} completed todo${done.length !== 1 ? "s" : ""}?`)) return;
    setTodos((prev) => prev.filter((t) => !t.done));
    await Promise.all(done.map((t) => fetch(`/api/todos/${t.id}`, { method: "DELETE" })));
  }, [todos]);

  const totalActive = todos.filter((t) => !t.done).length;
  const totalDone = todos.filter((t) => t.done).length;

  return (
    <div className="min-h-full">
      {/* Page header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm">Todos</h1>
            <span className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-400">
                {totalActive} open
              </span>
              {totalDone > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 font-medium text-emerald-700 dark:text-emerald-400">
                  {totalDone} done
                </span>
              )}
            </span>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "list"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <LayoutList size={13} /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "calendar"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <CalendarDays size={13} /> Calendar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* Quick-add */}
        <QuickAdd categories={categories} onAdd={addTodo} />

        {/* Filters + bulk actions row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
            <Filter size={12} />
          </div>

          {/* Priority chips */}
          <div className="flex gap-1.5">
            {["High", "Medium", "Low"].map((p) => {
              const m = PRIORITY_META[p];
              return (
                <button
                  key={p}
                  onClick={() => setPriFilter(priFilter === p ? "" : p)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    priFilter === p ? `${m.badge} ring-1 ${m.ring}` : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                  {p}
                </button>
              );
            })}
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(catFilter === c ? "" : c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      catFilter === c
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/50"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bulk actions */}
          {hasActive && (
            <button
              onClick={markAllDone}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50"
            >
              <ListChecks size={13} /> Complete all
            </button>
          )}
          {hasCompleted && (
            <button
              onClick={deleteCompleted}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50"
            >
              <Trash2 size={13} /> Delete completed
            </button>
          )}
        </div>

        {/* Views */}
        {view === "list" ? (
          <ListView
            groups={groups}
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ) : (
          <WeeklyCalendar
            todos={filtered}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onAdd={addTodo}
          />
        )}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
function ListView({
  groups, showCompleted, setShowCompleted, onToggle, onDelete,
}: {
  groups: TodoGroups;
  showCompleted: boolean;
  setShowCompleted: (v: boolean) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const empty = groups.activeCount === 0 && groups.completed.length === 0;

  if (empty) {
    return (
      <div className="card p-16 text-center">
        <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-600">
          <CheckCircle2 size={36} className="opacity-50" />
          <p className="text-sm font-medium">All clear! Add something above.</p>
        </div>
      </div>
    );
  }

  const allDone = groups.activeCount === 0 && groups.completed.length > 0;

  if (allDone) {
    return (
      <>
        <div className="card p-8 text-center mb-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">🎉</span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All done!</p>
            <p className="text-xs text-slate-400">Nothing left on your list.</p>
          </div>
        </div>
        <CompletedSection groups={groups} showCompleted={showCompleted} setShowCompleted={setShowCompleted} onToggle={onToggle} onDelete={onDelete} />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card px-2 py-2 space-y-3">
        <TodoGroup
          label="Overdue"
          count={groups.overdue.length}
          icon={<Flame size={13} />}
          accent="text-rose-600 dark:text-rose-400"
          todos={groups.overdue}
          onToggle={onToggle}
          onDelete={onDelete}
        />
        <TodoGroup
          label="Today"
          count={groups.today.length}
          icon={<Circle size={13} />}
          accent="text-amber-600 dark:text-amber-400"
          todos={groups.today}
          onToggle={onToggle}
          onDelete={onDelete}
        />
        <TodoGroup
          label="This Week"
          count={groups.thisWeek.length}
          icon={<Clock size={13} />}
          accent="text-violet-600 dark:text-violet-400"
          todos={groups.thisWeek}
          onToggle={onToggle}
          onDelete={onDelete}
        />
        <TodoGroup
          label="Upcoming"
          count={groups.upcoming.length}
          icon={<Calendar size={13} />}
          accent="text-sky-600 dark:text-sky-400"
          todos={groups.upcoming}
          onToggle={onToggle}
          onDelete={onDelete}
        />
        <TodoGroup
          label="No Date"
          count={groups.noDate.length}
          icon={<Inbox size={13} />}
          accent="text-slate-500 dark:text-slate-400"
          todos={groups.noDate}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </div>

      <CompletedSection
        groups={groups}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </div>
  );
}

function CompletedSection({
  groups, showCompleted, setShowCompleted, onToggle, onDelete,
}: {
  groups: TodoGroups;
  showCompleted: boolean;
  setShowCompleted: (v: boolean) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (groups.completed.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setShowCompleted(!showCompleted)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Completed
        </span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
          {groups.completed.length}
        </span>
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        {showCompleted
          ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
          : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
      </button>

      {showCompleted && (
        <div className="px-2 pb-2 space-y-0.5 border-t border-slate-100 dark:border-slate-800 pt-2">
          {groups.completed.map((t) => (
            <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
