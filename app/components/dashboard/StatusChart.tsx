"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_META: Record<string, { color: string; label: string }> = {
  Applied:   { color: "#22d3ee", label: "Applied"   },
  Screening: { color: "#fbbf24", label: "Screening" },
  Interview: { color: "#a78bfa", label: "Interview" },
  Offer:     { color: "#34d399", label: "Offer"     },
  Rejected:  { color: "#f87171", label: "Rejected"  },
  Withdrawn: { color: "#64748b", label: "Withdrawn" },
};

interface Props {
  data: { status: string; count: number }[];
  total: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-xl"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        color: "var(--text-primary)",
      }}
    >
      <p className="font-medium">{payload[0].name}</p>
      <p style={{ color: "var(--text-secondary)" }}>
        {payload[0].value} application{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function StatusChart({ data, total }: Props) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const legendTextColor = isDark ? "#6e6e98" : "#4a4a72";

  if (!mounted) {
    return (
      <div
        className="card p-6 h-[320px] animate-pulse"
        style={{ background: "var(--bg-surface)" }}
      />
    );
  }

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Application Status
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Breakdown by current status
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">No applications yet</p>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="45%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_META[entry.status]?.color ?? "#64748b"}
                    stroke="transparent"
                  />
                ))}
              </Pie>

              {/* Center total */}
              <text
                x="50%"
                y="40%"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  fill: isDark ? "#e2e2ef" : "#0d0d1c",
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                }}
              >
                {total}
              </text>
              <text
                x="50%"
                y="51%"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{ fontSize: 11, fill: isDark ? "#42425a" : "#8a8aaa" }}
              >
                total
              </text>

              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={7}
                formatter={(value) => (
                  <span style={{ color: legendTextColor, fontSize: 12 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
