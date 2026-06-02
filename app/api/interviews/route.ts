import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const applicationId = searchParams.get("applicationId");
    const type = searchParams.get("type");
    const outcome = searchParams.get("outcome");

    const interviews = await prisma.interview.findMany({
      where: {
        ...(applicationId && { applicationId }),
        ...(type && { type }),
        ...(outcome && { outcome }),
      },
      include: { application: { select: { company: true, role: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(interviews);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, round, type, scheduledAt, outcome, notes } = body;

    if (!applicationId || round === undefined || !type || !scheduledAt) {
      return NextResponse.json(
        { error: "applicationId, round, type, and scheduledAt are required" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        round: Number(round),
        type,
        scheduledAt: new Date(scheduledAt),
        outcome: outcome ?? "Pending",
        notes: notes ?? null,
      },
    });

    return NextResponse.json(interview, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
