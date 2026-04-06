import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { BookingCalendar } from "@/components/calendar/booking-calendar";

export const dynamic = 'force-dynamic';

async function getUnit(id: string) {
  return prisma.unit.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, id: true } },
      feeConfigs: {
        orderBy: { effectiveFrom: "desc" },
      },
      bookings: {
        orderBy: { checkIn: "asc" },
      },
    },
  });
}

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = await getUnit(unitId);
  if (!unit) notFound();

  const currentFee = unit.feeConfigs.find((fc) => !fc.effectiveTo);
  const feePercent = currentFee
    ? `${(Number(currentFee.percentage) * 100).toFixed(1)}%`
    : "Not set";

  // Serialize bookings for client component
  const calendarBookings = unit.bookings.map((b) => ({
    id: b.id,
    guestName: b.guestName,
    source: b.source,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nightlyRates: b.nightlyRates as any,
    baseAmount: b.baseAmount.toString(),
    status: b.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/units">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Unit {unit.unitNumber}</h1>
          <p className="text-sm text-gray-500">
            {unit.name} | Owner:{" "}
            <Link
              href={`/owners/${unit.owner.id}`}
              className="text-blue-600 hover:underline"
            >
              {unit.owner.name}
            </Link>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">Mgmt Fee: {feePercent}</Badge>
          {unit.hosputableListingId && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              Hospitable linked
            </Badge>
          )}
          <Link href={`/units/${unit.id}/settings`}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Booking Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingCalendar unitId={unit.id} bookings={calendarBookings} />
        </CardContent>
      </Card>

      {/* Fee History */}
      {unit.feeConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Management Fee History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unit.feeConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                >
                  <span className="font-medium">
                    {(Number(config.percentage) * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">
                    {new Date(config.effectiveFrom).toLocaleDateString()} -{" "}
                    {config.effectiveTo
                      ? new Date(config.effectiveTo).toLocaleDateString()
                      : "Current"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
