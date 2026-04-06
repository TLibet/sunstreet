import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@sunstreet.com" },
    update: {},
    create: {
      email: "admin@sunstreet.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create owner: Weidenbacher
  const owner1 = await prisma.owner.upsert({
    where: { id: "owner-weidenbacher" },
    update: {},
    create: {
      id: "owner-weidenbacher",
      name: "Weidenbacher",
      email: "weidenbacher@example.com",
      phone: "555-0100",
      address: "123 Beach Rd, Destin, FL",
    },
  });

  // Create owner user
  const ownerPassword = await hash("owner123", 12);
  await prisma.user.upsert({
    where: { email: "weidenbacher@example.com" },
    update: {},
    create: {
      email: "weidenbacher@example.com",
      name: "Weidenbacher",
      passwordHash: ownerPassword,
      role: "OWNER",
      ownerId: owner1.id,
    },
  });

  // Create units for Weidenbacher
  const unit144 = await prisma.unit.upsert({
    where: { unitNumber: "144" },
    update: {},
    create: {
      unitNumber: "144",
      name: "Weidenbacher Unit A",
      ownerId: owner1.id,
      address: "144 Beach Rd, Destin, FL",
    },
  });

  const unit103 = await prisma.unit.upsert({
    where: { unitNumber: "103" },
    update: {},
    create: {
      unitNumber: "103",
      name: "Weidenbacher Unit B",
      ownerId: owner1.id,
      address: "103 Beach Rd, Destin, FL",
    },
  });

  // Set management fee configs (15%)
  for (const unit of [unit144, unit103]) {
    const existing = await prisma.managementFeeConfig.findFirst({
      where: { unitId: unit.id, effectiveTo: null },
    });
    if (!existing) {
      await prisma.managementFeeConfig.create({
        data: {
          unitId: unit.id,
          percentage: 0.15,
          effectiveFrom: new Date("2024-01-01"),
          createdBy: admin.id,
          notes: "Initial 15% management fee",
        },
      });
    }
  }

  // Create sample bookings for Unit 144 (from spreadsheet data)
  const sampleBookings = [
    // February 2026
    {
      unitId: unit144.id,
      guestName: "Feb Guest 1",
      checkIn: new Date("2026-02-14"),
      checkOut: new Date("2026-02-16"),
      source: "AIRBNB" as const,
      baseAmount: 354,
      cleaningFee: 200,
      hostServiceFee: 85.87,
      passThroughTax: 27.70,
      payout: 468.13,
      nightlyRates: [
        { date: "2026-02-14", rate: 177 },
        { date: "2026-02-15", rate: 177 },
      ],
    },
    {
      unitId: unit144.id,
      guestName: "Feb Guest 2",
      checkIn: new Date("2026-02-20"),
      checkOut: new Date("2026-02-22"),
      source: "AIRBNB" as const,
      baseAmount: 319,
      cleaningFee: 200,
      hostServiceFee: 80.45,
      passThroughTax: 25.95,
      payout: 438.55,
      nightlyRates: [
        { date: "2026-02-20", rate: 142 },
        { date: "2026-02-21", rate: 177 },
      ],
    },
    {
      unitId: unit144.id,
      guestName: "Feb Guest 3",
      checkIn: new Date("2026-02-27"),
      checkOut: new Date("2026-02-28"),
      source: "AIRBNB" as const,
      baseAmount: 319,
      cleaningFee: 200,
      hostServiceFee: 80.45,
      passThroughTax: 25.95,
      payout: 438.55,
      nightlyRates: [
        { date: "2026-02-27", rate: 142 },
        { date: "2026-02-28", rate: 177 },
      ],
    },
    // March 2026
    {
      unitId: unit144.id,
      guestName: "Mar Guest 1",
      checkIn: new Date("2026-03-06"),
      checkOut: new Date("2026-03-11"),
      source: "VRBO" as const,
      baseAmount: 1065,
      cleaningFee: 290,
      hostServiceFee: 210.03,
      passThroughTax: 67.75,
      payout: 1145,
      nightlyRates: [
        { date: "2026-03-06", rate: 213 },
        { date: "2026-03-07", rate: 213 },
        { date: "2026-03-08", rate: 213 },
        { date: "2026-03-09", rate: 213 },
        { date: "2026-03-10", rate: 213 },
      ],
    },
    {
      unitId: unit144.id,
      guestName: "Mar Guest 2",
      checkIn: new Date("2026-03-15"),
      checkOut: new Date("2026-03-22"),
      source: "AIRBNB" as const,
      baseAmount: 2898,
      cleaningFee: 290,
      hostServiceFee: 429.97,
      passThroughTax: 138.70,
      payout: 2758,
      nightlyRates: [
        { date: "2026-03-15", rate: 414 },
        { date: "2026-03-16", rate: 414 },
        { date: "2026-03-17", rate: 414 },
        { date: "2026-03-18", rate: 414 },
        { date: "2026-03-19", rate: 414 },
        { date: "2026-03-20", rate: 414 },
        { date: "2026-03-21", rate: 414 },
      ],
    },
    {
      unitId: unit144.id,
      guestName: "Mar Guest 3",
      checkIn: new Date("2026-03-22"),
      checkOut: new Date("2026-03-29"),
      source: "AIRBNB" as const,
      baseAmount: 2485,
      cleaningFee: 290,
      hostServiceFee: 320.08,
      passThroughTax: 103.25,
      payout: 2455,
      nightlyRates: [
        { date: "2026-03-22", rate: 105 },
        { date: "2026-03-23", rate: 355 },
        { date: "2026-03-24", rate: 355 },
        { date: "2026-03-25", rate: 355 },
        { date: "2026-03-26", rate: 355 },
        { date: "2026-03-27", rate: 355 },
        { date: "2026-03-28", rate: 355 },
      ],
    },
    {
      unitId: unit144.id,
      guestName: "Mar Guest 4",
      checkIn: new Date("2026-03-29"),
      checkOut: new Date("2026-03-31"),
      source: "AIRBNB" as const,
      baseAmount: 472,
      cleaningFee: 290,
      hostServiceFee: 210.03,
      passThroughTax: 67.75,
      payout: 552,
      nightlyRates: [
        { date: "2026-03-29", rate: 236 },
        { date: "2026-03-30", rate: 236 },
      ],
    },
  ];

  for (const booking of sampleBookings) {
    await prisma.booking.upsert({
      where: {
        id: `seed-${booking.guestName?.replace(/\s/g, "-").toLowerCase()}`,
      },
      update: booking,
      create: {
        id: `seed-${booking.guestName?.replace(/\s/g, "-").toLowerCase()}`,
        ...booking,
        status: "CONFIRMED",
      },
    });
  }

  // Create sample adjustments for March 2026
  await prisma.adjustment.upsert({
    where: { id: "seed-adj-mar-cleaning" },
    update: {},
    create: {
      id: "seed-adj-mar-cleaning",
      unitId: unit144.id,
      month: 3,
      year: 2026,
      category: "ADJUSTED_AMOUNT",
      description: "Rate adjustment",
      amount: -250,
      createdBy: admin.id,
    },
  });

  console.log("Seeding complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin: admin@sunstreet.com / admin123");
  console.log("  Owner: weidenbacher@example.com / owner123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
