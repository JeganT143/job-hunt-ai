export interface Resource {
  url: string;
  label: string;
}

export interface PrepTopic {
  id: string;
  category: string;
  title: string;
  status: string;
  priority: string;
  notes: string | null;
  resources: string | null; // JSON-encoded Resource[]
  updatedAt: string;
}

export const CATEGORIES = [
  "DSA",
  "System Design",
  "ML Concepts",
  "Behavioral",
  "LLM/AI",
  "Coding",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["Low", "Medium", "High"] as const;
export const STATUSES = ["NotStarted", "InProgress", "Done"] as const;

export const COLUMNS = [
  {
    id: "NotStarted",
    label: "Not Started",
    headerClass: "text-slate-600 dark:text-slate-400",
    dotClass: "bg-slate-400",
    bgClass: "bg-slate-100 dark:bg-slate-800/50",
    countClass: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  },
  {
    id: "InProgress",
    label: "In Progress",
    headerClass: "text-violet-600 dark:text-violet-400",
    dotClass: "bg-violet-500",
    bgClass: "bg-violet-50 dark:bg-violet-900/10",
    countClass: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  },
  {
    id: "Done",
    label: "Done",
    headerClass: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/10",
    countClass: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  },
] as const;

export const CATEGORY_META: Record<string, { badge: string; dot: string }> = {
  DSA: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  "System Design": {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  "ML Concepts": {
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    dot: "bg-pink-500",
  },
  Behavioral: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  "LLM/AI": {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  Coding: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    dot: "bg-orange-500",
  },
};

export const PRIORITY_META: Record<string, { badge: string; dot: string }> = {
  High: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
  },
  Medium: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-400",
  },
  Low: {
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    dot: "bg-slate-400",
  },
};

export function parseResources(raw: string | null | undefined): Resource[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Resource[];
  } catch {
    return [];
  }
}

export function serializeResources(resources: Resource[]): string {
  return JSON.stringify(resources.filter((r) => r.url.trim() || r.label.trim()));
}
