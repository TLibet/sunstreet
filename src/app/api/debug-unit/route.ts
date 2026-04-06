import { NextRequest, NextResponse } from "next/server";
import { HospitableClient } from "@/lib/hospitable/client";

export async function GET(request: NextRequest) {
  const propId = request.nextUrl.searchParams.get("property");
  if (!propId) return NextResponse.json({ error: "property param required" });

  try {
    const client = new HospitableClient();
    const url = new URL("https://public.api.hospitable.com/v2/reservations");
    url.searchParams.append("properties[]", propId);
    url.searchParams.set("include", "financials,guest");
    url.searchParams.set("per_page", "100");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.HOSPITABLE_PAT}`,
        Accept: "application/json",
      },
    });
    const data = await res.json();

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
