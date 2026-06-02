import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL ?? "(not set)";
  const token = process.env.DATABASE_AUTH_TOKEN;

  let processedUrl = rawUrl;
  if (processedUrl.startsWith("libsql://")) {
    processedUrl = processedUrl.replace("libsql://", "https://");
  }

  let dbTest: string;
  let tables: string[] = [];
  let todoCount: number | string = "not tested";
  try {
    const result = await prisma.$queryRawUnsafe<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    tables = result.map((r) => r.name);
    dbTest = "raw ok";
  } catch (err: unknown) {
    dbTest = err instanceof Error ? err.message : String(err);
  }

  try {
    todoCount = await prisma.todo.count();
  } catch (err: unknown) {
    todoCount = "FAIL: " + (err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({
    env_DATABASE_URL: rawUrl.slice(0, 40) + (rawUrl.length > 40 ? "..." : ""),
    processed_url: processedUrl.slice(0, 40) + (processedUrl.length > 40 ? "..." : ""),
    DATABASE_AUTH_TOKEN: token ? `set (${token.length} chars)` : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    cwd: process.cwd(),
    raw_query: dbTest,
    tables,
    model_todo_count: todoCount,
  });
}
