import { prisma } from "@/lib/prisma";
import type { Booking, Adjustment } from "@prisma/client";
import type { NightlyRate, CalculationLog, CalculationStep } from "@/types";

type MonthlySnapshotData = {
  nightlyAverage: number;
  monthlyTotal: number;
  bookedNights: number;
  totalNights: number;
  occupancyRate: number;
  mgmtFeePercentage: number;
  mgmtFeeAmount: number;
  cleaningIncome: number;
  taxIncome: number;
  cancellationIncome: number;
  otherIncome: number;
  cleaningExpense: number;
  hostServiceFee: number;
  taxExpense: number;
  suppliesExpense: number;
  repairsExpense: number;
  otherExpense: number;
  adjustedAmounts: number;
  sunstreetBalance: number;
  expenseTotal: number;
  grossIncome: number;
  netDueToOwner: number;
  calculationLog: CalculationLog;
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Determine if a booking's check-in is in the given month
function isCheckInMonth(booking: Booking, year: number, month: number): boolean {
  const checkIn = new Date(booking.checkIn);
  return checkIn.getFullYear() === year && checkIn.getMonth() + 1 === month;
}

/**
 * Calculate the monthly summary for a unit.
 *
 * Cross-month booking rule: Nightly rates are attributed to the day's month.
 * All booking-level fees/expenses (cleaning, service fee, tax) go to the
 * check-in month only.
 */
export async function calculateMonthlySummary(
  unitId: string,
  year: number,
  month: number
): Promise<MonthlySnapshotData> {
  const steps: CalculationStep[] = [];
  const totalNights = getDaysInMonth(year, month);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  // 1. Get bookings overlapping this month
  const bookings = await prisma.booking.findMany({
    where: {
      unitId,
      checkIn: { lte: monthEnd },
      checkOut: { gt: monthStart },
      status: { not: "CANCELLED" },
    },
    orderBy: { checkIn: "asc" },
  });

  steps.push({
    step: "fetchBookings",
    description: `Found ${bookings.length} bookings overlapping ${year}-${month}`,
    inputs: { unitId, year, month, bookingCount: bookings.length },
    result: bookings.length,
  });

  // 2. Build daily calendar and sum nightly rates
  let monthlyTotal = 0;
  let bookedNights = 0;
  const dailyBreakdown: { date: string; rate: number; source: string; bookingId: string }[] = [];

  for (let day = 1; day <= totalNights; day++) {
    const date = dateStr(year, month, day);
    const dateObj = new Date(year, month - 1, day);

    for (const booking of bookings) {
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);

      // Day is booked if checkIn <= date < checkOut
      if (dateObj >= checkInDate && dateObj < checkOutDate) {
        // Skip non-revenue sources for monthly total
        const isRevenue =
          booking.source !== "OWNER_HOLD" &&
          booking.source !== "MAINTENANCE" &&
          booking.source !== "MAJOR_HOLIDAY";

        let rate = 0;

        // Try to get rate from nightlyRates JSON
        if (booking.nightlyRates) {
          const rates = booking.nightlyRates as NightlyRate[];
          const nightlyRate = rates.find((nr) => nr.date === date);
          if (nightlyRate) rate = nightlyRate.rate;
        }

        // Fallback: uniform rate
        if (rate === 0 && Number(booking.baseAmount) > 0) {
          const nights = Math.round(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (nights > 0) rate = Number(booking.baseAmount) / nights;
        }

        if (isRevenue) {
          monthlyTotal += rate;
          bookedNights++;
        }

        dailyBreakdown.push({
          date,
          rate,
          source: booking.source,
          bookingId: booking.id,
        });
        break; // One booking per day
      }
    }
  }

  const nightlyAverage = bookedNights > 0 ? monthlyTotal / bookedNights : 0;
  const occupancyRate = totalNights > 0 ? bookedNights / totalNights : 0;

  steps.push({
    step: "nightlyRates",
    description: `Calculated ${bookedNights} booked nights, monthly total $${monthlyTotal.toFixed(2)}`,
    inputs: { dailyBreakdown },
    result: monthlyTotal,
  });

  // 3. Get management fee rate
  const feeConfig = await prisma.managementFeeConfig.findFirst({
    where: {
      unitId,
      effectiveFrom: { lte: monthEnd },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  const mgmtFeePercentage = feeConfig ? Number(feeConfig.percentage) : 0;
  const mgmtFeeAmount = monthlyTotal * mgmtFeePercentage;

  steps.push({
    step: "mgmtFee",
    description: `Management fee: ${(mgmtFeePercentage * 100).toFixed(1)}% of $${monthlyTotal.toFixed(2)}`,
    inputs: { mgmtFeePercentage, monthlyTotal },
    result: mgmtFeeAmount,
  });

  // 4. Aggregate booking-level fees/income (only for bookings with check-in in this month)
  let cleaningIncome = 0;
  let taxIncome = 0;
  let hostServiceFeeTotal = 0;

  for (const booking of bookings) {
    if (isCheckInMonth(booking, year, month)) {
      cleaningIncome += Number(booking.cleaningFee);
      taxIncome += Number(booking.passThroughTax);
      hostServiceFeeTotal += Math.abs(Number(booking.hostServiceFee));
    }
  }

  steps.push({
    step: "bookingFees",
    description: "Aggregated booking-level fees (check-in month only)",
    inputs: {
      bookingsInMonth: bookings
        .filter((b) => isCheckInMonth(b, year, month))
        .map((b) => ({
          id: b.id,
          cleaningFee: Number(b.cleaningFee),
          hostServiceFee: Number(b.hostServiceFee),
          passThroughTax: Number(b.passThroughTax),
        })),
    },
    result: cleaningIncome + taxIncome,
  });

  // 5. Get manual adjustments
  const adjustments = await prisma.adjustment.findMany({
    where: { unitId, year, month },
  });

  let cleaningExpense = 0;
  let taxExpense = 0;
  let suppliesExpense = 0;
  let repairsExpense = 0;
  let cancellationIncome = 0;
  let adjustedAmounts = 0;
  let sunstreetBalance = 0;
  let otherIncome = 0;
  let otherExpense = 0;

  for (const adj of adjustments) {
    const amount = Number(adj.amount);
    switch (adj.category) {
      case "CLEANING_EXPENSE":
        cleaningExpense += Math.abs(amount);
        break;
      case "TAX_EXPENSE":
        taxExpense += Math.abs(amount);
        break;
      case "SUPPLIES_RESTOCK":
        suppliesExpense += Math.abs(amount);
        break;
      case "REPAIRS_MAINTENANCE":
        repairsExpense += Math.abs(amount);
        break;
      case "CANCELLATION_INCOME":
        cancellationIncome += amount;
        break;
      case "ADJUSTED_AMOUNT":
        adjustedAmounts += amount;
        break;
      case "SUNSTREET_BALANCE":
        sunstreetBalance += amount;
        break;
      case "OTHER_INCOME":
        otherIncome += amount;
        break;
      case "OTHER_EXPENSE":
        otherExpense += Math.abs(amount);
        break;
    }
  }

  steps.push({
    step: "adjustments",
    description: `Processed ${adjustments.length} manual adjustments`,
    inputs: {
      adjustments: adjustments.map((a) => ({
        category: a.category,
        description: a.description,
        amount: Number(a.amount),
      })),
    },
    result: adjustments.reduce((sum, a) => sum + Number(a.amount), 0),
  });

  // 6. Calculate totals
  const expenseTotal =
    mgmtFeeAmount +
    cleaningExpense +
    hostServiceFeeTotal +
    taxExpense +
    suppliesExpense +
    repairsExpense +
    otherExpense +
    sunstreetBalance;

  const grossIncome = monthlyTotal + cleaningIncome + taxIncome;

  const netDueToOwner =
    monthlyTotal +
    cancellationIncome +
    adjustedAmounts +
    otherIncome +
    cleaningIncome -
    cleaningExpense +
    taxIncome -
    taxExpense -
    mgmtFeeAmount -
    hostServiceFeeTotal -
    suppliesExpense -
    repairsExpense -
    otherExpense -
    sunstreetBalance;

  steps.push({
    step: "totals",
    description: "Final calculations",
    inputs: {
      monthlyTotal,
      cleaningIncome,
      cleaningExpense,
      taxIncome,
      taxExpense,
      mgmtFeeAmount,
      hostServiceFeeTotal,
      suppliesExpense,
      repairsExpense,
      cancellationIncome,
      adjustedAmounts,
      sunstreetBalance,
      otherIncome,
      otherExpense,
    },
    result: netDueToOwner,
  });

  const calculationLog: CalculationLog = {
    steps,
    generatedAt: new Date().toISOString(),
    version: "1.0",
  };

  return {
    nightlyAverage: round2(nightlyAverage),
    monthlyTotal: round2(monthlyTotal),
    bookedNights,
    totalNights,
    occupancyRate: round4(occupancyRate),
    mgmtFeePercentage: round4(mgmtFeePercentage),
    mgmtFeeAmount: round2(mgmtFeeAmount),
    cleaningIncome: round2(cleaningIncome),
    taxIncome: round2(taxIncome),
    cancellationIncome: round2(cancellationIncome),
    otherIncome: round2(otherIncome),
    cleaningExpense: round2(cleaningExpense),
    hostServiceFee: round2(hostServiceFeeTotal),
    taxExpense: round2(taxExpense),
    suppliesExpense: round2(suppliesExpense),
    repairsExpense: round2(repairsExpense),
    otherExpense: round2(otherExpense),
    adjustedAmounts: round2(adjustedAmounts),
    sunstreetBalance: round2(sunstreetBalance),
    expenseTotal: round2(expenseTotal),
    grossIncome: round2(grossIncome),
    netDueToOwner: round2(netDueToOwner),
    calculationLog,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Generate or update the MonthlySnapshot for a unit/month.
 */
export async function generateSnapshot(unitId: string, year: number, month: number) {
  const data = await calculateMonthlySummary(unitId, year, month);

  const dbData = {
    ...data,
    calculationLog: data.calculationLog as any,
  };

  return prisma.monthlySnapshot.upsert({
    where: {
      unitId_year_month: { unitId, year, month },
    },
    create: {
      unitId,
      year,
      month,
      ...dbData,
      status: "DRAFT",
    },
    update: {
      ...dbData,
      status: "DRAFT",
      generatedAt: new Date(),
    },
  });
}

/**
 * Generate a Statement for an owner for a given month.
 * Aggregates all their units' snapshots.
 */
export async function generateStatement(ownerId: string, year: number, month: number) {
  // Get all active units for this owner
  const units = await prisma.unit.findMany({
    where: { ownerId, isActive: true },
  });

  // Generate/update snapshots for each unit
  const snapshots = await Promise.all(
    units.map((unit) => generateSnapshot(unit.id, year, month))
  );

  const totalDueToOwner = snapshots.reduce(
    (sum, s) => sum + Number(s.netDueToOwner),
    0
  );
  const totalGrossIncome = snapshots.reduce(
    (sum, s) => sum + Number(s.grossIncome),
    0
  );
  const totalMgmtFees = snapshots.reduce(
    (sum, s) => sum + Number(s.mgmtFeeAmount),
    0
  );

  // Upsert the statement
  const statement = await prisma.statement.upsert({
    where: {
      ownerId_year_month: { ownerId, year, month },
    },
    create: {
      ownerId,
      year,
      month,
      totalDueToOwner,
      totalGrossIncome,
      totalMgmtFees,
      status: "DRAFT",
    },
    update: {
      totalDueToOwner,
      totalGrossIncome,
      totalMgmtFees,
      status: "DRAFT",
    },
  });

  // Link snapshots to statement
  await prisma.monthlySnapshot.updateMany({
    where: {
      id: { in: snapshots.map((s) => s.id) },
    },
    data: { statementId: statement.id },
  });

  return statement;
}
