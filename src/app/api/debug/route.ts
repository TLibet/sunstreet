import { NextRequest, NextResponse } from "next/server";
import { HospitableClient } from "@/lib/hospitable/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const client = new HospitableClient();

    // Get our linked units
    const units = await prisma.unit.findMany({
      where: { hosputableListingId: { not: null } },
      select: { id: true, unitNumber: true, hosputableListingId: true },
    });

    const propertyUuids = units.map((u) => u.hosputableListingId!);

    // Fetch reservations for these properties
    const reservations = await client.getReservations({
      properties: propertyUuids,
      include: "financials",
      per_page: 10,
    });

    return NextResponse.json({
      linkedUnits: units,
      propertyUuidsQueried: propertyUuids,
      reservationsFound: reservations.data.length,
      reservationsMeta: reservations.meta,
      sampleReservations: reservations.data.slice(0, 2),
      allKeys: reservations.data.length > 0 ? Object.keys(reservations.data[0]) : [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
