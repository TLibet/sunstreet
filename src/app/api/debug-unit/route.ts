import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const propId = request.nextUrl.searchParams.get("property");
  const testParams = request.nextUrl.searchParams.get("test-params");

  // Test different date parameter names
  if (testParams && propId) {
    const paramSets = [
      { name: "no params", params: {} },
      { name: "checkin_start/end (3 months)", params: { checkin_start: "2026-04-01", checkin_end: "2026-07-31" } },
      { name: "start_date/end_date (3 months)", params: { start_date: "2026-04-01", end_date: "2026-07-31" } },
      { name: "from/to", params: { from: "2026-04-01", to: "2026-07-31" } },
      { name: "date_from/date_to", params: { date_from: "2026-04-01", date_to: "2026-07-31" } },
      { name: "arrival_start/arrival_end", params: { arrival_start: "2026-04-01", arrival_end: "2026-07-31" } },
    ];

    const results: any[] = [];
    for (const ps of paramSets) {
      try {
        const url = new URL("https://public.api.hospitable.com/v2/reservations");
        url.searchParams.append("properties[]", propId);
        url.searchParams.set("per_page", "100");
        for (const [k, v] of Object.entries(ps.params)) {
          url.searchParams.set(k, v as string);
        }
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`, Accept: "application/json" },
        });
        const data = await res.json();
        results.push({
          name: ps.name,
          status: res.status,
          total: data.meta?.total ?? data.data?.length ?? null,
          error: data.reason_phrase || null,
          latestCheckIn: data.data?.length ? data.data.map((r: any) => (r.arrival_date || r.check_in)?.split("T")[0]).sort().pop() : null,
        });
      } catch (e) {
        results.push({ name: ps.name, error: String(e) });
      }
    }
    return NextResponse.json({ results });
  }

  // Default: fetch all pages for a property
  if (!propId) return NextResponse.json({ error: "property param required" });

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
