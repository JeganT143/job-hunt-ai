export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ApplicationsClient } from "./ApplicationsClient";
import type { Application } from "./types";

export default async function ApplicationsPage() {
  const raw = await prisma.application.findMany({
    include: {
      interviews: { orderBy: { round: "asc" } },
      contacts: true,
    },
    orderBy: { appliedDate: "desc" },
  });

  const apps: Application[] = raw.map((a) => ({
    ...a,
    appliedDate: a.appliedDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    interviews: a.interviews.map((i) => ({
      ...i,
      scheduledAt: i.scheduledAt.toISOString(),
    })),
  }));

  return <ApplicationsClient initialApps={apps} />;
}
