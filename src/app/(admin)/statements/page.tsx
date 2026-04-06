import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateStatementsForm } from "./generate-form";

export const dynamic = 'force-dynamic';

async function getStatements() {
  return prisma.statement.findMany({
    include: {
      owner: { select: { name: true } },
      snapshots: {
        include: { unit: { select: { unitNumber: true } } },
      },
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

export default async function StatementsPage() {
  const [statements, owners] = await Promise.all([getStatements(), getOwners()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statements</h1>
        <GenerateStatementsForm owners={owners} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Units</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Gross Income</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Mgmt Fees</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Net Due</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((stmt) => (
                  <tr key={stmt.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/statements/${stmt.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {stmt.owner.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(stmt.year, stmt.month - 1).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {stmt.snapshots
                        .map((s) => s.unit.unitNumber)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${Number(stmt.totalGrossIncome).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      -${Number(stmt.totalMgmtFees).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      ${Number(stmt.totalDueToOwner).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))}
                {statements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No statements generated yet. Use the button above to generate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
