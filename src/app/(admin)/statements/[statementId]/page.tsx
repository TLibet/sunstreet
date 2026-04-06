import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Lock } from "lucide-react";
import { finalizeStatement } from "../actions";

export const dynamic = 'force-dynamic';

async function getStatement(id: string) {
  return prisma.statement.findUnique({
    where: { id },
    include: {
      owner: true,
      snapshots: {
        include: { unit: { select: { unitNumber: true, name: true } } },
        orderBy: { unit: { unitNumber: "asc" } },
      },
    },
  });
}

function SummaryRow({
  label,
  value,
  bold,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  negative?: boolean;
}) {
  const formatted = negative
    ? `-$${Math.abs(value).toFixed(2)}`
    : `$${value.toFixed(2)}`;

  return (
    <div className={`flex justify-between py-1 ${bold ? "font-bold" : ""}`}>
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-mono ${negative ? "text-red-600" : ""} ${bold ? "text-lg" : ""}`}
      >
        {formatted}
      </span>
    </div>
  );
}

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ statementId: string }>;
}) {
  const { statementId } = await params;
  const statement = await getStatement(statementId);
  if (!statement) notFound();

  const period = new Date(statement.year, statement.month - 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/statements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {statement.owner.name} - {period}
          </h1>
          <p className="text-sm text-gray-500">
            {statement.snapshots.length} unit
            {statement.snapshots.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={
              statement.status === "SENT"
                ? "default"
                : statement.status === "FINALIZED"
                  ? "secondary"
                  : "outline"
            }
          >
            {statement.status}
          </Badge>
          <Link href={`/api/statements/${statement.id}/pdf`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </Link>
          <Link href={`/api/statements/${statement.id}/excel`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </Link>
          {statement.status === "DRAFT" && (
            <form action={finalizeStatement.bind(null, statement.id)}>
              <Button type="submit" size="sm" variant="destructive">
                <Lock className="mr-2 h-4 w-4" />
                Finalize
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Per-unit breakdown */}
      {statement.snapshots.map((snapshot) => (
        <Card key={snapshot.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Unit {snapshot.unit.unitNumber} - {snapshot.unit.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-600">Booked Nights</p>
                <p className="text-xl font-bold text-blue-900">
                  {snapshot.bookedNights} / {snapshot.totalNights}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs text-green-600">Nightly Average</p>
                <p className="text-xl font-bold text-green-900">
                  ${Number(snapshot.nightlyAverage).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="text-xs text-purple-600">Occupancy</p>
                <p className="text-xl font-bold text-purple-900">
                  {(Number(snapshot.occupancyRate) * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <SummaryRow
                label="Monthly Total (for commission)"
                value={Number(snapshot.monthlyTotal)}
                bold
              />
              <SummaryRow
                label="Adjusted Amounts"
                value={Number(snapshot.adjustedAmounts)}
              />
              <SummaryRow
                label="Cancellation Income"
                value={Number(snapshot.cancellationIncome)}
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Expenses
              </p>
              <SummaryRow
                label={`Mgmt Fee (${(Number(snapshot.mgmtFeePercentage) * 100).toFixed(0)}%)`}
                value={Number(snapshot.mgmtFeeAmount)}
                negative
              />
              <SummaryRow
                label="Cleaning Income"
                value={Number(snapshot.cleaningIncome)}
              />
              <SummaryRow
                label="Cleaning Expense"
                value={Number(snapshot.cleaningExpense)}
                negative
              />
              <SummaryRow
                label="Host Service Fee"
                value={Number(snapshot.hostServiceFee)}
                negative
              />
              <SummaryRow
                label="Tax Income (offset)"
                value={Number(snapshot.taxIncome)}
              />
              <SummaryRow
                label="Tax Expense"
                value={Number(snapshot.taxExpense)}
                negative
              />
              <SummaryRow
                label="Supplies/Restock/Repairs"
                value={Number(snapshot.suppliesExpense) + Number(snapshot.repairsExpense)}
                negative
              />
              <SummaryRow
                label="S.Street Balance"
                value={Number(snapshot.sunstreetBalance)}
                negative
              />

              <Separator />

              <SummaryRow
                label="Expense Total"
                value={Number(snapshot.expenseTotal)}
                negative
                bold
              />
            </div>

            <Separator />

            <SummaryRow
              label="Net Total Due to Owner"
              value={Number(snapshot.netDueToOwner)}
              bold
            />
            <SummaryRow
              label="Gross Income"
              value={Number(snapshot.grossIncome)}
            />
          </CardContent>
        </Card>
      ))}

      {/* Grand totals */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle>Grand Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryRow
            label="Total Gross Income"
            value={Number(statement.totalGrossIncome)}
          />
          <SummaryRow
            label="Total Management Fees"
            value={Number(statement.totalMgmtFees)}
            negative
          />
          <Separator className="my-2" />
          <SummaryRow
            label="Total Net Due to Owner"
            value={Number(statement.totalDueToOwner)}
            bold
          />
        </CardContent>
      </Card>
    </div>
  );
}
