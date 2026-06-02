export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { Sidebar } from "./components/Sidebar";
import { prisma } from "@/lib/prisma";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Hunt AI",
  description: "Track your job search with clarity",
};

const ACTIVE_STATUSES = ["Applied", "Phone Screen", "Interview", "Offer", "Negotiating"];

async function getSidebarStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [activeApps, todosDueToday] = await Promise.all([
    prisma.application.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.todo.count({
      where: {
        done: false,
        dueDate: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  return { activeApps, todosDueToday };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const stats = await getSidebarStats();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar stats={stats} />
            <main className="flex-1 overflow-y-auto bg-[var(--bg)] lg:pt-0 pt-14">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
