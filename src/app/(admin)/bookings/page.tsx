import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

const SOURCE_BADGE: Record<string, string> = {
  AIRBNB: "bg-red-100 text-red-800",
  VRBO: "bg-blue-100 text-blue-800",
  MISTERBNB: "bg-purple-100 text-purple-800",
  DIRECT: "bg-green-100 text-green-800",
  OWNER_HOLD: "bg-yellow-100 text-yellow-800",
  MAINTENANCE: "bg-gray-100 text-gray-600",
  MAJOR_HOLIDAY: "bg-orange-100 text-orange-800",
};

async function getBookings() {
  return prisma.booking.findMany({
    include: {
      unit: { select: { unitNumber: true, name: true, owner: { select: { name: true } } } },
    },
    orderBy: { checkIn: "desc" },
    take: 100,
  });
}

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Guest</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Check-in</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Check-out</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Payout</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/units/${booking.unitId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {booking.unit.unitNumber}
                      </Link>
                      <p className="text-xs text-gray-400">{booking.unit.owner.name}</p>
                    </td>
                    <td className="px-4 py-3">{booking.guestName || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={SOURCE_BADGE[booking.source] || ""}
                      >
                        {booking.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(booking.checkIn).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(booking.checkOut).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          booking.status === "CONFIRMED"
                            ? "default"
                            : booking.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${Number(booking.baseAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${Number(booking.payout).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      No bookings yet. Sync from Hospitable or add manual bookings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
