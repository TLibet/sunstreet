import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdjustmentForm } from "./adjustment-form";

export const dynamic = 'force-dynamic';

async function getAdjustments() {
  return prisma.adjustment.findMany({
    include: { unit: { select: { unitNumber: true, name: true } } },
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manual Adjustments</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Existing Adjustments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Period</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((adj) => (
                    <tr key={adj.id} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        {adj.unit.unitNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(adj.year, adj.month - 1).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[adj.category] || adj.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{adj.description}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          Number(adj.amount) < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        ${Number(adj.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No adjustments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add Adjustment Form */}
        <AdjustmentForm units={units} />
      </div>
    </div>
  );
}
