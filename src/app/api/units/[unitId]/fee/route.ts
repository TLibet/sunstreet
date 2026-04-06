import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateManagementFee } from "@/app/(admin)/units/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const { percentage } = await request.json();

  if (!percentage || percentage <= 0 || percentage > 100) {
    return NextResponse.json({ error: "Invalid percentage" }, { status: 400 });
  }

  await updateManagementFee(unitId, percentage, session.user.id);
  return NextResponse.json({ success: true });
}
