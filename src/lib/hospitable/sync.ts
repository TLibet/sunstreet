import { prisma } from "@/lib/prisma";
import { HospitableClient } from "./client";

const CHANNEL_MAP: Record<string, string> = {
  airbnb: "AIRBNB",
  vrbo: "VRBO",
  homeaway: "VRBO",
  "booking.com": "OTHER",
  direct: "DIRECT",
  misterbnb: "MISTERBNB",
};

function mapChannel(platform: string): string {
  return CHANNEL_MAP[platform?.toLowerCase()] || "OTHER";
}

function mapStatus(status: string): string {
  switch (status?.toLowerCase()) {
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

function buildGuestName(reservation: any): string | null {
  const guest = reservation.guest;
  if (!guest) return null;
  const first = guest.first_name || "";
  const last = guest.last_name || "";
  const full = `${first} ${last}`.trim();
  return full || guest.name || null;
}

// Hospitable API returns amounts in cents
function centsToDecimal(cents: number | undefined): number {
  return cents ? cents / 100 : 0;
}

function extractFinancials(reservation: any) {
  const fin = reservation.financials;
  if (!fin) return { baseAmount: 0, cleaningFee: 0, hostServiceFee: 0, passThroughTax: 0, discountAmount: 0, payout: 0, nightlyRates: undefined };

  const host = fin.host || {};
  const baseAmount = centsToDecimal(host.accommodation?.amount);

  // Cleaning fee from guest_fees
  let cleaningFee = 0;
  for (const fee of (host.guest_fees || [])) {
    if (fee.label?.toLowerCase().includes("cleaning")) {
      cleaningFee += centsToDecimal(fee.amount);
    }
  }

  // Host fees (service fees, "Paid to Vrbo", etc.)
  let hostServiceFee = 0;
  for (const fee of (host.host_fees || [])) {
    hostServiceFee += Math.abs(centsToDecimal(fee.amount));
  }

  // Pass-through taxes (host taxes)
  let passThroughTax = 0;
  for (const tax of (host.taxes || [])) {
    passThroughTax += centsToDecimal(tax.amount);
  }

  // Discounts - check both host and guest sections
  let discountAmount = 0;
  const guest = fin.guest || {};
  for (const disc of (host.discounts || [])) {
    discountAmount += Math.abs(centsToDecimal(disc.amount));
  }
  for (const disc of (guest.discounts || [])) {
    discountAmount += Math.abs(centsToDecimal(disc.amount));
  }

  // Payout/revenue
  const payout = centsToDecimal(host.revenue?.amount);

  // Nightly rates from accommodation_breakdown
  // Store original rate, and if there's a discount, also store the adjusted rate
  let nightlyRates: { date: string; rate: number; originalRate: number; discountPerNight: number }[] | undefined;
  if (host.accommodation_breakdown?.length) {
    const nightCount = host.accommodation_breakdown.length;
    const discountPerNight = nightCount > 0 ? discountAmount / nightCount : 0;

    nightlyRates = host.accommodation_breakdown.map((nb: any) => {
      const originalRate = centsToDecimal(nb.amount);
      return {
        date: nb.label,
        originalRate,
        discountPerNight: Math.round(discountPerNight * 100) / 100,
        rate: Math.round((originalRate - discountPerNight) * 100) / 100,
      };
    });
  }

  // Adjustments from API (resolution center, etc.)
  let adjustedAmount = 0;
  const apiAdjustments: { label: string; amount: number }[] = [];
  for (const adj of (host.adjustments || [])) {
    const amt = centsToDecimal(adj.amount);
    adjustedAmount += amt;
    apiAdjustments.push({ label: adj.label || "Adjustment", amount: amt });
  }

  return { baseAmount, cleaningFee, hostServiceFee, passThroughTax, discountAmount, adjustedAmount, apiAdjustments, payout, nightlyRates };
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

    // Get linked units
    const units = await prisma.unit.findMany({
      where: { hosputableListingId: { not: null } },
      select: { id: true, unitNumber: true, hosputableListingId: true },
    });

    if (units.length === 0) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "completed", completedAt: new Date(), details: { message: "No linked units" } as any },
      });
      return { created: 0, updated: 0, propertiesFound: 0 };
    }

    const listingToUnitId = new Map(
      units.map((u) => [u.hosputableListingId!, u.id])
    );

    // Fetch reservations per property (to know which unit each reservation belongs to)
    for (const unit of units) {
      let page = 1;
      let lastPage = 1;

      do {
        const response = await client.getReservations({
          properties: [unit.hosputableListingId!],
          start_date: options?.startDate,
          end_date: options?.endDate,
          include: "financials,guest",
          page,
          per_page: 50,
        });

        lastPage = response.meta.last_page;

        for (const reservation of response.data) {
          const hosputableId = reservation.id || (reservation as any).uuid;
          if (!hosputableId) continue;

          const fin = extractFinancials(reservation);
          const guests = (reservation as any).guests || {};

          const bookingData = {
            hosputableId,
            unitId: unit.id,
            guestName: buildGuestName(reservation) || null,
            guestEmail: (reservation as any).guest?.email || null,
            guestPhone: (reservation as any).guest?.phone_numbers?.[0] || (reservation as any).guest?.phone || null,
            numberOfGuests: guests.total || guests.adult_count || 0,
            checkIn: new Date((reservation as any).arrival_date || reservation.check_in),
            checkOut: new Date((reservation as any).departure_date || reservation.check_out),
            bookedAt: (reservation as any).booking_date ? new Date((reservation as any).booking_date) : null,
            source: mapChannel(reservation.platform) as any,
            channelConfirmation: (reservation as any).code || reservation.booking_code || null,
            status: mapStatus((reservation as any).status) as any,
            currency: (reservation as any).financials?.currency || "USD",
            baseAmount: fin.baseAmount,
            cleaningFee: fin.cleaningFee,
            hostServiceFee: fin.hostServiceFee,
            passThroughTax: fin.passThroughTax,
            discountAmount: fin.discountAmount,
            adjustedAmount: fin.adjustedAmount,
            payout: fin.payout,
            nightlyRates: fin.nightlyRates ? (fin.nightlyRates as any) : undefined,
            lastSyncedAt: new Date(),
            rawApiData: reservation as any,
          };

          const existing = await prisma.booking.findUnique({
            where: { hosputableId },
          });

          let bookingRecord;
          if (existing) {
            bookingRecord = await prisma.booking.update({
              where: { hosputableId },
              data: bookingData,
            });
            updated++;
          } else {
            bookingRecord = await prisma.booking.create({ data: bookingData });
            created++;
          }

          // Auto-create Adjustment records from API adjustments
          if (fin.apiAdjustments && fin.apiAdjustments.length > 0) {
            const checkInDate = new Date((reservation as any).arrival_date || reservation.check_in);
            const adjMonth = checkInDate.getMonth() + 1;
            const adjYear = checkInDate.getFullYear();

            for (const apiAdj of fin.apiAdjustments) {
              // Upsert by a deterministic ID based on booking + label
              const adjId = `api-${hosputableId}-${apiAdj.label.replace(/\s+/g, "-").toLowerCase()}`;
              await prisma.adjustment.upsert({
                where: { id: adjId },
                create: {
                  id: adjId,
                  unitId: unit.id,
                  month: adjMonth,
                  year: adjYear,
                  category: "ADJUSTED_AMOUNT",
                  description: `${apiAdj.label} (${(reservation as any).code || hosputableId})`,
                  amount: apiAdj.amount,
                  createdBy: "hospitable-sync",
                },
                update: {
                  amount: apiAdj.amount,
                  description: `${apiAdj.label} (${(reservation as any).code || hosputableId})`,
                },
              });
            }
          }
        }

        page++;
      } while (page <= lastPage);
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsCreated: created,
        recordsUpdated: updated,
      },
    });

    return { created, updated, propertiesFound: units.length };
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
