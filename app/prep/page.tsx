export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PrepBoard } from "./PrepBoard";
import type { PrepTopic } from "./types";

export default async function PrepPage() {
  const raw = await prisma.prepTopic.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const topics: PrepTopic[] = raw.map((t) => ({
    ...t,
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <PrepBoard initialTopics={topics} />;
}
