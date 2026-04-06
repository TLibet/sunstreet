import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const properties = [
  { uuid: "1e220403-5e52-49f5-9593-0bc5f9dec863", name: "1st Ave - Nash - TN (K)", number: "1018", address: "1018 1st Avenue North, Nashville, TN 37201" },
  { uuid: "c4fcd916-195a-4321-808b-418498c392c9", name: "3rd Ave - Columbia - TN (K)", number: "105-3rd", address: "105 3rd Avenue, Columbia, TN 38401" },
  { uuid: "bf9c0f0b-2d43-4df8-a514-f6f1fb6f5335", name: "Old Hickory - Nash - TN (K)", number: "2101-7", address: "2101 Dabbs Avenue #7, Nashville, TN 37138" },
  { uuid: "370b7a81-f317-4ae4-8add-89d8ee2dd3b1", name: "Riverside - Columbia - TN (K)", number: "105-R", address: "105 Riverside Drive, Columbia, TN 38401" },
  { uuid: "490544bc-b25c-458c-a18f-7715894c2357", name: "4H - FL (K)", number: "4H", address: "3799 East County Highway 30A, Santa Rosa Beach, FL 32459" },
  { uuid: "837d60d7-8e86-4b95-b615-180a68164164", name: "154 - FL (K)", number: "154", address: "198 Somerset Bridge Road #154, Santa Rosa Beach, FL 32459" },
  { uuid: "a94f35b1-d512-42cc-afb9-0cb537544345", name: "D3 - FL (K)", number: "D3", address: "3604 East County Highway 30A D3, Santa Rosa Beach, FL 32459" },
  { uuid: "974ff36e-63d3-4a52-9f66-ae688585ed12", name: "86 Blue Mountain (FL)", number: "86-BM", address: "86 Crescent Road, Santa Rosa Beach, FL 32459" },
  { uuid: "dd90e476-2c8c-47c5-a8b1-837fc80331eb", name: "201 - Franklin TN", number: "201", address: "612 West Main Street Apt 201, Franklin, TN 37064" },
  { uuid: "d02e4845-13e4-434e-8bc5-97f2c3ab1405", name: "203 - Franklin TN", number: "203", address: "612 West Main Street #203, Franklin, TN 37064" },
  { uuid: "0e5ef4bc-f3f0-463b-b240-58c0dbed3eb3", name: "Downtown Nashville Getaway", number: "1207-J", address: "1207 Joseph Avenue, Nashville, TN 37207" },
  { uuid: "b3884f76-58dc-47f6-8683-ab40d9eb6cd9", name: "Purple Palace - Columbia TN", number: "105-6th", address: "105 6th Avenue, Columbia, TN 38401" },
  { uuid: "abec67e6-d45b-42e3-aa5f-58505a31e870", name: "The June Carter", number: "1023-D", address: "1023 Dickerson Pike, Nashville, TN 37207" },
  { uuid: "20a9b565-1610-4981-9ba4-dabd30d90e41", name: "127 - FL", number: "127", address: "198 Somerset Bridge Road #127, Santa Rosa Beach, FL 32459" },
  { uuid: "5cb8fbb0-7759-403d-94a9-0352e63f3ea9", name: "202 - Franklin TN", number: "202", address: "612 West Main Street #202, Franklin, TN 37064" },
  { uuid: "ec568e66-8732-469f-8ec1-c4dc45b8917c", name: "D8 - FL", number: "D8", address: "3604 East County Highway 30A D8, Santa Rosa Beach, FL 32459" },
  { uuid: "7a3b5f61-abca-4743-877e-f473a25f41a1", name: "152 - FL", number: "152", address: "198 Somerset Bridge Road #152, Santa Rosa Beach, FL 32459" },
  { uuid: "ac19153f-e563-4a13-8c62-622e3af94952", name: "152 VRBO - FL", number: "152-V", address: "198 Somerset Bridge Road #152, Santa Rosa Beach, FL 32459" },
  { uuid: "6f1390b8-24ca-4928-b0a0-250e2c84528f", name: "Monteagle Clifftop Cabin", number: "2451-C", address: "2451 Clifftops Avenue, Monteagle, TN 37356" },
  { uuid: "c5581e0d-86fc-466f-ad78-ddc4c822fce0", name: "Seagrove Sugar Sand", number: "173-SS", address: "173 Sugar Sand Lane, Santa Rosa Beach, FL 32459" },
];

async function main() {
  // Create placeholder owner
  const unassigned = await prisma.owner.upsert({
    where: { id: "owner-unassigned" },
    update: {},
    create: {
      id: "owner-unassigned",
      name: "Unassigned",
      notes: "Auto-imported from Hospitable. Reassign to correct owner.",
    },
  });

  let created = 0;
  for (const prop of properties) {
    const existing = await prisma.unit.findFirst({
      where: { hosputableListingId: prop.uuid },
    });
    if (existing) {
      console.log("Skip (already linked):", prop.number, prop.name);
      continue;
    }

    const existingByNumber = await prisma.unit.findFirst({
      where: { unitNumber: prop.number },
    });
    if (existingByNumber) {
      console.log("Skip (number exists):", prop.number);
      continue;
    }

    const unit = await prisma.unit.create({
      data: {
        unitNumber: prop.number,
        name: prop.name,
        address: prop.address,
        hosputableListingId: prop.uuid,
        ownerId: unassigned.id,
      },
    });

    await prisma.managementFeeConfig.create({
      data: {
        unitId: unit.id,
        percentage: 0.15,
        effectiveFrom: new Date("2024-01-01"),
        createdBy: "system",
      },
    });

    console.log("Created:", prop.number, "-", prop.name);
    created++;
  }

  console.log("\nDone!", created, "units created.");
  console.log("Reassign them from Unassigned owner to their real owners in the app.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
