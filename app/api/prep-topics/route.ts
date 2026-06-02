import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const topics = await prisma.prepTopic.findMany({
      where: {
        ...(category && { category: { contains: category } }),
        ...(status && { status }),
        ...(priority && { priority }),
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(topics);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch prep topics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, status, priority, notes, resources } = body;

    if (!category || !title) {
      return NextResponse.json(
        { error: "category and title are required" },
        { status: 400 }
      );
    }

    const topic = await prisma.prepTopic.create({
      data: {
        category,
        title,
        status: status ?? "NotStarted",
        priority: priority ?? "Medium",
        notes: notes ?? null,
        resources: resources ?? null,
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create prep topic" },
      { status: 500 }
    );
  }
}
