import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PDF generation using a simple HTML-to-PDF approach
// For production, use @react-pdf/renderer or puppeteer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const statement = await prisma.statement.findUnique({
    where: { id },
    include: {
      owner: true,
      snapshots: {
        include: { unit: { select: { unitNumber: true, name: true } } },
      },
    },
  });

  if (!statement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const period = new Date(statement.year, statement.month - 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // Generate HTML for PDF (can be rendered by browser print or converted)
  const html = generateStatementHtml(statement, period);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

function generateStatementHtml(statement: any, period: string): string {
  const snapshotRows = statement.snapshots
    .map(
      (s: any) => `
      <div class="unit-section">
        <h3>Unit ${s.unit.unitNumber} - ${s.unit.name}</h3>
        <table>
          <tr><td>Monthly Total (for commission)</td><td class="money">$${Number(s.monthlyTotal).toFixed(2)}</td></tr>
          <tr><td># of Booked Nights</td><td>${s.bookedNights} / ${s.totalNights}</td></tr>
          <tr><td>Nightly Average</td><td class="money">$${Number(s.nightlyAverage).toFixed(2)}</td></tr>
          <tr><td>Adjusted Amounts</td><td class="money">$${Number(s.adjustedAmounts).toFixed(2)}</td></tr>
          <tr><td>Cancellation Income</td><td class="money">$${Number(s.cancellationIncome).toFixed(2)}</td></tr>
          <tr class="separator"><td colspan="2"><hr></td></tr>
          <tr><td>Mgmt Fee (${(Number(s.mgmtFeePercentage) * 100).toFixed(0)}%)</td><td class="money negative">-$${Number(s.mgmtFeeAmount).toFixed(2)}</td></tr>
          <tr><td>Cleaning Income</td><td class="money">$${Number(s.cleaningIncome).toFixed(2)}</td></tr>
          <tr><td>Cleaning Expense</td><td class="money negative">-$${Number(s.cleaningExpense).toFixed(2)}</td></tr>
          <tr><td>Host Service Fee</td><td class="money negative">-$${Number(s.hostServiceFee).toFixed(2)}</td></tr>
          <tr><td>Tax Income (offset)</td><td class="money">$${Number(s.taxIncome).toFixed(2)}</td></tr>
          <tr><td>Tax Expense</td><td class="money negative">-$${Number(s.taxExpense).toFixed(2)}</td></tr>
          <tr><td>Supplies/Restock/Repairs</td><td class="money negative">-$${(Number(s.suppliesExpense) + Number(s.repairsExpense)).toFixed(2)}</td></tr>
          <tr><td>S.Street Balance</td><td class="money negative">-$${Number(s.sunstreetBalance).toFixed(2)}</td></tr>
          <tr class="separator"><td colspan="2"><hr></td></tr>
          <tr class="bold"><td>Expense Total</td><td class="money negative">-$${Number(s.expenseTotal).toFixed(2)}</td></tr>
          <tr class="separator"><td colspan="2"><hr></td></tr>
          <tr class="bold total"><td>Net Total Due to Owner</td><td class="money">$${Number(s.netDueToOwner).toFixed(2)}</td></tr>
          <tr><td>Gross Income</td><td class="money">$${Number(s.grossIncome).toFixed(2)}</td></tr>
        </table>
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sunstreet - ${statement.owner.name} - ${period}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .header h1 { color: #2563eb; margin: 0; }
    .header h2 { color: #666; margin: 5px 0; font-weight: normal; }
    .owner-info { margin-bottom: 20px; color: #666; }
    .unit-section { margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
    .unit-section h3 { margin-top: 0; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; }
    td:last-child { text-align: right; }
    .money { font-family: monospace; }
    .negative { color: #dc2626; }
    .bold td { font-weight: bold; }
    .total td { font-size: 1.1em; color: #2563eb; }
    .separator td { padding: 2px 0; }
    .grand-total { background: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin-top: 20px; }
    .grand-total h3 { margin-top: 0; color: #2563eb; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sunstreet</h1>
    <h2>Owner Statement - ${period}</h2>
  </div>
  <div class="owner-info">
    <strong>${statement.owner.name}</strong><br>
    ${statement.owner.email || ""}<br>
    ${statement.owner.address || ""}
  </div>
  ${snapshotRows}
  <div class="grand-total">
    <h3>Grand Totals</h3>
    <table>
      <tr><td>Total Gross Income</td><td class="money">$${Number(statement.totalGrossIncome).toFixed(2)}</td></tr>
      <tr><td>Total Management Fees</td><td class="money negative">-$${Number(statement.totalMgmtFees).toFixed(2)}</td></tr>
      <tr class="bold total"><td>Total Net Due to Owner</td><td class="money">$${Number(statement.totalDueToOwner).toFixed(2)}</td></tr>
    </table>
  </div>
  <script>window.print && setTimeout(() => {}, 500);</script>
</body>
</html>`;
}
