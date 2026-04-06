import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Calendar, Building2, DollarSign, Mail, Phone, Users, Hash } from "lucide-react";

export const dynamic = "force-dynamic";

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

async function getBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: { unit: { include: { owner: { select: { id: true, name: true } } } } },
  });
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="h-4 w-4 text-[#8E9B85] mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-[#8E9B85] uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-[#2D3028] mt-0.5">{value || "-"}</p>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, bold, negative }: { label: string; value: number; bold?: boolean; negative?: boolean }) {
  if (value === 0 && !bold) return null;
  const formatted = negative ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`;
  return (
    <div className={`flex justify-between py-2 ${bold ? "font-semibold text-[#2D3028]" : "text-sm"}`}>
      <span className="text-[#6B7862]">{label}</span>
      <span className={`font-mono ${negative ? "text-red-600" : bold ? "text-[#2D3028]" : "text-[#2D3028]"}`}>{formatted}</span>
    </div>
  );
}

export default async function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);
  if (!booking) notFound();

  const nights = Math.round(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const nightlyRates = booking.nightlyRates as { date: string; rate: number; originalRate?: number; discountPerNight?: number }[] | null;
  const hasDiscount = Number(booking.discountAmount) > 0 || nightlyRates?.some((nr) => nr.discountPerNight && nr.discountPerNight > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/bookings">
          <Button variant="ghost" size="icon" className="hover:bg-[#E8ECE5]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#2D3028]">{booking.guestName || "Guest"}</h1>
            <Badge className={SOURCE_STYLE[booking.source]}>{booking.source}</Badge>
            <Badge variant={booking.status === "CONFIRMED" ? "default" : booking.status === "CANCELLED" ? "destructive" : "secondary"}>
              {booking.status}
            </Badge>
          </div>
          {booking.channelConfirmation && (
            <p className="text-sm text-[#8E9B85] mt-1">Confirmation: {booking.channelConfirmation}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D3028]">Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Guest Name" value={booking.guestName} icon={User} />
            {booking.guestEmail && <InfoRow label="Email" value={booking.guestEmail} icon={Mail} />}
            {booking.guestPhone && <InfoRow label="Phone" value={booking.guestPhone} icon={Phone} />}
            {booking.numberOfGuests && <InfoRow label="Guests" value={`${booking.numberOfGuests} guests`} icon={Users} />}

            <Separator className="my-3" />

            <InfoRow label="Check-in" value={new Date(booking.checkIn).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} icon={Calendar} />
            <InfoRow label="Check-out" value={new Date(booking.checkOut).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} icon={Calendar} />
            <InfoRow label="Nights" value={`${nights} nights`} icon={Hash} />
            {booking.bookedAt && <InfoRow label="Booked On" value={new Date(booking.bookedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} icon={Calendar} />}

            <Separator className="my-3" />

            <InfoRow
              label="Unit"
              value={
                <Link href={`/units/${booking.unitId}`} className="text-[#C9A84C] hover:underline">
                  Unit {booking.unit.unitNumber} - {booking.unit.name}
                </Link>
              }
              icon={Building2}
            />
            <InfoRow
              label="Owner"
              value={
                <Link href={`/owners/${booking.unit.owner.id}`} className="text-[#C9A84C] hover:underline">
                  {booking.unit.owner.name}
                </Link>
              }
              icon={User}
            />
          </CardContent>
        </Card>

        {/* Right: Financials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D3028]">Financial Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialRow label="Accommodation" value={Number(booking.baseAmount)} bold />

            {/* Discount summary */}
            {hasDiscount && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-green-700">Discount</span>
                <span className="font-mono text-green-700">-${Number(booking.discountAmount).toFixed(2)}</span>
              </div>
            )}

            {/* Nightly rate breakdown */}
            {nightlyRates && nightlyRates.length > 0 && (
              <div className="mt-2 mb-4 rounded-lg bg-[#FAFAF7] p-3">
                <p className="text-xs text-[#8E9B85] uppercase tracking-wide mb-2">Nightly Rates</p>

                {/* Header row if discount exists */}
                {hasDiscount && (
                  <div className="flex justify-between text-[10px] text-[#8E9B85] uppercase tracking-wide mb-1 pb-1 border-b border-[#E8ECE5]">
                    <span>Date</span>
                    <div className="flex gap-4">
                      <span className="w-16 text-right">Original</span>
                      <span className="w-16 text-right">Discount</span>
                      <span className="w-16 text-right">Adjusted</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {nightlyRates.map((nr) => {
                    const hasNrDiscount = nr.discountPerNight && nr.discountPerNight > 0;
                    const original = nr.originalRate ?? nr.rate;
                    const adjusted = nr.rate;

                    return (
                      <div key={nr.date} className="flex justify-between text-xs">
                        <span className="text-[#6B7862]">
                          {new Date(nr.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {hasDiscount ? (
                          <div className="flex gap-4">
                            <span className="w-16 text-right font-mono text-[#8E9B85] line-through">
                              ${original.toFixed(2)}
                            </span>
                            <span className="w-16 text-right font-mono text-green-600">
                              {hasNrDiscount ? `-$${nr.discountPerNight!.toFixed(2)}` : "-"}
                            </span>
                            <span className="w-16 text-right font-mono font-medium text-[#2D3028]">
                              ${adjusted.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-[#2D3028]">${adjusted.toFixed(2)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals row for discounted bookings */}
                {hasDiscount && (
                  <div className="flex justify-between text-xs font-semibold mt-2 pt-2 border-t border-[#E8ECE5]">
                    <span className="text-[#2D3028]">Total</span>
                    <div className="flex gap-4">
                      <span className="w-16 text-right font-mono text-[#8E9B85]">
                        ${nightlyRates.reduce((s, nr) => s + (nr.originalRate ?? nr.rate), 0).toFixed(2)}
                      </span>
                      <span className="w-16 text-right font-mono text-green-600">
                        -${Number(booking.discountAmount).toFixed(2)}
                      </span>
                      <span className="w-16 text-right font-mono text-[#2D3028]">
                        ${nightlyRates.reduce((s, nr) => s + nr.rate, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator className="my-3" />

            <FinancialRow label="Cleaning Fee" value={Number(booking.cleaningFee)} />
            <FinancialRow label="Host Service Fee" value={Number(booking.hostServiceFee)} negative />
            <FinancialRow label="Pass-Through Tax" value={Number(booking.passThroughTax)} />
            <FinancialRow label="Guest Service Fee" value={Number(booking.guestServiceFee)} />
            <FinancialRow label="Pet Fee" value={Number(booking.petFee)} />
            <FinancialRow label="Extra Guest Fee" value={Number(booking.extraGuestFee)} />
            <FinancialRow label="Security Deposit" value={Number(booking.securityDeposit)} />
            <FinancialRow label="Adjusted Amount" value={Number(booking.adjustedAmount)} />

            <Separator className="my-3" />

            <div className="flex justify-between py-3">
              <span className="text-base font-bold text-[#2D3028]">Payout</span>
              <span className="text-xl font-bold text-[#C9A84C] font-mono">
                ${Number(booking.payout).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw API Data (collapsible) */}
      {booking.rawApiData && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-[#8E9B85] hover:text-[#6B7862] transition-colors">
            View raw API data
          </summary>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <pre className="text-xs text-[#6B7862] bg-[#FAFAF7] p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(booking.rawApiData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </details>
      )}
    </div>
  );
}
