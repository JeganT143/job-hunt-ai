"use client";
import { Briefcase, CalendarCheck, BookOpen, CheckSquare } from "lucide-react";

interface Props {
  totalApps: number;
  activeInterviews: number;
  prepPercent: number;
  prepDone: number;
  prepTotal: number;
  openTodos: number;
}

const cards = (p: Props) => [
  {
    label: "Applications",
    value: p.totalApps.toString(),
    subtext: "total tracked",
    icon: Briefcase,
    topBar:      "#22d3ee",
    iconColor:   "var(--accent)",
    iconBg:      "var(--accent-dim)",
    iconBorder:  "var(--accent-border)",
  },
  {
    label: "Interviews",
    value: p.activeInterviews.toString(),
    subtext: "awaiting outcome",
    icon: CalendarCheck,
    topBar:      "#60a5fa",
    iconColor:   "#60a5fa",
    iconBg:      "rgba(96,165,250,0.09)",
    iconBorder:  "rgba(96,165,250,0.22)",
  },
  {
    label: "Prep Progress",
    value: `${p.prepPercent}%`,
    subtext: `${p.prepDone} of ${p.prepTotal} topics`,
    icon: BookOpen,
    topBar:      "#34d399",
    iconColor:   "#34d399",
    iconBg:      "rgba(52,211,153,0.09)",
    iconBorder:  "rgba(52,211,153,0.22)",
    progress:    p.prepPercent,
    progressBar: "#34d399",
  },
  {
    label: "Open Todos",
    value: p.openTodos.toString(),
    subtext: "remaining tasks",
    icon: CheckSquare,
    topBar:      "#fbbf24",
    iconColor:   "#fbbf24",
    iconBg:      "rgba(251,191,36,0.09)",
    iconBorder:  "rgba(251,191,36,0.22)",
  },
] as const;

export function MetricCards(props: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards(props).map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/30 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Accent top line */}
            <div
              className="h-[2px] w-full opacity-75"
              style={{ background: card.topBar }}
            />

            <div className="p-5 pt-4">
              {/* Icon */}
              <div
                className="inline-flex p-2 rounded-xl mb-4"
                style={{
                  background: card.iconBg,
                  border: `1px solid ${card.iconBorder}`,
                }}
              >
                <Icon size={16} style={{ color: card.iconColor }} />
              </div>

              {/* Value */}
              <p
                className="font-display text-[2.1rem] leading-none text-[var(--text-primary)] tracking-tight"
              >
                {card.value}
              </p>

              {/* Label */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-2.5">
                {card.label}
              </p>

              {/* Subtext */}
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{card.subtext}</p>

              {/* Progress bar */}
              {"progress" in card && card.progress !== undefined && (
                <div
                  className="mt-4 h-[2px] w-full rounded-full overflow-hidden"
                  style={{ background: "var(--border-strong)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${card.progress}%`,
                      background: "progressBar" in card ? card.progressBar : "#34d399",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
