export interface Todo {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
  dueDate: string | null;
  priority: string;
  category: string | null;
  createdAt: string;
}

export const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export const PRIORITY_META: Record<string, { badge: string; dot: string; ring: string }> = {
  High: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    dot: "bg-rose-500",
    ring: "ring-rose-200 dark:ring-rose-800/40",
  },
  Medium: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-400",
    ring: "ring-amber-200 dark:ring-amber-800/40",
  },
  Low: {
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    dot: "bg-slate-400",
    ring: "ring-slate-200 dark:ring-slate-700",
  },
};

export interface TodoGroups {
  overdue: Todo[];
  today: Todo[];
  thisWeek: Todo[];
  upcoming: Todo[];
  noDate: Todo[];
  completed: Todo[];
  activeCount: number;
}

export function groupTodos(todos: Todo[]): TodoGroups {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const overdue: Todo[] = [], today: Todo[] = [], thisWeek: Todo[] = [],
    upcoming: Todo[] = [], noDate: Todo[] = [];
  const completed = todos.filter((t) => t.done);
  const active = todos.filter((t) => !t.done);

  for (const t of active) {
    if (!t.dueDate) { noDate.push(t); continue; }
    const d = new Date(t.dueDate);
    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (ds < todayStart) overdue.push(t);
    else if (ds < todayEnd) today.push(t);
    else if (ds < weekEnd) thisWeek.push(t);
    else upcoming.push(t);
  }

  const byPriority = (a: Todo, b: Todo) =>
    (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);

  return {
    overdue: [...overdue].sort(byPriority),
    today: [...today].sort(byPriority),
    thisWeek: [...thisWeek].sort(byPriority),
    upcoming: [...upcoming].sort(byPriority),
    noDate: [...noDate].sort(byPriority),
    completed: [...completed].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    activeCount: active.length,
  };
}

export function formatDueDate(dateStr: string): { label: string; overdue: boolean } {
  const d = new Date(dateStr);
  const today = new Date();
  const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ts = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((ds.getTime() - ts.getTime()) / 86400000);
  const overdue = diff < 0;

  let label: string;
  if (diff === 0) label = "Today";
  else if (diff === 1) label = "Tomorrow";
  else if (diff === -1) label = "Yesterday";
  else if (diff > 1 && diff < 7)
    label = d.toLocaleDateString("en-US", { weekday: "short" });
  else
    label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return { label, overdue };
}
