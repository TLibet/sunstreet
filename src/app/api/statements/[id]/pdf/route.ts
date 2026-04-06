import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        include: { unit: { select: { id: true, unitNumber: true, name: true } } },
      },
    },
  });

  if (!statement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch bookings per unit
  const bookingsByUnit: Record<string, any[]> = {};
  const monthStart = new Date(statement.year, statement.month - 1, 1);
  const monthEnd = new Date(statement.year, statement.month, 0);

  const adjustmentsByUnit: Record<string, any[]> = {};

  for (const snapshot of statement.snapshots) {
    bookingsByUnit[snapshot.unitId] = await prisma.booking.findMany({
      where: {
        unitId: snapshot.unitId,
        checkIn: { lte: monthEnd },
        checkOut: { gt: monthStart },
        status: { not: "CANCELLED" },
        source: { notIn: ["OWNER_HOLD", "MAINTENANCE", "MAJOR_HOLIDAY"] },
      },
      orderBy: { checkIn: "asc" },
    });
    adjustmentsByUnit[snapshot.unitId] = await prisma.adjustment.findMany({
      where: { unitId: snapshot.unitId, year: statement.year, month: statement.month },
      orderBy: { createdAt: "asc" },
    });
  }

  const period = new Date(statement.year, statement.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const baseUrl = request.nextUrl.origin;
  const html = generateStatementHtml(statement, period, bookingsByUnit, adjustmentsByUnit, baseUrl);

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getBookingRevenue(booking: any, year: number, month: number): number {
  const checkIn = new Date(booking.checkIn);
  const isCheckInMonth = checkIn.getFullYear() === year && checkIn.getMonth() + 1 === month;

  if (isCheckInMonth) {
    return Number(booking.payout);
  }

  // Cross-month: only nightly rates for this month
  const nightlyRates = booking.nightlyRates as { date: string; rate: number }[] | null;
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  if (nightlyRates) {
    return nightlyRates.filter((nr: any) => nr.date.startsWith(monthPrefix)).reduce((s: number, nr: any) => s + nr.rate, 0);
  }

  const checkOut = new Date(booking.checkOut);
  const totalNights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  const perNight = totalNights > 0 ? Number(booking.baseAmount) / totalNights : 0;
  const mStart = new Date(year, month - 1, 1);
  const mEnd = new Date(year, month, 1);
  const effStart = checkIn > mStart ? checkIn : mStart;
  const effEnd = checkOut < mEnd ? checkOut : mEnd;
  const nightsInMonth = Math.max(0, Math.round((effEnd.getTime() - effStart.getTime()) / 86400000));
  return Math.round(perNight * nightsInMonth * 100) / 100;
}

function generateStatementHtml(statement: any, period: string, bookingsByUnit: Record<string, any[]>, adjustmentsByUnit: Record<string, any[]>, baseUrl: string): string {
  const snapshotSections = statement.snapshots.map((s: any) => {
    const bookings = bookingsByUnit[s.unitId] || [];
    const adjustments = adjustmentsByUnit[s.unitId] || [];
    const adjItems = adjustments.filter((a: any) => a.category === "ADJUSTED_AMOUNT");
    const adjItemsHtml = adjItems.map((a: any) => {
      const amt = Number(a.amount);
      return `<tr><td style="padding-left:20px;font-style:italic;color:#6B7862">${a.description}</td><td class="money" style="${amt < 0 ? "color:#dc2626" : ""}">${amt < 0 ? "-" : ""}$${Math.abs(amt).toFixed(2)}</td></tr>`;
    }).join("");
    const bookingData = bookings.map((b: any) => {
      const rev = getBookingRevenue(b, statement.year, statement.month);
      const checkIn = new Date(b.checkIn);
      const isCheckInMonth = checkIn.getFullYear() === statement.year && checkIn.getMonth() + 1 === statement.month;
      return { b, rev, isCheckInMonth };
    });
    const totalRev = bookingData.reduce((sum: number, d: any) => sum + d.rev, 0);

    const bookingRows = bookingData.map((d: any) => {
      return `<tr>
        <td style="font-family:monospace;font-size:11px">${d.b.channelConfirmation || "-"}</td>
        <td>${formatDate(new Date(d.b.checkIn))}</td>
        <td>${formatDate(new Date(d.b.checkOut))}</td>
        <td class="money">$${d.rev.toFixed(2)}${!d.isCheckInMonth ? '<br><span style="font-size:9px;color:#8E9B85">nightly only</span>' : ''}</td>
      </tr>`;
    }).join("");

    return `
      <div class="unit-section">
        <h3>Unit ${s.unit.unitNumber} - ${s.unit.name}</h3>

        <div class="stats">
          <div class="stat"><span class="stat-label">Booked Nights</span><span class="stat-value">${s.bookedNights} / ${s.totalNights}</span></div>
          <div class="stat"><span class="stat-label">Nightly Avg</span><span class="stat-value">$${Number(s.nightlyAverage).toFixed(2)}</span></div>
          <div class="stat"><span class="stat-label">Occupancy</span><span class="stat-value">${(Number(s.occupancyRate) * 100).toFixed(0)}%</span></div>
        </div>

        ${bookings.length > 0 ? `
        <h4>Bookings</h4>
        <table class="bookings-table">
          <thead>
            <tr><th>Confirmation</th><th>Check-in</th><th>Check-out</th><th style="text-align:right">Revenue</th></tr>
          </thead>
          <tbody>
            ${bookingRows}
            <tr class="total-row"><td colspan="3" style="text-align:right;font-weight:bold">Gross Revenue</td><td class="money" style="font-weight:bold">$${totalRev.toFixed(2)}</td></tr>
          </tbody>
        </table>
        ` : ""}

        <h4>Financial Summary</h4>
        <table>
          <tr><td><strong>Monthly Total (for commission)</strong></td><td class="money"><strong>$${Number(s.monthlyTotal).toFixed(2)}</strong></td></tr>
          ${adjItems.length > 0 ? adjItemsHtml : (Number(s.adjustedAmounts) !== 0 ? `<tr><td>Adjusted Amounts</td><td class="money">$${Number(s.adjustedAmounts).toFixed(2)}</td></tr>` : "")}
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
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sun Street Properties - ${statement.owner.name} - ${period}</title>
  <style>
    body { font-family: 'Georgia', serif; max-width: 850px; margin: 0 auto; padding: 40px; color: #2D3028; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #C9A84C; }
    .header img { height: 60px; margin-bottom: 10px; }
    .header h1 { color: #7D8B73; margin: 0; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; }
    .header h2 { color: #2D3028; margin: 8px 0 0; font-weight: normal; font-size: 20px; }
    .owner-info { margin-bottom: 25px; color: #6B7862; font-size: 14px; }
    .unit-section { margin-bottom: 30px; border: 1px solid #E2DED6; border-radius: 8px; padding: 20px; }
    .unit-section h3 { margin-top: 0; color: #2D3028; font-size: 16px; border-bottom: 1px solid #E8ECE5; padding-bottom: 8px; }
    .unit-section h4 { color: #7D8B73; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 16px 0 8px; }
    .stats { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat { flex: 1; background: #F5F0E8; border-radius: 6px; padding: 10px; text-align: center; }
    .stat-label { display: block; font-size: 10px; color: #6B7862; text-transform: uppercase; letter-spacing: 1px; }
    .stat-value { display: block; font-size: 18px; font-weight: bold; color: #2D3028; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td, th { padding: 5px 0; }
    td:last-child, th:last-child { text-align: right; }
    th { text-align: left; }
    .money { font-family: 'Courier New', monospace; }
    .negative { color: #dc2626; }
    .bold td { font-weight: bold; }
    .total td { font-size: 1.1em; color: #C9A84C; }
    .separator td { padding: 2px 0; }
    .bookings-table { margin-bottom: 16px; }
    .bookings-table th { font-size: 10px; color: #6B7862; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #E8ECE5; padding: 6px 4px; }
    .bookings-table td { padding: 6px 4px; border-bottom: 1px solid #F0EDE6; font-size: 12px; }
    .bookings-table .total-row td { border-top: 2px solid #E2DED6; border-bottom: none; padding-top: 8px; }
    .grand-total { background: #F5F0E8; border: 2px solid #C9A84C; border-radius: 8px; padding: 20px; margin-top: 20px; }
    .grand-total h3 { margin-top: 0; color: #C9A84C; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${baseUrl}/logo-dark.svg" alt="Sun Street Properties" />
    <h1>Owner Statement</h1>
    <h2>${period}</h2>
  </div>
  <div class="owner-info">
    <strong>${statement.owner.name}</strong><br>
    ${statement.owner.email || ""}${statement.owner.address ? "<br>" + statement.owner.address : ""}
  </div>
  ${snapshotSections}
  <div class="grand-total">
    <h3>Grand Totals</h3>
    <table>
      <tr><td>Total Gross Income</td><td class="money">$${Number(statement.totalGrossIncome).toFixed(2)}</td></tr>
      <tr><td>Total Management Fees</td><td class="money negative">-$${Number(statement.totalMgmtFees).toFixed(2)}</td></tr>
      <tr class="bold total"><td>Total Net Due to Owner</td><td class="money">$${Number(statement.totalDueToOwner).toFixed(2)}</td></tr>
    </table>
  </div>
</body>
</html>`;
}
