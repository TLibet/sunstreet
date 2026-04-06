import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HospitableSettings } from "./hospitable-settings";
import { UserManagement } from "./user-management";

export const dynamic = "force-dynamic";

async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, ownerId: true, owner: { select: { name: true } }, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getOwners() {
  return prisma.owner.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function SettingsPage() {
  const [users, owners] = await Promise.all([getUsers(), getOwners()]);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    ownerId: u.ownerId,
    ownerName: u.owner?.name || null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2D3028]">Settings</h1>
      <HospitableSettings />
      <UserManagement users={serializedUsers} owners={owners} />
    </div>
  );
}
