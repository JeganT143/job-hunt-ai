import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  let dbUrl =
    process.env.DATABASE_URL ??
    `file:${path.resolve(process.cwd(), "dev.db")}`;

  // libsql:// uses WebSockets which are unreliable in serverless (Vercel/Lambda).
  // https:// is the stable alternative and is functionally identical for Turso.
  if (dbUrl.startsWith("libsql://")) {
    dbUrl = dbUrl.replace("libsql://", "https://");
  }

  const authToken = process.env.DATABASE_AUTH_TOKEN;
  console.log("[prisma] connecting to:", dbUrl.slice(0, 50));
  console.log("[prisma] authToken present:", !!authToken, "| length:", authToken?.length ?? 0);
  console.log("[prisma] cwd:", process.cwd(), "| NODE_ENV:", process.env.NODE_ENV);

  try {
    const adapter = new PrismaLibSql({ url: dbUrl, authToken });
    const client = new PrismaClient({ adapter });
    console.log("[prisma] client created ok");
    return client;
  } catch (err) {
    console.error("[prisma] FAILED to create client:", err);
    throw err;
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
