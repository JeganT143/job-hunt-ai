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
  const adapter = new PrismaLibSql({ url: dbUrl, authToken });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
