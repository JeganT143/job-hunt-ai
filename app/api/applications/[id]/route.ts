import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { interviews: { orderBy: { round: "asc" } }, contacts: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { company, role, status, appliedDate, salary, jobUrl, notes } = body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(company !== undefined && { company }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
        ...(appliedDate !== undefined && { appliedDate: new Date(appliedDate) }),
        ...(salary !== undefined && { salary }),
        ...(jobUrl !== undefined && { jobUrl }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(application);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.application.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
