import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { BookingCalendar } from "@/components/calendar/booking-calendar";

export const dynamic = 'force-dynamic';

export default async function OwnerUnitsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ownerId = (session.user as any).ownerId;
  if (!ownerId) redirect("/login");

  const units = await prisma.unit.findMany({
    where: { ownerId },
    include: {
      bookings: { orderBy: { checkIn: "asc" } },
    },
    orderBy: { unitNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Units</h1>

      {units.map((unit) => {
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
          <Card key={unit.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Unit {unit.unitNumber} - {unit.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingCalendar unitId={unit.id} bookings={calendarBookings} />
            </CardContent>
          </Card>
        );
      })}

      {units.length === 0 && (
        <p className="text-center text-gray-500 py-12">
          No units assigned to your account.
        </p>
      )}
    </div>
  );
}
