import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdjustmentForm } from "./adjustment-form";
import { AdjustmentsList } from "./adjustments-list";

export const dynamic = 'force-dynamic';

async function getAdjustments() {
  return prisma.adjustment.findMany({
    include: { unit: { select: { id: true, unitNumber: true, name: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}

async function getUnits() {
  return prisma.unit.findMany({
    where: { isActive: true },
    select: { id: true, unitNumber: true, name: true },
    orderBy: { unitNumber: "asc" },
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  CLEANING_EXPENSE: "Cleaning Expense",
  SUPPLIES_RESTOCK: "Supplies/Restock",
  REPAIRS_MAINTENANCE: "Repairs/Maintenance",
  TAX_EXPENSE: "Tax Expense",
  CANCELLATION_INCOME: "Cancellation Income",
  ADJUSTED_AMOUNT: "Adjusted Amount",
  SUNSTREET_BALANCE: "S.Street Balance",
  OTHER_INCOME: "Other Income",
  OTHER_EXPENSE: "Other Expense",
};

export default async function AdjustmentsPage() {
  const [adjustments, units] = await Promise.all([getAdjustments(), getUnits()]);

  const serializedAdjustments = adjustments.map((adj) => ({
    id: adj.id,
    unitId: adj.unitId,
    unitNumber: adj.unit.unitNumber,
    unitName: adj.unit.name,
    month: adj.month,
    year: adj.year,
    category: adj.category,
    categoryLabel: CATEGORY_LABELS[adj.category] || adj.category,
    description: adj.description,
    amount: Number(adj.amount),
    createdAt: adj.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2D3028]">Manual Adjustments</h1>
        <p className="text-sm text-[#8E9B85] mt-1">{adjustments.length} adjustments</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <AdjustmentsList adjustments={serializedAdjustments} units={units} />
        <AdjustmentForm units={units} />
      </div>
    </div>
  );
}
