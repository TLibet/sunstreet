import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdjustmentForm } from "./adjustment-form";
import { AdjustmentRow } from "./adjustment-row";

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
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D3028]">Recent Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8ECE5] bg-[#FAFAF7]">
                    <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Unit</th>
                    <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Period</th>
                    <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECE5]">
                  {serializedAdjustments.map((adj) => (
                    <AdjustmentRow key={adj.id} adjustment={adj} units={units} />
                  ))}
                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[#8E9B85]">
                        No adjustments yet. Add one using the form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <AdjustmentForm units={units} />
      </div>
    </div>
  );
}
