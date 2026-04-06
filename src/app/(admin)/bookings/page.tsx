import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

const SOURCE_STYLE: Record<string, string> = {
  AIRBNB: "bg-red-50 text-red-700 border-red-200",
  VRBO: "bg-blue-50 text-blue-700 border-blue-200",
  MISTERBNB: "bg-purple-50 text-purple-700 border-purple-200",
  DIRECT: "bg-green-50 text-green-700 border-green-200",
  OWNER_HOLD: "bg-yellow-50 text-yellow-700 border-yellow-200",
  MAINTENANCE: "bg-gray-100 text-gray-600 border-gray-200",
  MAJOR_HOLIDAY: "bg-orange-50 text-orange-700 border-orange-200",
  OTHER: "bg-gray-50 text-gray-600 border-gray-200",
};

async function getBookings() {
  return prisma.booking.findMany({
    include: { unit: { select: { unitNumber: true, name: true, owner: { select: { name: true } } } } },
    orderBy: { checkIn: "desc" },
    take: 200,
  });
}

function nights(ci: Date, co: Date) {
  return Math.round((co.getTime() - ci.getTime()) / 86400000);
}

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2D3028]">Bookings</h1>
        <p className="text-sm text-[#8E9B85] mt-1">{bookings.length} reservations</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8ECE5] bg-[#FAFAF7]">
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Unit</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Guest</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Check-in</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Check-out</th>
                  <th className="px-4 py-3 text-center font-medium text-[#6B7862]">Nights</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE5]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAFAF7] transition-colors cursor-pointer" onClick={() => {}}>
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${b.id}`} className="font-medium text-[#C9A84C] hover:underline">{b.unit.unitNumber}</Link>
                      <p className="text-xs text-[#8E9B85]">{b.unit.owner.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${b.id}`} className="font-medium text-[#2D3028] hover:text-[#C9A84C] transition-colors">{b.guestName || "Guest"}</Link>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className={SOURCE_STYLE[b.source]}>{b.source}</Badge></td>
                    <td className="px-4 py-3 text-[#6B7862]">{new Date(b.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="px-4 py-3 text-[#6B7862]">{new Date(b.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="px-4 py-3 text-center text-[#6B7862]">{nights(new Date(b.checkIn), new Date(b.checkOut))}</td>
                    <td className="px-4 py-3"><Badge variant={b.status === "CONFIRMED" ? "default" : b.status === "CANCELLED" ? "destructive" : "secondary"}>{b.status}</Badge></td>
                    <td className="px-4 py-3 text-right font-mono text-[#2D3028]">${Number(b.baseAmount).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-[#C9A84C]">${Number(b.payout).toFixed(0)}</td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-[#8E9B85]">No bookings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
