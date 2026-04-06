import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Lock, Trash2 } from "lucide-react";
import { finalizeStatement, deleteStatement } from "../actions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getStatement(id: string) {
  const statement = await prisma.statement.findUnique({
    where: { id },
    include: {
      owner: true,
      snapshots: {
        include: { unit: { select: { id: true, unitNumber: true, name: true } } },
        orderBy: { unit: { unitNumber: "asc" } },
      },
    },
  });
  if (!statement) return null;

  // Fetch bookings and adjustments for each unit in this statement's month
  const bookingsByUnit: Record<string, any[]> = {};
  const adjustmentsByUnit: Record<string, any[]> = {};
  const monthStart = new Date(statement.year, statement.month - 1, 1);
  const monthEnd = new Date(statement.year, statement.month, 0);

  for (const snapshot of statement.snapshots) {
    bookingsByUnit[snapshot.unitId] = await prisma.booking.findMany({
      where: {
        unitId: snapshot.unitId,
        checkIn: { lte: monthEnd },
        checkOut: { gt: monthStart },
        status: { not: "CANCELLED" },
      },
      orderBy: { checkIn: "asc" },
    });
    adjustmentsByUnit[snapshot.unitId] = await prisma.adjustment.findMany({
      where: {
        unitId: snapshot.unitId,
        year: statement.year,
        month: statement.month,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  return { statement, bookingsByUnit, adjustmentsByUnit };
}

function SummaryRow({ label, value, bold, negative }: { label: string; value: number; bold?: boolean; negative?: boolean }) {
  const formatted = negative ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`;
  return (
    <div className={`flex justify-between py-1 ${bold ? "font-bold" : ""}`}>
      <span className="text-[#6B7862]">{label}</span>
      <span className={`font-mono ${negative ? "text-red-600" : ""} ${bold ? "text-lg text-[#2D3028]" : "text-[#2D3028]"}`}>{formatted}</span>
    </div>
  );
}

const SOURCE_BADGE: Record<string, string> = {
  AIRBNB: "bg-red-50 text-red-700",
  VRBO: "bg-blue-50 text-blue-700",
  DIRECT: "bg-green-50 text-green-700",
  MISTERBNB: "bg-purple-50 text-purple-700",
  OWNER_HOLD: "bg-yellow-50 text-yellow-700",
  MAINTENANCE: "bg-gray-100 text-gray-600",
};

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ statementId: string }>;
}) {
  const { statementId } = await params;
  const result = await getStatement(statementId);
  if (!result) notFound();
  const { statement, bookingsByUnit, adjustmentsByUnit } = result;

  const period = new Date(statement.year, statement.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/statements">
          <Button variant="ghost" size="icon" className="hover:bg-[#E8ECE5]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D3028]">{statement.owner.name} - {period}</h1>
          <p className="text-sm text-[#8E9B85]">
            {statement.snapshots.length} unit{statement.snapshots.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={statement.status === "SENT" ? "default" : statement.status === "FINALIZED" ? "secondary" : "outline"}>
            {statement.status}
          </Badge>
          <Link href={`/api/statements/${statement.id}/pdf`}>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />PDF</Button>
          </Link>
          <Link href={`/api/statements/${statement.id}/excel`}>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Excel</Button>
          </Link>
          {statement.status === "DRAFT" && (
            <form action={finalizeStatement.bind(null, statement.id)}>
              <Button type="submit" size="sm" className="bg-[#7D8B73] hover:bg-[#6B7862] text-white">
                <Lock className="mr-2 h-4 w-4" />Finalize
              </Button>
            </form>
          )}
          <form action={async () => { "use server"; await deleteStatement(statementId); redirect("/statements"); }}>
            <Button type="submit" size="sm" variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
          </form>
        </div>
      </div>

      {/* Per-unit breakdown */}
      {statement.snapshots.map((snapshot) => {
        const unitBookings = bookingsByUnit[snapshot.unitId] || [];
        const unitAdjustments = adjustmentsByUnit[snapshot.unitId] || [];

        const bookingRows = unitBookings
          .filter((b: any) => b.source !== "OWNER_HOLD" && b.source !== "MAINTENANCE" && b.source !== "MAJOR_HOLIDAY")
          .map((b: any) => {
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            const isCheckInMonth = checkIn.getFullYear() === statement.year && checkIn.getMonth() + 1 === statement.month;

            let revenue: number;
            if (isCheckInMonth) {
              // Booking starts in this month — use full payout (includes fees)
              revenue = Number(b.payout);
            } else {
              // Cross-month booking — only count nightly rates for days in this month
              const nightlyRates = b.nightlyRates as { date: string; rate: number }[] | null;
              const monthPrefix = `${statement.year}-${String(statement.month).padStart(2, "0")}`;

              if (nightlyRates) {
                revenue = nightlyRates
                  .filter((nr: any) => nr.date.startsWith(monthPrefix))
                  .reduce((sum: number, nr: any) => sum + nr.rate, 0);
              } else {
                // Fallback: uniform rate for days in this month
                const totalNights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
                const perNight = totalNights > 0 ? Number(b.baseAmount) / totalNights : 0;
                const mStart = new Date(statement.year, statement.month - 1, 1);
                const mEnd = new Date(statement.year, statement.month, 1);
                const effStart = checkIn > mStart ? checkIn : mStart;
                const effEnd = checkOut < mEnd ? checkOut : mEnd;
                const nightsInMonth = Math.max(0, Math.round((effEnd.getTime() - effStart.getTime()) / 86400000));
                revenue = Math.round(perNight * nightsInMonth * 100) / 100;
              }
            }

            return {
              id: b.id,
              guestName: b.guestName || "Guest",
              source: b.source,
              confirmation: b.channelConfirmation || "-",
              checkIn,
              checkOut,
              revenue,
              discountAmount: isCheckInMonth ? Number(b.discountAmount || 0) : 0,
              isCrossMonth: !isCheckInMonth,
            };
          });

        const grossRevenue = bookingRows.reduce((s: number, r: any) => s + r.revenue, 0);

        return (
          <Card key={snapshot.id}>
            <CardHeader>
              <CardTitle className="text-base text-[#2D3028]">
                Unit {snapshot.unit.unitNumber} - {snapshot.unit.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-[#E8ECE5] p-3">
                  <p className="text-xs text-[#6B7862]">Booked Nights</p>
                  <p className="text-xl font-bold text-[#2D3028]">{snapshot.bookedNights} / {snapshot.totalNights}</p>
                </div>
                <div className="rounded-lg bg-[#E8ECE5] p-3">
                  <p className="text-xs text-[#6B7862]">Nightly Average</p>
                  <p className="text-xl font-bold text-[#2D3028]">${Number(snapshot.nightlyAverage).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-[#E8ECE5] p-3">
                  <p className="text-xs text-[#6B7862]">Occupancy</p>
                  <p className="text-xl font-bold text-[#2D3028]">{(Number(snapshot.occupancyRate) * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Bookings table */}
              {bookingRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#8E9B85] uppercase tracking-wide mb-2">Bookings</p>
                  <div className="rounded-lg border border-[#E2DED6] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#FAFAF7] border-b border-[#E8ECE5]">
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7862]">Confirmation</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7862]">Check-in</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7862]">Check-out</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-[#6B7862]">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8ECE5]">
                        {bookingRows.map((row: any) => (
                          <tr key={row.id} className="hover:bg-[#FAFAF7]">
                            <td className="px-3 py-2 font-mono text-xs">
                              <Link href={`/bookings/${row.id}`} className="text-[#C9A84C] hover:underline">{row.confirmation}</Link>
                            </td>
                            <td className="px-3 py-2 text-[#6B7862]">
                              {row.checkIn.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </td>
                            <td className="px-3 py-2 text-[#6B7862]">
                              {row.checkOut.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="font-mono font-medium text-[#2D3028]">${row.revenue.toFixed(2)}</span>
                              {row.isCrossMonth && <span className="block text-[10px] text-[#8E9B85]">nightly only</span>}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#FAFAF7] font-semibold">
                          <td colSpan={3} className="px-3 py-2 text-right text-[#6B7862]">Gross Revenue</td>
                          <td className="px-3 py-2 text-right font-mono text-[#2D3028]">${grossRevenue.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Separator />

              {/* Financial summary */}
              <div className="space-y-1">
                <SummaryRow label="Monthly Total (for commission)" value={Number(snapshot.monthlyTotal)} bold />

                {/* Itemized adjustments */}
                {unitAdjustments.filter((a: any) => a.category === "ADJUSTED_AMOUNT").length > 0 && (
                  <div className="ml-4 space-y-0.5">
                    {unitAdjustments
                      .filter((a: any) => a.category === "ADJUSTED_AMOUNT")
                      .map((a: any) => (
                        <div key={a.id} className="flex justify-between py-0.5 text-sm">
                          <span className="text-[#8E9B85] italic">{a.description}</span>
                          <span className={`font-mono ${Number(a.amount) < 0 ? "text-red-600" : "text-[#2D3028]"}`}>
                            {Number(a.amount) < 0 ? `-$${Math.abs(Number(a.amount)).toFixed(2)}` : `$${Number(a.amount).toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
                {Number(snapshot.adjustedAmounts) !== 0 && unitAdjustments.filter((a: any) => a.category === "ADJUSTED_AMOUNT").length === 0 && (
                  <SummaryRow label="Adjusted Amounts" value={Number(snapshot.adjustedAmounts)} />
                )}

                <SummaryRow label="Cancellation Income" value={Number(snapshot.cancellationIncome)} />
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#8E9B85] uppercase tracking-wide">Expenses</p>
                <SummaryRow label={`Mgmt Fee (${(Number(snapshot.mgmtFeePercentage) * 100).toFixed(0)}%)`} value={Number(snapshot.mgmtFeeAmount)} negative />
                <SummaryRow label="Cleaning Income" value={Number(snapshot.cleaningIncome)} />
                <SummaryRow label="Cleaning Expense" value={Number(snapshot.cleaningExpense)} negative />
                <SummaryRow label="Host Service Fee" value={Number(snapshot.hostServiceFee)} negative />
                <SummaryRow label="Tax Income (offset)" value={Number(snapshot.taxIncome)} />
                <SummaryRow label="Tax Expense" value={Number(snapshot.taxExpense)} negative />
                <SummaryRow label="Supplies/Restock/Repairs" value={Number(snapshot.suppliesExpense) + Number(snapshot.repairsExpense)} negative />
                <SummaryRow label="S.Street Balance" value={Number(snapshot.sunstreetBalance)} negative />
                <Separator />
                <SummaryRow label="Expense Total" value={Number(snapshot.expenseTotal)} negative bold />
              </div>

              <Separator />

              <SummaryRow label="Net Total Due to Owner" value={Number(snapshot.netDueToOwner)} bold />
              <SummaryRow label="Gross Income" value={Number(snapshot.grossIncome)} />
            </CardContent>
          </Card>
        );
      })}

      {/* Grand totals */}
      <Card className="border-2 border-[#C9A84C]/30">
        <CardHeader>
          <CardTitle className="text-[#2D3028]">Grand Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryRow label="Total Gross Income" value={Number(statement.totalGrossIncome)} />
          <SummaryRow label="Total Management Fees" value={Number(statement.totalMgmtFees)} negative />
          <Separator className="my-2" />
          <SummaryRow label="Total Net Due to Owner" value={Number(statement.totalDueToOwner)} bold />
        </CardContent>
      </Card>
    </div>
  );
}
