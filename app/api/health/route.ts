import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [applications, interviews, prepTopics, todos, contacts] =
      await Promise.all([
        prisma.application.count(),
        prisma.interview.count(),
        prisma.prepTopic.count(),
        prisma.todo.count(),
        prisma.contact.count(),
      ]);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      counts: { applications, interviews, prepTopics, todos, contacts },
    });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json(
      { status: "error", message: "Database unreachable" },
      { status: 503 }
    );
  }
}
