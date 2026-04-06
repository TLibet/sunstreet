"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const unitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  name: z.string().min(1, "Name is required"),
  ownerId: z.string().min(1, "Owner is required"),
  address: z.string().optional(),
  hosputableListingId: z.string().optional(),
  mgmtFeePercentage: z.string().optional(),
});

export async function createUnit(formData: FormData) {
  const data = unitSchema.parse({
    unitNumber: formData.get("unitNumber"),
    name: formData.get("name"),
    ownerId: formData.get("ownerId"),
    address: formData.get("address"),
    hosputableListingId: formData.get("hosputableListingId"),
    mgmtFeePercentage: formData.get("mgmtFeePercentage"),
  });

  const unit = await prisma.unit.create({
    data: {
      unitNumber: data.unitNumber,
      name: data.name,
      ownerId: data.ownerId,
      address: data.address || null,
      hosputableListingId: data.hosputableListingId || null,
    },
  });

  if (data.mgmtFeePercentage) {
    const percentage = parseFloat(data.mgmtFeePercentage) / 100;
    await prisma.managementFeeConfig.create({
      data: {
        unitId: unit.id,
        percentage,
        effectiveFrom: new Date(),
        createdBy: "system",
      },
    });
  }

  revalidatePath("/units");
  revalidatePath("/owners");
}

export async function updateManagementFee(
  unitId: string,
  newPercentage: number,
  userId: string
) {
  // Close the current active config
  await prisma.managementFeeConfig.updateMany({
    where: { unitId, effectiveTo: null },
    data: { effectiveTo: new Date() },
  });

  // Create new config
  await prisma.managementFeeConfig.create({
    data: {
      unitId,
      percentage: newPercentage / 100,
      effectiveFrom: new Date(),
      createdBy: userId,
    },
  });

  revalidatePath(`/units/${unitId}`);
}
