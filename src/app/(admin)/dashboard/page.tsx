import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { MgmtFeesChart } from "./mgmt-fees-chart";

export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [ownerCount, unitCount, bookingCount, recentBookings, allBookings, feeConfigs] = await Promise.all([
    prisma.owner.count({ where: { isActive: true } }),
    prisma.unit.count({ where: { isActive: true } }),
    prisma.booking.count({
      where: { status: "CONFIRMED", checkIn: { lte: monthEnd }, checkOut: { gte: monthStart } },
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

  return { ownerCount, unitCount, bookingCount, recentBookings, chartData };
}

export default async function AdminDashboard() {
  const [stats, session] = await Promise.all([getStats(), auth()]);
  const userName = session?.user?.name?.split(" ")[0] || "there";

  const statCards = [
    { label: "Active Owners", value: stats.ownerCount, icon: Users, color: "border-[#C9A84C]" },
    { label: "Active Units", value: stats.unitCount, icon: Building2, color: "border-[#7D8B73]" },
    { label: "Bookings This Month", value: stats.bookingCount, icon: CalendarDays, color: "border-[#C9A84C]" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#2D3028]">Welcome back, {userName}</h1>
        <p className="text-sm text-[#6B7862] mt-1">Here is an overview of your rental portfolio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className={`border-l-4 ${card.color}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6B7862]">{card.label}</p>
                  <p className="text-3xl font-bold text-[#2D3028] mt-1">{card.value}</p>
                </div>
                <card.icon className="h-8 w-8 text-[#C9A84C]/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mgmt Fees Chart */}
      <MgmtFeesChart data={stats.chartData} />

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
