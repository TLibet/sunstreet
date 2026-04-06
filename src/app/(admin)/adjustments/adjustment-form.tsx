"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdjustment } from "./actions";

type Unit = { id: string; unitNumber: string; name: string };

const CATEGORIES = [
  { value: "CLEANING_EXPENSE", label: "Cleaning Expense" },
  { value: "SUPPLIES_RESTOCK", label: "Supplies/Restock/Repairs" },
  { value: "REPAIRS_MAINTENANCE", label: "Repairs/Maintenance" },
  { value: "TAX_EXPENSE", label: "Walton Co. Tax Expense" },
  { value: "CANCELLATION_INCOME", label: "Cancellation Income" },
  { value: "ADJUSTED_AMOUNT", label: "Adjusted Amount" },
  { value: "SUNSTREET_BALANCE", label: "S.Street Balance" },
  { value: "OTHER_INCOME", label: "Other Income" },
  { value: "OTHER_EXPENSE", label: "Other Expense" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const selectClass = "w-full h-10 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]";

export function AdjustmentForm({ units }: { units: Unit[] }) {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await createAdjustment(formData);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-[#2D3028]">Add Adjustment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#6B7862]">Unit</Label>
            <select name="unitId" required defaultValue="" className={selectClass}>
              <option value="" disabled>Select unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.unitNumber} - {u.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Month</Label>
              <select name="month" defaultValue={String(lastMonth)} className={selectClass}>
                {MONTHS.map((name, i) => (
                  <option key={i + 1} value={String(i + 1)}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Year</Label>
              <select name="year" defaultValue={String(lastMonthYear)} className={selectClass}>
                {[lastMonthYear - 1, lastMonthYear, lastMonthYear + 1].map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#6B7862]">Category</Label>
            <select name="category" required defaultValue="" className={selectClass}>
              <option value="" disabled>Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#6B7862]">Description</Label>
            <Input name="description" placeholder="e.g. Monthly cleaning service" required className="border-[#E2DED6] focus:border-[#C9A84C] focus:ring-[#C9A84C]" />
          </div>

          <div className="space-y-2">
            <Label className="text-[#6B7862]">Amount</Label>
            <Input name="amount" type="number" step="0.01" placeholder="Use negative for expenses (e.g. -400)" required className="border-[#E2DED6] focus:border-[#C9A84C] focus:ring-[#C9A84C]" />
            <p className="text-xs text-[#8E9B85]">Positive = income, Negative = expense</p>
          </div>

          <Button type="submit" className="w-full bg-[#C9A84C] hover:bg-[#B8963A] text-white" disabled={loading}>
            {loading ? "Adding..." : "Add Adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
