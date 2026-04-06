import ExcelJS from "exceljs";
import type { Statement, MonthlySnapshot, Unit, Owner } from "@/generated/prisma/client";

type SnapshotWithUnit = MonthlySnapshot & { unit: Pick<Unit, "unitNumber" | "name"> };
type StatementWithRelations = Statement & {
  owner: Owner;
  snapshots: SnapshotWithUnit[];
};

const SOURCE_FILLS: Record<string, Partial<ExcelJS.Fill>> = {
  AIRBNB: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE4EC" } },
  VRBO: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } },
  MISTERBNB: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E5F5" } },
  DIRECT: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } },
  OWNER_HOLD: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E1" } },
  MAINTENANCE: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } },
};

export async function generateExcelStatement(
  statement: StatementWithRelations,
  bookingsByUnit: Record<string, any[]>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const period = new Date(statement.year, statement.month - 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  for (const snapshot of statement.snapshots) {
    const ws = workbook.addWorksheet(`Unit ${snapshot.unit.unitNumber}`);

    // Header
    ws.mergeCells("A1:D1");
    ws.getCell("A1").value = `Sunstreet - Owner Statement`;
    ws.getCell("A1").font = { size: 14, bold: true };

    ws.mergeCells("A2:D2");
    ws.getCell("A2").value = `${statement.owner.name} | Unit ${snapshot.unit.unitNumber} - ${snapshot.unit.name}`;

    ws.mergeCells("A3:D3");
    ws.getCell("A3").value = period;
    ws.getCell("A3").font = { bold: true, size: 12 };

    // Column widths
    ws.getColumn(1).width = 8;
    ws.getColumn(2).width = 8;
    ws.getColumn(3).width = 30;
    ws.getColumn(4).width = 15;

    // Calendar header
    const headerRow = 5;
    ws.getCell(`A${headerRow}`).value = "Day";
    ws.getCell(`B${headerRow}`).value = "DOW";
    ws.getCell(`C${headerRow}`).value = "Booking";
    ws.getCell(`D${headerRow}`).value = "Rate";

    const headerCells = ["A", "B", "C", "D"];
    headerCells.forEach((col) => {
      const cell = ws.getCell(`${col}${headerRow}`);
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    });

    // Calendar days
    const daysInMonth = new Date(statement.year, statement.month, 0).getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bookings = bookingsByUnit[snapshot.unitId] || [];

    let row = headerRow + 1;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${statement.year}-${String(statement.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(statement.year, statement.month - 1, day);
      const dow = dayNames[dateObj.getDay()];

      let bookingName = "";
      let rate: number | null = null;
      let source = "";

      for (const booking of bookings) {
        const checkIn = new Date(booking.checkIn).toISOString().split("T")[0];
        const checkOut = new Date(booking.checkOut).toISOString().split("T")[0];
        if (date >= checkIn && date < checkOut) {
          bookingName = booking.guestName || booking.source;
          source = booking.source;
          if (booking.nightlyRates) {
            const nr = (booking.nightlyRates as any[]).find((r: any) => r.date === date);
            if (nr) rate = nr.rate;
          }
          if (rate === null && Number(booking.baseAmount) > 0) {
            const ci = new Date(checkIn);
            const co = new Date(checkOut);
            const nights = Math.round((co.getTime() - ci.getTime()) / (86400000));
            if (nights > 0) rate = Number(booking.baseAmount) / nights;
          }
          break;
        }
      }

      ws.getCell(`A${row}`).value = day;
      ws.getCell(`B${row}`).value = dow;
      ws.getCell(`C${row}`).value = bookingName;
      ws.getCell(`D${row}`).value = rate;
      ws.getCell(`D${row}`).numFmt = "$#,##0.00";

      if (source && SOURCE_FILLS[source]) {
        headerCells.forEach((col) => {
          ws.getCell(`${col}${row}`).fill = SOURCE_FILLS[source] as ExcelJS.Fill;
        });
      }

      row++;
    }

    // Summary section
    row += 1;
    const summaryItems = [
      ["Monthly Total (for commission)", Number(snapshot.monthlyTotal)],
      ["# of Booked Nights", snapshot.bookedNights],
      ["Nightly Average", Number(snapshot.nightlyAverage)],
      ["Adjusted Amounts", Number(snapshot.adjustedAmounts)],
      ["Cancellation Income", Number(snapshot.cancellationIncome)],
      ["", ""],
      [`Mgmt Fee (${(Number(snapshot.mgmtFeePercentage) * 100).toFixed(0)}%)`, -Number(snapshot.mgmtFeeAmount)],
      ["Cleaning Income", Number(snapshot.cleaningIncome)],
      ["Cleaning Expense", -Number(snapshot.cleaningExpense)],
      ["Host Service Fee", -Number(snapshot.hostServiceFee)],
      ["Tax Income (offset)", Number(snapshot.taxIncome)],
      ["Tax Expense", -Number(snapshot.taxExpense)],
      ["Supplies/Restock/Repairs", -(Number(snapshot.suppliesExpense) + Number(snapshot.repairsExpense))],
      ["S.Street Balance", -Number(snapshot.sunstreetBalance)],
      ["", ""],
      ["Expense Total", -Number(snapshot.expenseTotal)],
      ["", ""],
      ["Net Total Due to Owner", Number(snapshot.netDueToOwner)],
      ["Gross Income", Number(snapshot.grossIncome)],
    ];

    for (const [label, value] of summaryItems) {
      ws.getCell(`C${row}`).value = label as string;
      ws.getCell(`C${row}`).font = { bold: label === "Net Total Due to Owner" || label === "Expense Total" };
      if (typeof value === "number") {
        ws.getCell(`D${row}`).value = value;
        ws.getCell(`D${row}`).numFmt = "$#,##0.00";
        ws.getCell(`D${row}`).font = { bold: label === "Net Total Due to Owner" || label === "Expense Total" };
      }
      row++;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
