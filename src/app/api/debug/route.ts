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
      sampleReservations: reservations.data.slice(0, 3).map((r: any) => ({
        uuid: r.uuid,
        property_uuid: r.property_uuid,
        listing_uuid: r.listing_uuid,
        platform: r.platform,
        guest_name: r.guest_name,
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
