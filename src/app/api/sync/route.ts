import { NextRequest, NextResponse } from "next/server";
import { HospitableClient } from "@/lib/hospitable/client";
import { syncReservations } from "@/lib/hospitable/sync";

export async function GET(request: NextRequest) {
  const test = request.nextUrl.searchParams.get("test");
  const listProperties = request.nextUrl.searchParams.get("properties");

  if (test) {
    const client = new HospitableClient();
    const connected = await client.testConnection();
    return NextResponse.json({ connected });
  }

  if (listProperties) {
    try {
      const client = new HospitableClient();
      const response = await client.getProperties({ per_page: 100 });
      return NextResponse.json({
        properties: response.data.map((p: any) => ({
          uuid: p.uuid || p.id,
          name: p.name || p.nickname || p.title,
          address: p.address,
          platform: p.platform,
        })),
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to fetch properties" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ status: "ok" });
}

export const maxDuration = 60; // Allow up to 60s for sync

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await syncReservations({
      startDate: body.startDate,
      endDate: body.endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
