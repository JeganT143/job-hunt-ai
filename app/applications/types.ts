export type ApplicationStatus =
  | "Applied" | "Screening" | "Interview" | "Offer" | "Rejected" | "Withdrawn";

export interface Interview {
  id: string;
  applicationId: string;
  round: number;
  type: string;
  scheduledAt: string;
  outcome: string;
  notes: string | null;
}

export interface Contact {
  id: string;
  applicationId: string | null;
  name: string;
  role: string | null;
  email: string | null;
  linkedIn: string | null;
  notes: string | null;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedDate: string;
  salary: string | null;
  jobUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  interviews: Interview[];
  contacts: Contact[];
}

export const ALL_STATUSES: ApplicationStatus[] = [
  "Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn",
];

export const STATUS_META: Record<string, {
  badge: string;
  pill: string;
  dot: string;
  ring: string;
}> = {
  Applied: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pill: "bg-blue-600 text-white",
    dot: "bg-blue-500",
    ring: "ring-blue-200 dark:ring-blue-800/50",
  },
  Screening: {
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    pill: "bg-yellow-500 text-white",
    dot: "bg-yellow-500",
    ring: "ring-yellow-200 dark:ring-yellow-800/50",
  },
  Interview: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    pill: "bg-orange-500 text-white",
    dot: "bg-orange-500",
    ring: "ring-orange-200 dark:ring-orange-800/50",
  },
  Offer: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pill: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200 dark:ring-emerald-800/50",
  },
  Rejected: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    pill: "bg-red-600 text-white",
    dot: "bg-red-500",
    ring: "ring-red-200 dark:ring-red-800/50",
  },
  Withdrawn: {
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    pill: "bg-slate-500 text-white",
    dot: "bg-slate-400",
    ring: "ring-slate-200 dark:ring-slate-700",
  },
};

export const INTERVIEW_TYPES = ["Phone", "Technical", "System Design", "HR", "Final"];
export const INTERVIEW_OUTCOMES = ["Pending", "Passed", "Failed"];
