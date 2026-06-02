import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const company = searchParams.get("company");

    const applications = await prisma.application.findMany({
      where: {
        ...(status && { status }),
        ...(company && { company: { contains: company } }),
      },
      include: { interviews: true, contacts: true },
      orderBy: { appliedDate: "desc" },
    });

    return NextResponse.json(applications);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, role, appliedDate, status, salary, jobUrl, notes } = body;

    if (!company || !role || !appliedDate) {
      return NextResponse.json(
        { error: "company, role, and appliedDate are required" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        company,
        role,
        appliedDate: new Date(appliedDate),
        status: status ?? "Applied",
        salary: salary ?? null,
        jobUrl: jobUrl ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
