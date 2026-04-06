"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

type Unit = { id: string; unitNumber: string; name: string };

export function BookingsFilter({ units, selectedUnitId }: { units: Unit[]; selectedUnitId?: string }) {
  const router = useRouter();
  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  function selectUnit(unitId: string) {
    if (unitId === "all") {
      router.push("/bookings");
    } else {
      router.push(`/bookings?unit=${unitId}`);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-[#6B7862]">Filter by unit:</label>
      <select
        value={selectedUnitId || "all"}
        onChange={(e) => selectUnit(e.target.value)}
        className="h-9 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
      >
        <option value="all">All Units</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.unitNumber} - {u.name}
          </option>
        ))}
      </select>

      {selectedUnit && (
        <button
          onClick={() => router.push("/bookings")}
          className="flex items-center gap-1 rounded-full bg-[#E8ECE5] px-3 py-1 text-xs font-medium text-[#6B7862] hover:bg-[#D4DBC] transition-colors"
        >
          Unit {selectedUnit.unitNumber}
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
