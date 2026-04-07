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
  const { cleaningFee } = await request.json();

  if (cleaningFee === undefined || cleaningFee < 0) {
    return NextResponse.json({ error: "Invalid cleaning fee" }, { status: 400 });
  }

  await prisma.unit.update({
    where: { id: unitId },
    data: { defaultCleaningFee: cleaningFee },
  });

  return NextResponse.json({ success: true });
}
