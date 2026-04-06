import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateStatementsForm } from "./generate-form";
import { StatementsList } from "./statements-list";

export const dynamic = 'force-dynamic';

async function getStatements() {
  return prisma.statement.findMany({
    include: {
      owner: { select: { name: true } },
      snapshots: { include: { unit: { select: { unitNumber: true } } } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 50,
  });
}

async function getOwners() {
  return prisma.owner.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

async function getUnits() {
  return prisma.unit.findMany({
    where: { isActive: true },
    select: { id: true, unitNumber: true, name: true },
    orderBy: { unitNumber: "asc" },
  });
}

export default async function StatementsPage() {
  const [statements, owners, units] = await Promise.all([getStatements(), getOwners(), getUnits()]);

  const serialized = statements.map((stmt) => ({
    id: stmt.id,
    ownerName: stmt.owner.name,
    month: stmt.month,
    year: stmt.year,
    units: stmt.snapshots.map((s) => s.unit.unitNumber).join(", "),
    totalGrossIncome: Number(stmt.totalGrossIncome),
    totalMgmtFees: Number(stmt.totalMgmtFees),
    totalDueToOwner: Number(stmt.totalDueToOwner),
    status: stmt.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3028]">Statements</h1>
          <p className="text-sm text-[#8E9B85] mt-1">{statements.length} statements</p>
        </div>
        <GenerateStatementsForm owners={owners} units={units} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8ECE5] bg-[#FAFAF7]">
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Units</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Gross Income</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Mgmt Fees</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Net Due</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]"></th>
                </tr>
              </thead>
              <StatementsList statements={serialized} />
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
