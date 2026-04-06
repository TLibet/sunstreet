"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateStatement, generateSnapshot } from "@/lib/calculations/engine";

export async function generateStatements(formData: FormData) {
  const ownerId = formData.get("ownerId") as string;
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);

  if (ownerId === "all") {
    const owners = await prisma.owner.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    await Promise.all(
      owners.map((owner) => generateStatement(owner.id, year, month))
    );
  } else {
    await generateStatement(ownerId, year, month);
  }

  revalidatePath("/statements");
}

export async function generateUnitStatementAction(formData: FormData) {
  const unitId = formData.get("unitId") as string;
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);

  // Get the unit's owner
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { ownerId: true },
  });

  if (!unit) throw new Error("Unit not found");

  // Generate the snapshot for this unit
  const snapshot = await generateSnapshot(unitId, year, month);

  // Create or update a statement for the owner
  const statement = await prisma.statement.upsert({
    where: {
      ownerId_year_month: { ownerId: unit.ownerId, year, month },
    },
    create: {
      ownerId: unit.ownerId,
      year,
      month,
      totalDueToOwner: Number(snapshot.netDueToOwner),
      totalGrossIncome: Number(snapshot.grossIncome),
      totalMgmtFees: Number(snapshot.mgmtFeeAmount),
      status: "DRAFT",
    },
    update: {
      totalDueToOwner: Number(snapshot.netDueToOwner),
      totalGrossIncome: Number(snapshot.grossIncome),
      totalMgmtFees: Number(snapshot.mgmtFeeAmount),
      status: "DRAFT",
    },
  });

  // Link snapshot to statement
  await prisma.monthlySnapshot.update({
    where: { id: snapshot.id },
    data: { statementId: statement.id },
  });

  revalidatePath("/statements");
}

export async function finalizeStatement(statementId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.statement.update({
      where: { id: statementId },
      data: { status: "FINALIZED" },
    });

    await tx.monthlySnapshot.updateMany({
      where: { statementId },
      data: { status: "FINALIZED", finalizedAt: new Date() },
    });
  });

  revalidatePath("/statements");
  revalidatePath(`/statements/${statementId}`);
}

export async function deleteStatement(statementId: string) {
  await prisma.$transaction(async (tx) => {
    // Unlink snapshots from statement
    await tx.monthlySnapshot.updateMany({
      where: { statementId },
      data: { statementId: null, status: "DRAFT" },
    });

    // Delete the statement
    await tx.statement.delete({
      where: { id: statementId },
    });
  });

  revalidatePath("/statements");
}
