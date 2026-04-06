"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function AdjustmentForm({ units }: { units: Unit[] }) {
  const now = new Date();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await createAdjustment(formData);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Adjustment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unitId">Unit</Label>
            <Select name="unitId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unitNumber} - {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select name="month" defaultValue={String(now.getMonth() + 1)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                name="year"
                type="number"
                defaultValue={now.getFullYear()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input name="description" placeholder="e.g. Monthly cleaning service" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              name="amount"
              type="number"
              step="0.01"
              placeholder="Use negative for expenses (e.g. -400)"
              required
            />
            <p className="text-xs text-gray-400">
              Positive = income, Negative = expense
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
