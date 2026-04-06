import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { OwnerDialog } from "./owner-dialog";

export const dynamic = 'force-dynamic';

async function getOwners() {
  return prisma.owner.findMany({
    include: { _count: { select: { units: true } } },
    orderBy: { name: "asc" },
  });
}

export default async function OwnersPage() {
  const owners = await getOwners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Owners</h1>
        <OwnerDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {owners.map((owner) => (
          <Link key={owner.id} href={`/owners/${owner.id}`}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{owner.name}</CardTitle>
                  <Badge variant={owner.isActive ? "default" : "secondary"}>
                    {owner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-gray-500">
                  {owner.email && <p>{owner.email}</p>}
                  {owner.phone && <p>{owner.phone}</p>}
                  <p className="font-medium text-gray-700">
                    {owner._count.units} unit{owner._count.units !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {owners.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-12">
            No owners yet. Add your first owner to get started.
          </p>
        )}
      </div>
    </div>
  );
}
