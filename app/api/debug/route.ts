import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "(not set)";
  const token = process.env.DATABASE_AUTH_TOKEN;

  return NextResponse.json({
    DATABASE_URL: url.length > 20 ? url.slice(0, 30) + "..." : url,
    DATABASE_AUTH_TOKEN: token ? `set (${token.length} chars)` : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    cwd: process.cwd(),
  });
}
