import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const propId = request.nextUrl.searchParams.get("property");
  const startDate = request.nextUrl.searchParams.get("start");
  const endDate = request.nextUrl.searchParams.get("end");
  if (!propId) return NextResponse.json({ error: "property param required" });

  try {
    const url = new URL("https://public.api.hospitable.com/v2/reservations");
    url.searchParams.append("properties[]", propId);
    url.searchParams.set("include", "financials,guest");
    url.searchParams.set("per_page", "100");
    if (startDate) url.searchParams.set("checkin_start", startDate);
    if (endDate) url.searchParams.set("checkin_end", endDate);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`,
        Accept: "application/json",
      },
    });
    const data = await res.json();

    if (!data.data) {
      // Try different param names
      const url2 = new URL("https://public.api.hospitable.com/v2/reservations");
      url2.searchParams.append("properties[]", propId);
      url2.searchParams.set("include", "financials,guest");
      url2.searchParams.set("per_page", "100");
      if (startDate) url2.searchParams.set("arrival_start", startDate);
      if (endDate) url2.searchParams.set("arrival_end", endDate);

      const res2 = await fetch(url2.toString(), {
        headers: {
          Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`,
          Accept: "application/json",
        },
      });
      const data2 = await res2.json();

      return NextResponse.json({
        attempt1_params: "checkin_start/checkin_end",
        attempt1_status: res.status,
        attempt1_error: data.reason_phrase || null,
        attempt2_params: "arrival_start/arrival_end",
        attempt2_status: res2.status,
        attempt2_total: data2.meta?.total,
        attempt2_count: data2.data?.length,
        attempt2_reservations: (data2.data || []).slice(0, 3).map((r: any) => ({
          guest: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : "?",
          checkIn: (r.arrival_date || r.check_in)?.split("T")[0],
          status: r.status,
        })),
      });
    }

    const reservations = (data.data || []).map((r: any) => ({
      id: r.id,
      guest: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : "?",
      platform: r.platform,
      checkIn: (r.arrival_date || r.check_in)?.split("T")[0],
      checkOut: (r.departure_date || r.check_out)?.split("T")[0],
      status: r.status,
    }));

    return NextResponse.json({
      total: data.meta?.total,
      page: data.meta?.current_page,
      lastPage: data.meta?.last_page,
      count: reservations.length,
      reservations,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
