import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { UnitDialog } from "./unit-dialog";

export const dynamic = 'force-dynamic';

async function getUnits() {
  return prisma.unit.findMany({
    include: {
      owner: { select: { name: true } },
      feeConfigs: {
        where: { effectiveTo: null },
        take: 1,
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { unitNumber: "asc" },
  });
}

async function getOwners() {
  return prisma.owner.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function UnitsPage() {
  const [units, owners] = await Promise.all([getUnits(), getOwners()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Units</h1>
        <UnitDialog owners={owners} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => {
          const feeConfig = unit.feeConfigs[0];
          const feePercent = feeConfig
            ? `${(Number(feeConfig.percentage) * 100).toFixed(0)}%`
            : "Not set";

          return (
            <Link key={unit.id} href={`/units/${unit.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Unit {unit.unitNumber}
                    </CardTitle>
                    <Badge variant={unit.isActive ? "default" : "secondary"}>
                      {unit.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{unit.name}</p>
                  <p className="text-sm text-gray-500">Owner: {unit.owner.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>Mgmt Fee: {feePercent}</span>
                    <span>{unit._count.bookings} bookings</span>
                  </div>
                  {unit.hosputableListingId && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Hospitable linked
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {units.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-12">
            No units yet. Add your first unit to get started.
          </p>
        )}
      </div>
    </div>
  );
}
