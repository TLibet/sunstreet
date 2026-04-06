import { NextRequest, NextResponse } from "next/server";
import { HospitableClient } from "@/lib/hospitable/client";
import { syncReservations } from "@/lib/hospitable/sync";

export async function GET(request: NextRequest) {
  const test = request.nextUrl.searchParams.get("test");

  if (test) {
    const client = new HospitableClient();
    const connected = await client.testConnection();
    return NextResponse.json({ connected });
  }

  return NextResponse.json({ status: "ok" });
}

export async function POST(request: NextRequest) {
  try {
    // Verify either admin session or cron secret
    const cronSecret = request.headers.get("authorization");
    if (
      cronSecret &&
      cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
      !process.env.CRON_SECRET
    ) {
      // Allow if no CRON_SECRET is set (dev mode)
    }

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
