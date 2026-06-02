"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, Inbox } from "lucide-react";
import { TodoItem } from "./TodosClient";
import { PRIORITY_META, type Todo } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDays(offset: number): Date[] {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Inline add input per day ─────────────────────────────────────────────────
function DayAddInput({
  date,
  onAdd,
  onClose,
}: {
  date: Date;
  onAdd: (title: string, priority: string, category: string, dueDate: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  async function submit() {
    const t = value.trim();
    if (!t) { onClose(); return; }
    await onAdd(t, "Medium", "", date.toISOString().slice(0, 10));
    onClose();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-violet-300 dark:border-violet-700 shadow-sm">
      <div className="w-4 h-4 rounded-full border-2 border-violet-400 dark:border-violet-500 flex-shrink-0" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => setTimeout(onClose, 100)}
        placeholder="New todo…"
        className="flex-1 min-w-0 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  );
}

// ─── Day column ───────────────────────────────────────────────────────────────
function DayColumn({
  day,
  dayIndex,
  isToday,
  isPast,
  todos,
  addingHere,
  onStartAdd,
  onAdd,
  onStopAdd,
  onToggle,
  onDelete,
}: {
  day: Date;
  dayIndex: number;
  isToday: boolean;
  isPast: boolean;
  todos: Todo[];
  addingHere: boolean;
  onStartAdd: () => void;
  onAdd: (title: string, priority: string, category: string, dueDate: string) => Promise<void>;
  onStopAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const activeTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  return (
    <div
      className={`flex flex-col min-w-[130px] flex-1 max-w-[180px] rounded-2xl transition-colors ${
        isToday
          ? "bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-800/40"
          : "bg-slate-100/60 dark:bg-slate-800/30"
      }`}
    >
      {/* Day header */}
      <div className={`text-center pt-3 pb-2 border-b ${
        isToday
          ? "border-violet-200 dark:border-violet-800/50"
          : "border-slate-200 dark:border-slate-700/50"
      }`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${
          isToday
            ? "text-violet-600 dark:text-violet-400"
            : isPast
            ? "text-slate-400 dark:text-slate-600"
            : "text-slate-500 dark:text-slate-400"
        }`}>
          {DAY_NAMES[dayIndex]}
        </p>
        <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
          isToday
            ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
            : isPast
            ? "text-slate-400 dark:text-slate-600"
            : "text-slate-800 dark:text-slate-200"
        }`}>
          {day.getDate()}
        </div>
        {activeTodos.length > 0 && (
          <p className={`text-[10px] font-medium mt-1 ${
            isToday ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"
          }`}>
            {activeTodos.length} task{activeTodos.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Todos */}
      <div className="flex-1 p-1.5 space-y-1.5 min-h-[80px]">
        {activeTodos.map((t) => (
          <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} compact />
        ))}
        {doneTodos.map((t) => (
          <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} compact />
        ))}

        {/* Inline add */}
        {addingHere ? (
          <DayAddInput date={day} onAdd={onAdd} onClose={onStopAdd} />
        ) : (
          !isPast && (
            <button
              onClick={onStartAdd}
              className="w-full flex items-center justify-center gap-1 p-1.5 rounded-lg text-[11px] text-slate-400 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
            >
              <Plus size={10} /> Add
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Calendar component ───────────────────────────────────────────────────────
interface Props {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string, priority: string, category: string, dueDate: string) => Promise<void>;
}

export function WeeklyCalendar({ todos, onToggle, onDelete, onAdd }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingDay, setAddingDay] = useState<number | null>(null); // day index

  const days = getWeekDays(weekOffset);
  const today = new Date();

  const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Map todos to day columns
  function todosForDay(day: Date): Todo[] {
    return todos.filter((t) => {
      if (!t.dueDate) return false;
      return isSameDay(new Date(t.dueDate), day);
    });
  }

  const undatedActive = todos.filter((t) => !t.dueDate && !t.done);
  const undatedDone = todos.filter((t) => !t.dueDate && t.done);

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline mt-0.5"
            >
              Back to current week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day columns */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 min-w-[780px] group">
          {days.map((day, i) => {
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            return (
              <DayColumn
                key={i}
                day={day}
                dayIndex={i}
                isToday={isSameDay(day, today)}
                isPast={dayStart < todayStart}
                todos={todosForDay(day)}
                addingHere={addingDay === i}
                onStartAdd={() => setAddingDay(i)}
                onStopAdd={() => setAddingDay(null)}
                onAdd={onAdd}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>

      {/* Undated todos */}
      {(undatedActive.length > 0 || undatedDone.length > 0) && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Inbox size={13} className="text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              No Date
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              {undatedActive.length + undatedDone.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[...undatedActive, ...undatedDone].map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} compact />
            ))}
          </div>
        </div>
      )}

      {/* Mini legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {Object.entries(PRIORITY_META).map(([p, m]) => (
          <span key={p} className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span className={`w-2 h-2 rounded-full ${m.dot}`} />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
