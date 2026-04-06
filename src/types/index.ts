import type { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    ownerId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      ownerId: string | null;
    };
  }
}

export type NightlyRate = {
  date: string; // "YYYY-MM-DD"
  rate: number;
};

export type CalculationStep = {
  step: string;
  description: string;
  inputs: Record<string, unknown>;
  result: number;
};

export type CalculationLog = {
  steps: CalculationStep[];
  generatedAt: string;
  version: string;
};
