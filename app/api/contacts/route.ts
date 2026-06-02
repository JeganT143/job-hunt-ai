import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const applicationId = searchParams.get("applicationId");
    const name = searchParams.get("name");

    const contacts = await prisma.contact.findMany({
      where: {
        ...(applicationId && { applicationId }),
        ...(name && { name: { contains: name } }),
      },
      include: {
        application: { select: { company: true, role: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(contacts);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, name, role, email, linkedIn, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        applicationId: applicationId ?? null,
        name,
        role: role ?? null,
        email: email ?? null,
        linkedIn: linkedIn ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
