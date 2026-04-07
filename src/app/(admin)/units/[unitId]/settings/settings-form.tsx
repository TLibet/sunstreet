"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Owner = { id: string; name: string };

export function UnitSettingsForm({
  unitId,
  currentOwnerId,
  currentFee,
  currentCleaningFee,
  owners,
}: {
  unitId: string;
  currentOwnerId: string;
  currentFee: string;
  currentCleaningFee: string;
  owners: Owner[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newFee, setNewFee] = useState("");
  const [cleaningFee, setCleaningFee] = useState(currentCleaningFee);
  const [cleaningSaved, setCleaningSaved] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(currentOwnerId);
  const [ownerSaved, setOwnerSaved] = useState(false);

  async function handleUpdateFee(e: React.FormEvent) {
    e.preventDefault();
    if (!newFee) return;
    setLoading(true);

    const res = await fetch(`/api/units/${unitId}/fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentage: parseFloat(newFee) }),
    });

    if (res.ok) {
      router.push(`/units/${unitId}`);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUpdateOwner(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOwnerSaved(false);

    const res = await fetch(`/api/units/${unitId}/owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: selectedOwner }),
    });

    if (res.ok) {
      setOwnerSaved(true);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUpdateCleaningFee(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCleaningSaved(false);

    const res = await fetch(`/api/units/${unitId}/cleaning-fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleaningFee: parseFloat(cleaningFee) }),
    });

    if (res.ok) {
      setCleaningSaved(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Owner Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028]">Owner Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateOwner} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Owner</Label>
              <select
                value={selectedOwner}
                onChange={(e) => { setSelectedOwner(e.target.value); setOwnerSaved(false); }}
                className="w-full h-10 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <p className="text-xs text-[#8E9B85]">
                Changing the owner will move this unit to the selected owner. Statements will be generated under the new owner.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                className="bg-[#C9A84C] hover:bg-[#B8963A] text-white"
                disabled={loading || selectedOwner === currentOwnerId}
              >
                {loading ? "Saving..." : "Update Owner"}
              </Button>
              {ownerSaved && (
                <span className="text-sm text-green-600">Owner updated successfully</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Management Fee */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028]">Management Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateFee} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">New Management Fee Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder={currentFee || "15"}
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  className="w-32 border-[#E2DED6] focus:border-[#C9A84C] focus:ring-[#C9A84C]"
                />
                <span className="text-[#8E9B85]">%</span>
              </div>
              <p className="text-xs text-[#8E9B85]">
                Current rate: {currentFee || "Not set"}%. The new rate applies to future calculations only.
              </p>
            </div>
            <Button
              type="submit"
              className="bg-[#C9A84C] hover:bg-[#B8963A] text-white"
              disabled={loading || !newFee}
            >
              {loading ? "Updating..." : "Update Fee"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Default Cleaning Fee */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028]">Default Cleaning Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCleaningFee} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Cleaning Fee Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-[#8E9B85]">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="250.00"
                  value={cleaningFee}
                  onChange={(e) => { setCleaningFee(e.target.value); setCleaningSaved(false); }}
                  className="w-40 border-[#E2DED6] focus:border-[#C9A84C] focus:ring-[#C9A84C]"
                />
              </div>
              <p className="text-xs text-[#8E9B85]">
                Used to detect Special Offer bookings. When a booking has no cleaning fee, it is treated as a Special Offer
                and this amount is subtracted from the total before calculating nightly rates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                className="bg-[#C9A84C] hover:bg-[#B8963A] text-white"
                disabled={loading || !cleaningFee}
              >
                {loading ? "Saving..." : "Update Cleaning Fee"}
              </Button>
              {cleaningSaved && (
                <span className="text-sm text-green-600">Cleaning fee updated</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
