import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CalendarDays, DollarSign, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getOwnerStats(ownerId: string) {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: {
      units: {
        include: {
          _count: { select: { bookings: true } },
        },
      },
      statements: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 12,
      },
    },
  });

  if (!owner) return null;

  const totalUnits = owner.units.length;
  const totalStatements = owner.statements.length;
  const latestStatement = owner.statements[0];
  const yearlyTotal = owner.statements.reduce(
    (sum, s) => sum + Number(s.totalDueToOwner),
    0
  );

  return {
    ownerName: owner.name,
    totalUnits,
    totalStatements,
    latestStatement,
    yearlyTotal,
    units: owner.units,
  };
}

export default async function OwnerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ownerId = (session.user as any).ownerId;
  if (!ownerId) redirect("/login");

  const stats = await getOwnerStats(ownerId);
  if (!stats) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {stats.ownerName}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              My Units
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalUnits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Statements
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalStatements}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Latest Net Due
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${stats.latestStatement
                ? Number(stats.latestStatement.totalDueToOwner).toFixed(2)
                : "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Year Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${stats.yearlyTotal.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">My Units</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {stats.units.map((unit) => (
            <Card key={unit.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Unit {unit.unitNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{unit.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {unit._count.bookings} total bookings
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
