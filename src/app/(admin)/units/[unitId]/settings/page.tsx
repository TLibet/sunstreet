import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UnitSettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function UnitSettingsPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  const [unit, owners] = await Promise.all([
    prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        owner: { select: { id: true, name: true } },
        feeConfigs: { where: { effectiveTo: null }, take: 1 },
      },
    }),
    prisma.owner.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!unit) notFound();

  const currentFee = unit.feeConfigs[0]
    ? (Number(unit.feeConfigs[0].percentage) * 100).toFixed(1)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/units/${unitId}`}>
          <Button variant="ghost" size="icon" className="hover:bg-[#E8ECE5]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D3028]">Unit {unit.unitNumber} Settings</h1>
          <p className="text-sm text-[#8E9B85]">{unit.name}</p>
        </div>
      </div>

      <UnitSettingsForm
        unitId={unitId}
        currentOwnerId={unit.ownerId}
        currentFee={currentFee}
        currentCleaningFee={unit.defaultCleaningFee ? Number(unit.defaultCleaningFee).toFixed(2) : ""}
        owners={owners}
      />
    </div>
  );
}
