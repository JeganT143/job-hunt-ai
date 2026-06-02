"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WeeklyDataPoint {
  day: string;
  shortDay: string;
  count: number;
}

interface Props {
  data: WeeklyDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
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
      <p style={{ color: "var(--text-secondary)" }} className="font-medium">
        {label}
      </p>
      <p style={{ color: "var(--accent)" }} className="font-semibold">
        {payload[0].value} application{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function WeeklyChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="card p-6 h-[320px] animate-pulse"
        style={{ background: "var(--bg-surface)" }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const axisColor = isDark ? "#42425a" : "#8a8aaa";
  const accentColor = isDark ? "#22d3ee" : "#0891b2";
  const accentDim = isDark ? "rgba(34,211,238,0.15)" : "rgba(8,145,178,0.12)";
  const emptyColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Weekly Activity
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Applications added in the last 7 days
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: accentColor, opacity: 0.8 }}
          />
          <span className="text-xs text-[var(--text-muted)]">Applications</span>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="0"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="shortDay"
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: accentDim, radius: 8 } as React.SVGProps<SVGRectElement>}
            />
            <Bar dataKey="count" radius={[6, 6, 2, 2]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.count > 0
                      ? entry.count === maxCount
                        ? accentColor
                        : isDark
                        ? "rgba(34,211,238,0.55)"
                        : "rgba(8,145,178,0.5)"
                      : emptyColor
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
