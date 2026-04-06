import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { MgmtFeesChart } from "./mgmt-fees-chart";
import { YearOverYearChart } from "./yoy-chart";

export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

  const [ownerCount, unitCount, bookingCount, lastYearBookingCount, recentBookings, allBookings, feeConfigs] = await Promise.all([
    prisma.owner.count({ where: { isActive: true } }),
    prisma.unit.count({ where: { isActive: true } }),
    prisma.booking.count({
      where: { status: "CONFIRMED", checkIn: { lte: monthEnd }, checkOut: { gte: monthStart } },
    }),
    prisma.booking.count({
      where: { status: "CONFIRMED", checkIn: { lte: lastYearEnd }, checkOut: { gte: lastYearStart } },
    }),
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" }, checkIn: { gte: new Date() } },
      include: { unit: { select: { unitNumber: true, name: true } } },
      orderBy: { checkIn: "asc" },
      take: 8,
    }),
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" }, source: { notIn: ["OWNER_HOLD", "MAINTENANCE", "MAJOR_HOLIDAY"] } },
      select: { checkIn: true, payout: true, unitId: true },
    }),
    prisma.managementFeeConfig.findMany({
      where: { effectiveTo: null },
      select: { unitId: true, percentage: true },
    }),
  ]);

  // Build unit -> mgmt fee % map
  const feeRateByUnit: Record<string, number> = {};
  for (const fc of feeConfigs) {
    feeRateByUnit[fc.unitId] = Number(fc.percentage);
  }

  // Aggregate mgmt fees per month from bookings
  const feesByMonth: Record<string, number> = {};
  for (const b of allBookings) {
    const ci = new Date(b.checkIn);
    const key = `${ci.getFullYear()}-${String(ci.getMonth() + 1).padStart(2, "0")}`;
    const rate = feeRateByUnit[b.unitId] || 0.15;
    const fee = Number(b.payout) * rate;
    feesByMonth[key] = (feesByMonth[key] || 0) + fee;
  }

  const chartData = Object.entries(feesByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return { month: label, fees: Math.round(total * 100) / 100 };
    });

  // Year-over-year comparison: revenue by month grouped by year
  const revenueByYearMonth: Record<string, Record<number, number>> = {};
  for (const b of allBookings) {
    const ci = new Date(b.checkIn);
    const year = String(ci.getFullYear());
    const month = ci.getMonth(); // 0-indexed
    if (!revenueByYearMonth[year]) revenueByYearMonth[year] = {};
    revenueByYearMonth[year][month] = (revenueByYearMonth[year][month] || 0) + Number(b.payout);
  }

  const years = Object.keys(revenueByYearMonth).sort();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yoyData = monthNames.map((name, i) => {
    const row: Record<string, any> = { month: name };
    for (const year of years) {
      row[year] = Math.round((revenueByYearMonth[year]?.[i] || 0) * 100) / 100;
    }
    return row;
  });

  const bookingYoYPct = lastYearBookingCount > 0
    ? Math.round(((bookingCount - lastYearBookingCount) / lastYearBookingCount) * 1000) / 10
    : null;

  return { ownerCount, unitCount, bookingCount, lastYearBookingCount, bookingYoYPct, recentBookings, chartData, yoyData, years };
}

export default async function AdminDashboard() {
  const [stats, session] = await Promise.all([getStats(), auth()]);
  const userName = session?.user?.name?.split(" ")[0] || "there";

  const yoyUp = stats.bookingYoYPct !== null && stats.bookingYoYPct >= 0;
  const yoyDown = stats.bookingYoYPct !== null && stats.bookingYoYPct < 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#2D3028]">Welcome back, {userName}</h1>
        <p className="text-sm text-[#6B7862] mt-1">Here is an overview of your rental portfolio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-[#C9A84C]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7862]">Active Owners</p>
                <p className="text-3xl font-bold text-[#2D3028] mt-1">{stats.ownerCount}</p>
              </div>
              <Users className="h-8 w-8 text-[#C9A84C]/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-[#7D8B73]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7862]">Active Units</p>
                <p className="text-3xl font-bold text-[#2D3028] mt-1">{stats.unitCount}</p>
              </div>
              <Building2 className="h-8 w-8 text-[#C9A84C]/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-[#C9A84C]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7862]">Bookings This Month</p>
                <p className="text-3xl font-bold text-[#2D3028] mt-1">{stats.bookingCount}</p>
                {stats.bookingYoYPct !== null && (
                  <div className={`flex items-center gap-1 mt-1 ${yoyUp ? "text-green-600" : "text-red-600"}`}>
                    {yoyUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span className="text-xs font-semibold">
                      {yoyUp ? "+" : ""}{stats.bookingYoYPct}% vs last year
                    </span>
                    <span className="text-[10px] text-[#8E9B85] ml-1">({stats.lastYearBookingCount})</span>
                  </div>
                )}
                {stats.bookingYoYPct === null && stats.lastYearBookingCount === 0 && (
                  <p className="text-[10px] text-[#8E9B85] mt-1">No data for last year</p>
                )}
              </div>
              <CalendarDays className="h-8 w-8 text-[#C9A84C]/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <MgmtFeesChart data={stats.chartData} />
      <YearOverYearChart data={stats.yoyData} years={stats.years} />

      {/* Upcoming bookings */}
      <div>
        <h2 className="text-lg font-semibold text-[#2D3028] mb-4">Upcoming Bookings</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-[#E8ECE5]">
              {stats.recentBookings.map((b) => (
                <a key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAF7] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E8ECE5] flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-[#7D8B73]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2D3028]">{b.guestName || "Guest"}</p>
                      <p className="text-xs text-[#8E9B85]">Unit {b.unit.unitNumber} - {b.unit.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#2D3028]">
                      {new Date(b.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(b.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-[#C9A84C] font-medium">${Number(b.payout).toFixed(0)}</p>
                  </div>
                </a>
              ))}
              {stats.recentBookings.length === 0 && (
                <p className="px-6 py-8 text-center text-[#8E9B85]">No upcoming bookings</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
