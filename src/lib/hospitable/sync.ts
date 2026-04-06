import { prisma } from "@/lib/prisma";
import { HospitableClient } from "./client";
import type { HospitableReservation } from "./types";

const CHANNEL_MAP: Record<string, string> = {
  airbnb: "AIRBNB",
  vrbo: "VRBO",
  homeaway: "VRBO",
  "booking.com": "OTHER",
  direct: "DIRECT",
  misterbnb: "MISTERBNB",
};

function mapChannel(platform: string): string {
  return CHANNEL_MAP[platform.toLowerCase()] || "OTHER";
}

function mapStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "accepted":
      return "CONFIRMED";
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "completed":
    case "checked_out":
      return "COMPLETED";
    case "pending":
    case "inquiry":
      return "PENDING";
    default:
      return "CONFIRMED";
  }
}

export async function syncReservations(options?: {
  startDate?: string;
  endDate?: string;
}) {
  const client = new HospitableClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      syncType: options?.startDate ? "incremental" : "full",
      status: "started",
    },
  });

  try {
    let created = 0;
    let updated = 0;

    // Step 1: Fetch all properties from Hospitable
    const propertiesResponse = await client.getProperties({ per_page: 100 });
    const properties = propertiesResponse.data;

    // Build a map of hospitable property UUID -> our unit ID
    const units = await prisma.unit.findMany({
      where: { hosputableListingId: { not: null } },
      select: { id: true, hosputableListingId: true },
    });

    const listingToUnitId = new Map(
      units.map((u) => [u.hosputableListingId!, u.id])
    );

    // Collect all property UUIDs (both linked and unlinked)
    const allPropertyUuids = properties.map((p: any) => p.uuid || p.id);

    // Step 2: Fetch reservations for all properties
    let page = 1;
    let lastPage = 1;

    do {
      const response = await client.getReservations({
        properties: allPropertyUuids,
        start_date: options?.startDate,
        end_date: options?.endDate,
        include: "financials,guest",
        page,
        per_page: 50,
      });

      lastPage = response.meta.last_page;

      for (const reservation of response.data) {
        // Find matching unit
        const unitId =
          listingToUnitId.get(reservation.property_uuid) ||
          listingToUnitId.get(reservation.listing_uuid);

        if (!unitId) continue; // Skip if no matching unit

        const bookingData = {
          hosputableId: reservation.uuid,
          unitId,
          guestName: reservation.guest_name || null,
          guestEmail: reservation.guest_email || null,
          guestPhone: reservation.guest_phone || null,
          numberOfGuests:
            (reservation.adults || 0) +
            (reservation.children || 0) +
            (reservation.infants || 0),
          checkIn: new Date(reservation.check_in),
          checkOut: new Date(reservation.check_out),
          bookedAt: reservation.booking_date
            ? new Date(reservation.booking_date)
            : null,
          source: mapChannel(reservation.platform) as any,
          channelConfirmation: reservation.booking_code || null,
          status: mapStatus(reservation.status) as any,
          currency: reservation.financials?.currency || "USD",
          baseAmount: reservation.financials?.accommodation_total || 0,
          cleaningFee: reservation.financials?.cleaning_fee || 0,
          hostServiceFee: Math.abs(
            reservation.financials?.host_service_fee || 0
          ),
          guestServiceFee: reservation.financials?.guest_service_fee || 0,
          passThroughTax: reservation.financials?.pass_through_taxes || 0,
          remittedTax: reservation.financials?.remitted_taxes || 0,
          petFee: reservation.financials?.pet_fee || 0,
          extraGuestFee: reservation.financials?.extra_guest_fee || 0,
          securityDeposit: reservation.financials?.security_deposit || 0,
          adjustedAmount: reservation.financials?.resolution_adjustment || 0,
          payout: reservation.financials?.payout || 0,
          nightlyRates: (reservation.financials?.nightly_rates as any) || undefined,
          lastSyncedAt: new Date(),
          rawApiData: reservation as any,
        };

        const existing = await prisma.booking.findUnique({
          where: { hosputableId: reservation.uuid },
        });

        if (existing) {
          await prisma.booking.update({
            where: { hosputableId: reservation.uuid },
            data: bookingData,
          });
          updated++;
        } else {
          await prisma.booking.create({ data: bookingData });
          created++;
        }
      }

      page++;
    } while (page <= lastPage);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsCreated: created,
        recordsUpdated: updated,
        details: {
          propertiesFound: properties.length,
          linkedUnits: units.length,
          propertyUuids: allPropertyUuids,
        } as any,
      },
    });

    return { created, updated, propertiesFound: properties.length };
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
