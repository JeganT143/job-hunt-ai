export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { MetricCards } from "./components/dashboard/MetricCards";
import { StatusChart } from "./components/dashboard/StatusChart";
import { WeeklyChart } from "./components/dashboard/WeeklyChart";
import { RecentActivity } from "./components/dashboard/RecentActivity";
import { QuickAdd } from "./components/dashboard/QuickAdd";

function buildWeeklyData(apps: { createdAt: Date }[]) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = apps.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= day && d < next;
    }).length;
    return {
      day: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      shortDay: day.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    };
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  console.log("[dashboard] starting DB queries");
  let totalApps: number,
    activeInterviews: number,
    prepTopics: { status: string }[],
    openTodos: number,
    allApps: { status: string }[],
    recentApps: { id: string; company: string; role: string; status: string; createdAt: Date }[],
    recentTodos: { id: string; title: string; done: boolean; priority: string; dueDate: Date | null; createdAt: Date }[],
    weeklyApps: { createdAt: Date }[];

  try {
    [
      totalApps,
      activeInterviews,
      prepTopics,
      openTodos,
      allApps,
      recentApps,
      recentTodos,
      weeklyApps,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.interview.count({ where: { outcome: "Pending" } }),
      prisma.prepTopic.findMany({ select: { status: true } }),
      prisma.todo.count({ where: { done: false } }),
      prisma.application.findMany({ select: { status: true } }),
      prisma.application.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, company: true, role: true, status: true, createdAt: true },
      }),
      prisma.todo.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, done: true, priority: true, dueDate: true, createdAt: true },
      }),
      prisma.application.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);
    console.log("[dashboard] DB queries ok, totalApps:", totalApps);
  } catch (err) {
    console.error("[dashboard] DB query FAILED:", err);
    throw err;
  }

  const prepDone = prepTopics.filter((t) => t.status === "Done").length;
  const prepTotal = prepTopics.length;
  const prepPercent = prepTotal > 0 ? Math.round((prepDone / prepTotal) * 100) : 0;

  const statusMap: Record<string, number> = {};
  for (const app of allApps) {
    statusMap[app.status] = (statusMap[app.status] ?? 0) + 1;
  }
  const statusData = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
  const weeklyData = buildWeeklyData(weeklyApps);

  const serializedApps = recentApps.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));
  const serializedTodos = recentTodos.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-full">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── Page heading ───────────────────────────── */}
        <div className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1">
            {dateLabel}
          </p>
          <h1 className="font-display text-4xl text-[var(--text-primary)] leading-tight tracking-tight">
            {getGreeting()}.
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            Here&apos;s where your job search stands today.
          </p>
        </div>

        {/* ── Metric cards ───────────────────────────── */}
        <MetricCards
          totalApps={totalApps}
          activeInterviews={activeInterviews}
          prepPercent={prepPercent}
          prepDone={prepDone}
          prepTotal={prepTotal}
          openTodos={openTodos}
        />

        {/* ── Charts row ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up delay-150">
          <div className="lg:col-span-2">
            <StatusChart data={statusData} total={totalApps} />
          </div>
          <div className="lg:col-span-3">
            <WeeklyChart data={weeklyData} />
          </div>
        </div>

        {/* ── Bottom row ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 animate-fade-up delay-300">
          <div className="lg:col-span-2">
            <RecentActivity recentApps={serializedApps} recentTodos={serializedTodos} />
          </div>
          <div className="lg:col-span-1">
            <QuickAdd />
          </div>
        </div>
      </main>
    </div>
  );
}
