import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const propId = request.nextUrl.searchParams.get("property");
  if (!propId) return NextResponse.json({ error: "property param required" });

  try {
    // Try with different statuses and all pages
    const results: any[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const url = new URL("https://public.api.hospitable.com/v2/reservations");
      url.searchParams.append("properties[]", propId);
      url.searchParams.set("include", "financials,guest");
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();

      if (!data.data) {
        return NextResponse.json({ error: "API error", raw: data });
      }

      lastPage = data.meta?.last_page || 1;

      for (const r of data.data) {
        results.push({
          id: r.id,
          guest: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : "?",
          platform: r.platform,
          checkIn: (r.arrival_date || r.check_in)?.split("T")[0],
          checkOut: (r.departure_date || r.check_out)?.split("T")[0],
          status: r.status,
          stayType: r.stay_type,
        });
      }

      page++;
    } while (page <= lastPage);

    return NextResponse.json({
      totalFromApi: results.length,
      lastPage,
      reservations: results,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
