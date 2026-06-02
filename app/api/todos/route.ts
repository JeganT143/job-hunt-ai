import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const done = searchParams.get("done");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const todos = await prisma.todo.findMany({
      where: {
        ...(done !== null && { done: done === "true" }),
        ...(priority && { priority }),
        ...(category && { category: { contains: category } }),
      },
      orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(todos);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, done, dueDate, priority, category } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description ?? null,
        done: done ?? false,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority ?? "Medium",
        category: category ?? null,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}
