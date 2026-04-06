import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { HospitableClient } from "@/lib/hospitable/client";
import { prisma } from "@/lib/prisma";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.HOSPITABLE_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return signature === expected;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hospitable-signature") || "";

  // Verify signature if webhook secret is configured
  if (process.env.HOSPITABLE_WEBHOOK_SECRET) {
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const event = JSON.parse(payload);
    const eventType = event.event || event.type;

    if (
      eventType === "reservation.created" ||
      eventType === "reservation.updated"
    ) {
      const reservationData = event.data;
      if (!reservationData?.uuid) {
        return NextResponse.json({ error: "No reservation UUID" }, { status: 400 });
      }

      // Try to fetch full data from Hospitable API, fall back to webhook payload
      let reservation = reservationData;
      if (process.env.HOSPITABLE_PAT) {
        try {
          const client = new HospitableClient();
          const { data } = await client.getReservation(
            reservationData.uuid,
            "financials,guest"
          );
          reservation = data;
        } catch {
          // API fetch failed, use webhook payload data
        }
      }

      // Find matching unit
      const unit = await prisma.unit.findFirst({
        where: {
          OR: [
            { hosputableListingId: reservation.property_uuid },
            { hosputableListingId: reservation.listing_uuid },
          ].filter((c) => Object.values(c)[0] != null),
        },
      });

      if (!unit) {
        return NextResponse.json({ received: true, matched: false });
      }

      await prisma.booking.upsert({
        where: { hosputableId: reservation.uuid },
        create: {
          hosputableId: reservation.uuid,
          unitId: unit.id,
          guestName: reservation.guest_name || null,
          guestEmail: reservation.guest_email || null,
          guestPhone: reservation.guest_phone || null,
          numberOfGuests: (reservation.adults || 0) + (reservation.children || 0),
          checkIn: new Date(reservation.check_in),
          checkOut: new Date(reservation.check_out),
          source: mapChannel(reservation.platform) as any,
          channelConfirmation: reservation.booking_code || null,
          status: "CONFIRMED",
          baseAmount: reservation.financials?.accommodation_total || 0,
          cleaningFee: reservation.financials?.cleaning_fee || 0,
          hostServiceFee: Math.abs(reservation.financials?.host_service_fee || 0),
          passThroughTax: reservation.financials?.pass_through_taxes || 0,
          payout: reservation.financials?.payout || 0,
          nightlyRates: (reservation.financials?.nightly_rates as any) || undefined,
          lastSyncedAt: new Date(),
          rawApiData: reservation as any,
        },
        update: {
          guestName: reservation.guest_name || null,
          checkIn: new Date(reservation.check_in),
          checkOut: new Date(reservation.check_out),
          baseAmount: reservation.financials?.accommodation_total || 0,
          cleaningFee: reservation.financials?.cleaning_fee || 0,
          hostServiceFee: Math.abs(reservation.financials?.host_service_fee || 0),
          passThroughTax: reservation.financials?.pass_through_taxes || 0,
          payout: reservation.financials?.payout || 0,
          nightlyRates: (reservation.financials?.nightly_rates as any) || undefined,
          lastSyncedAt: new Date(),
          rawApiData: reservation as any,
        },
      });

      return NextResponse.json({ received: true, matched: true, unitId: unit.id });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: String(error) },
      { status: 500 }
    );
  }
}

function mapChannel(platform: string): string {
  const map: Record<string, string> = {
    airbnb: "AIRBNB",
    vrbo: "VRBO",
    homeaway: "VRBO",
    direct: "DIRECT",
    misterbnb: "MISTERBNB",
  };
  return map[platform?.toLowerCase()] || "OTHER";
}
