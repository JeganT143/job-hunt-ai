import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        application: { select: { company: true, role: true } },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { applicationId, name, role, email, linkedIn, notes } = body;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(applicationId !== undefined && { applicationId }),
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(email !== undefined && { email }),
        ...(linkedIn !== undefined && { linkedIn }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(contact);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.contact.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
