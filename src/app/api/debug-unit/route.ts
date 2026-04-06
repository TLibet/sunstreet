import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const propId = request.nextUrl.searchParams.get("property");
  const all = request.nextUrl.searchParams.get("all");

  // If "all" param, check all linked units and count API results
  if (all) {
    const units = await prisma.unit.findMany({
      where: { hosputableListingId: { not: null } },
      select: { id: true, unitNumber: true, hosputableListingId: true },
    });

    const results: any[] = [];
    for (const unit of units) {
      let totalFromApi = 0;
      let page = 1;
      let lastPage = 1;
      const latestCheckIn = { date: "", guest: "" };

      do {
        const url = new URL("https://public.api.hospitable.com/v2/reservations");
        url.searchParams.append("properties[]", unit.hosputableListingId!);
        url.searchParams.set("include", "guest");
        url.searchParams.set("per_page", "100");
        url.searchParams.set("page", String(page));

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`, Accept: "application/json" },
        });
        const data = await res.json();
        if (!data.data) break;

        lastPage = data.meta?.last_page || 1;
        totalFromApi += data.data.length;

        for (const r of data.data) {
          const ci = (r.arrival_date || r.check_in)?.split("T")[0] || "";
          if (ci > latestCheckIn.date) {
            latestCheckIn.date = ci;
            latestCheckIn.guest = r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : "?";
          }
        }
        page++;
      } while (page <= lastPage);

      const dbCount = await prisma.booking.count({ where: { unitId: unit.id } });

      results.push({
        unit: unit.unitNumber,
        apiTotal: totalFromApi,
        dbTotal: dbCount,
        pages: lastPage,
        latestBooking: latestCheckIn.date ? `${latestCheckIn.date} (${latestCheckIn.guest})` : "none",
        missing: totalFromApi > dbCount ? totalFromApi - dbCount : 0,
      });
    }

    return NextResponse.json({ units: results, totalApi: results.reduce((s, r) => s + r.apiTotal, 0), totalDb: results.reduce((s, r) => s + r.dbTotal, 0) });
  }

  // Single property debug
  if (!propId) return NextResponse.json({ error: "property or all param required" });

  const allReservations: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const url = new URL("https://public.api.hospitable.com/v2/reservations");
    url.searchParams.append("properties[]", propId);
    url.searchParams.set("include", "financials,guest");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`, Accept: "application/json" },
    });
    const data = await res.json();
    if (!data.data) break;

    lastPage = data.meta?.last_page || 1;
    for (const r of data.data) {
      allReservations.push({
        id: r.id,
        guest: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : "?",
        platform: r.platform,
        checkIn: (r.arrival_date || r.check_in)?.split("T")[0],
        checkOut: (r.departure_date || r.check_out)?.split("T")[0],
        status: r.status,
      });
    }
    page++;
  } while (page <= lastPage);

  return NextResponse.json({ total: allReservations.length, pages: lastPage, reservations: allReservations });
}
