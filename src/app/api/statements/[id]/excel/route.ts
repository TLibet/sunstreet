import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateExcelStatement } from "@/lib/invoices/excel-template";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const statement = await prisma.statement.findUnique({
    where: { id },
    include: {
      owner: true,
      snapshots: {
        include: { unit: { select: { unitNumber: true, name: true } } },
      },
    },
  });

  if (!statement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get bookings for each unit in this statement's month
  const bookingsByUnit: Record<string, any[]> = {};
  const monthStart = new Date(statement.year, statement.month - 1, 1);
  const monthEnd = new Date(statement.year, statement.month, 0);

  for (const snapshot of statement.snapshots) {
    bookingsByUnit[snapshot.unitId] = await prisma.booking.findMany({
      where: {
        unitId: snapshot.unitId,
        checkIn: { lte: monthEnd },
        checkOut: { gt: monthStart },
        status: { not: "CANCELLED" },
      },
      orderBy: { checkIn: "asc" },
    });
  }

  const buffer = await generateExcelStatement(statement, bookingsByUnit);

  const period = new Date(statement.year, statement.month - 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );
  const filename = `${statement.owner.name} - ${period}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
