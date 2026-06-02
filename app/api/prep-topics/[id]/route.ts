import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const topic = await prisma.prepTopic.findUnique({ where: { id } });

    if (!topic) {
      return NextResponse.json(
        { error: "Prep topic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch prep topic" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { category, title, status, priority, notes, resources } = body;

    const topic = await prisma.prepTopic.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(notes !== undefined && { notes }),
        ...(resources !== undefined && { resources }),
      },
    });

    return NextResponse.json(topic);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Prep topic not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update prep topic" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.prepTopic.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Prep topic not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete prep topic" },
      { status: 500 }
    );
  }
}
