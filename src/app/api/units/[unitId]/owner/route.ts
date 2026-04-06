import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const { ownerId } = await request.json();

  if (!ownerId) {
    return NextResponse.json({ error: "Owner ID required" }, { status: 400 });
  }

  await prisma.unit.update({
    where: { id: unitId },
    data: { ownerId },
  });

  return NextResponse.json({ success: true });
}
