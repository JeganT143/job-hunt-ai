"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  CheckSquare,
  Sparkles,
  Users,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";

const NAV = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase       },
  { href: "/prep",         label: "Preparation",  icon: BookOpen        },
  { href: "/todos",        label: "Todos",        icon: CheckSquare     },
  { href: "/ai",           label: "AI Assistant", icon: Sparkles        },
  { href: "/contacts",     label: "Contacts",     icon: Users           },
] as const;

interface Stats {
  activeApps: number;
  todosDueToday: number;
}

function ThemeCycleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-full rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />;
  }

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
        text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-black/5 dark:hover:bg-white/[0.04]"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
        ${
          active
            ? "bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-transparent"
        }`}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 ${active ? "text-[var(--accent)]" : ""}`}
      />
      <span>{label}</span>
      {label === "AI Assistant" && (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)]">
          AI
        </span>
      )}
    </Link>
  );
}

function SidebarContent({
  pathname,
  stats,
  onNavClick,
}: {
  pathname: string;
  stats: Stats;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--accent)",
            boxShadow: "0 4px 20px var(--accent-dim)",
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "var(--accent-fg)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold font-display text-[var(--text-primary)] leading-none tracking-tight">
            Job Hunt AI
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">
            Career tracker
          </p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Navigation
        </p>
        {NAV.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={href === "/" ? pathname === "/" : pathname.startsWith(href)}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* ── Quick stats ───────────────────────────────── */}
      <div
        className="mx-3 mb-3 mt-4 rounded-2xl p-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Quick Stats
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <Briefcase className="w-3 h-3 text-[var(--accent)]" />
              Active apps
            </span>
            <span className="font-display text-lg leading-none text-[var(--text-primary)]">
              {stats.activeApps}
            </span>
          </div>
          <div className="h-px" style={{ background: "var(--border)" }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <CheckSquare className="w-3 h-3 text-amber-500" />
              Due today
            </span>
            <span
              className={`font-display text-lg leading-none ${
                stats.todosDueToday > 0
                  ? "text-amber-500"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {stats.todosDueToday}
            </span>
          </div>
        </div>
      </div>

      {/* ── Theme toggle ─────────────────────────────── */}
      <div className="px-3 pb-5">
        <div className="h-px mb-3" style={{ background: "var(--border)" }} />
        <ThemeCycleButton />
      </div>
    </div>
  );
}

export function Sidebar({ stats }: { stats: Stats }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);

  useEffect(() => { close(); }, [pathname, close]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0 overflow-hidden"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <SidebarContent pathname={pathname} stats={stats} />
      </aside>

      {/* ── Mobile top bar ─────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center gap-3 px-4 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl transition-colors text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-fg)" }} />
          </div>
          <span className="font-semibold text-sm font-display text-[var(--text-primary)]">
            Job Hunt AI
          </span>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={close}
        />
      )}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="absolute top-3.5 right-3.5">
          <button
            onClick={close}
            className="p-2 rounded-xl transition-colors text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent pathname={pathname} stats={stats} onNavClick={close} />
      </div>
    </>
  );
}
