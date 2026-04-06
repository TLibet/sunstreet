import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getOwner(id: string) {
  return prisma.owner.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          feeConfigs: {
            where: { effectiveTo: null },
            take: 1,
          },
          _count: { select: { bookings: true } },
        },
        orderBy: { unitNumber: "asc" },
      },
      statements: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 5,
      },
    },
  });
}

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = await params;
  const owner = await getOwner(ownerId);
  if (!owner) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/owners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{owner.name}</h1>
          <p className="text-sm text-gray-500">
            {owner.email} {owner.phone && `| ${owner.phone}`}
          </p>
        </div>
        <Badge variant={owner.isActive ? "default" : "secondary"} className="ml-auto">
          {owner.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {owner.address && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">{owner.address}</p>
            {owner.notes && (
              <p className="mt-2 text-sm text-gray-500">{owner.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Units</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {owner.units.map((unit) => {
            const feeConfig = unit.feeConfigs[0];
            const feePercent = feeConfig
              ? `${(Number(feeConfig.percentage) * 100).toFixed(0)}%`
              : "Not set";

            return (
              <Link key={unit.id} href={`/admin/units/${unit.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Unit {unit.unitNumber}
                      </CardTitle>
                      <Badge variant="outline">Mgmt: {feePercent}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{unit.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {unit._count.bookings} bookings
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {owner.statements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Statements</h2>
          <div className="space-y-2">
            {owner.statements.map((stmt) => (
              <Link
                key={stmt.id}
                href={`/admin/statements/${stmt.id}`}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {new Date(stmt.year, stmt.month - 1).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    ${Number(stmt.totalDueToOwner).toFixed(2)}
                  </span>
                  <Badge
                    variant={
                      stmt.status === "SENT"
                        ? "default"
                        : stmt.status === "FINALIZED"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {stmt.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
