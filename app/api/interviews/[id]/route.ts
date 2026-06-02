import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: { select: { company: true, role: true } } },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(interview);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch interview" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { round, type, scheduledAt, outcome, notes } = body;

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        ...(round !== undefined && { round: Number(round) }),
        ...(type !== undefined && { type }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(outcome !== undefined && { outcome }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(interview);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.interview.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete interview" },
      { status: 500 }
    );
  }
}
