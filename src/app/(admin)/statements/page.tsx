import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateStatementsForm } from "./generate-form";

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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE5]">
                {statements.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/statements/${stmt.id}`} className="text-[#C9A84C] hover:underline">{stmt.owner.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-[#6B7862]">
                      {new Date(stmt.year, stmt.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-[#6B7862]">{stmt.snapshots.map((s) => s.unit.unitNumber).join(", ")}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#2D3028]">${Number(stmt.totalGrossIncome).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">-${Number(stmt.totalMgmtFees).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#2D3028]">${Number(stmt.totalDueToOwner).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={stmt.status === "SENT" ? "default" : stmt.status === "FINALIZED" ? "secondary" : "outline"}>{stmt.status}</Badge>
                    </td>
                  </tr>
                ))}
                {statements.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8E9B85]">No statements yet. Generate your first statement above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
