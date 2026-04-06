"use server";

import { prisma } from "@/lib/prisma";
import { AdjustmentCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const adjustmentSchema = z.object({
  unitId: z.string().min(1),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  category: z.nativeEnum(AdjustmentCategory),
  description: z.string().min(1),
  amount: z.coerce.number(),
});

export async function createAdjustment(formData: FormData) {
  const data = adjustmentSchema.parse({
    unitId: formData.get("unitId"),
    month: formData.get("month"),
    year: formData.get("year"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
  });

  await prisma.adjustment.create({
    data: {
      unitId: data.unitId,
      month: data.month,
      year: data.year,
      category: data.category,
      description: data.description,
      amount: data.amount,
      createdBy: "admin",
    },
  });

  revalidatePath("/adjustments");
}

export async function deleteAdjustment(id: string) {
  await prisma.adjustment.delete({ where: { id } });
  revalidatePath("/adjustments");
}
