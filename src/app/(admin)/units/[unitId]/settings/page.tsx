"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnitSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newFee, setNewFee] = useState("");

  async function handleUpdateFee(e: React.FormEvent) {
    e.preventDefault();
    if (!newFee) return;
    setLoading(true);

    const res = await fetch(`/api/units/${params.unitId}/fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentage: parseFloat(newFee) }),
    });

    if (res.ok) {
      router.push(`/admin/units/${params.unitId}`);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/units/${params.unitId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Unit Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Management Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateFee} className="space-y-4">
            <div className="space-y-2">
              <Label>New Management Fee Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="15"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-400">
                The new rate will take effect immediately and apply to future calculations.
                Previous months will retain the old rate.
              </p>
            </div>
            <Button type="submit" disabled={loading || !newFee}>
              {loading ? "Updating..." : "Update Fee"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
