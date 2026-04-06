import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OwnerStatementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ownerId = (session.user as any).ownerId;
  if (!ownerId) redirect("/login");

  const statements = await prisma.statement.findMany({
    where: { ownerId },
    include: {
      snapshots: {
        include: { unit: { select: { unitNumber: true } } },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Statements</h1>

      <div className="space-y-4">
        {statements.map((stmt) => (
          <Card key={stmt.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold">
                    {new Date(stmt.year, stmt.month - 1).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Units: {stmt.snapshots.map((s) => s.unit.unitNumber).join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold">
                    ${Number(stmt.totalDueToOwner).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Net Due</p>
                </div>

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

                <div className="flex gap-2">
                  <Link href={`/api/statements/${stmt.id}/pdf`}>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3 w-3" />
                      PDF
                    </Button>
                  </Link>
                  <Link href={`/api/statements/${stmt.id}/excel`}>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3 w-3" />
                      Excel
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {statements.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No statements available yet.
          </p>
        )}
      </div>
    </div>
  );
}
