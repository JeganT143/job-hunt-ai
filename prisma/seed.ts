import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbUrl =
  process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`;
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.todo.deleteMany();
  await prisma.prepTopic.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.application.deleteMany();

  // 3 sample applications
  const stripe = await prisma.application.create({
    data: {
      company: "Stripe",
      role: "Senior Software Engineer",
      status: "Interview",
      appliedDate: new Date("2026-05-20"),
      salary: "$180,000 – $220,000",
      jobUrl: "https://stripe.com/jobs",
      notes: "Referred by a friend on the payments team. Strong culture fit.",
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: stripe.id,
      round: 1,
      type: "Phone Screen",
      scheduledAt: new Date("2026-05-27T14:00:00Z"),
      outcome: "Passed",
      notes: "Discussed distributed systems and Stripe's infra stack.",
    },
  });

  await prisma.contact.create({
    data: {
      applicationId: stripe.id,
      name: "Alex Chen",
      role: "Engineering Manager",
      email: "alex.chen@stripe.com",
      linkedIn: "https://linkedin.com/in/alexchen",
      notes: "Referred me. Very responsive.",
    },
  });

  await prisma.application.create({
    data: {
      company: "Vercel",
      role: "Staff Engineer – Developer Experience",
      status: "Applied",
      appliedDate: new Date("2026-05-28"),
      salary: "$200,000+",
      jobUrl: "https://vercel.com/careers",
      notes: "Dream role. Focus on open-source and DX tools.",
    },
  });

  await prisma.application.create({
    data: {
      company: "Linear",
      role: "Full-Stack Engineer",
      status: "Offer",
      appliedDate: new Date("2026-05-10"),
      salary: "$160,000 – $190,000",
      jobUrl: "https://linear.app/careers",
      notes: "Great product, small tight-knit team, exciting roadmap.",
    },
  });

  // 5 prep topics
  await prisma.prepTopic.createMany({
    data: [
      {
        category: "Algorithms",
        title: "Dynamic Programming Patterns",
        status: "InProgress",
        priority: "High",
        notes: "Focus on memoization and tabulation. Nail the recurrence relation first.",
        resources: "Neetcode DP playlist, LC Blind 75",
      },
      {
        category: "System Design",
        title: "Design a URL Shortener",
        status: "Done",
        priority: "High",
        notes: "Covered consistent hashing, Redis caching, read replicas, and analytics.",
        resources: "System Design Primer, Grokking SDI",
      },
      {
        category: "Algorithms",
        title: "Graph Traversal (BFS / DFS)",
        status: "NotStarted",
        priority: "Medium",
        notes: null,
        resources: "LeetCode graph tag, Neetcode graphs section",
      },
      {
        category: "Behavioral",
        title: "STAR Stories – Leadership & Conflict",
        status: "InProgress",
        priority: "High",
        notes: "Prep 5 stories covering ownership, conflict resolution, and measurable impact.",
        resources: null,
      },
      {
        category: "System Design",
        title: "Real-Time Chat System",
        status: "NotStarted",
        priority: "Medium",
        notes: "WebSockets vs SSE, message queues, fan-out, presence tracking.",
        resources: "ByteByteGo newsletter, High Scalability blog",
      },
    ],
  });

  // 5 todos
  await prisma.todo.createMany({
    data: [
      {
        title: "Follow up with Stripe recruiter",
        description: "Send a thank-you note referencing the phone screen discussion.",
        done: false,
        dueDate: new Date("2026-06-04"),
        priority: "High",
        category: "Outreach",
      },
      {
        title: "Complete Vercel take-home project",
        description: "Build a small CLI tool demonstrating DX improvements.",
        done: false,
        dueDate: new Date("2026-06-07"),
        priority: "High",
        category: "Applications",
      },
      {
        title: "Review Linear offer package",
        description: "Compare equity, base, and benefits against other active pipelines.",
        done: false,
        dueDate: new Date("2026-06-05"),
        priority: "High",
        category: "Decisions",
      },
      {
        title: "Solve 3 DP problems on LeetCode",
        description: "Focus on house robber variants and 0/1 knapsack.",
        done: true,
        priority: "Medium",
        category: "Prep",
      },
      {
        title: "Add job-hunt-ai to portfolio site",
        description: "Write a short project write-up and update the projects section.",
        done: false,
        dueDate: new Date("2026-06-10"),
        priority: "Low",
        category: "Portfolio",
      },
    ],
  });

  console.log("Seed complete: 3 applications, 5 prep topics, 5 todos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
