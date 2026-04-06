"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateStatement } from "@/lib/calculations/engine";

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

  revalidatePath("/admin/statements");
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

  revalidatePath("/admin/statements");
  revalidatePath(`/admin/statements/${statementId}`);
}
