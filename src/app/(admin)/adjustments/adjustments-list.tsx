"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { updateAdjustment, deleteAdjustment } from "./actions";

type Adjustment = {
  id: string;
  unitId: string;
  unitNumber: string;
  unitName: string;
  month: number;
  year: number;
  category: string;
  categoryLabel: string;
  description: string;
  amount: number;
  createdAt: string;
};

type Unit = { id: string; unitNumber: string; name: string };

const CATEGORIES = [
  { value: "CLEANING_EXPENSE", label: "Cleaning Expense" },
  { value: "SUPPLIES_RESTOCK", label: "Supplies/Restock" },
  { value: "REPAIRS_MAINTENANCE", label: "Repairs/Maintenance" },
  { value: "TAX_EXPENSE", label: "Tax Expense" },
  { value: "CANCELLATION_INCOME", label: "Cancellation Income" },
  { value: "ADJUSTED_AMOUNT", label: "Adjusted Amount" },
  { value: "SUNSTREET_BALANCE", label: "S.Street Balance" },
  { value: "OTHER_INCOME", label: "Other Income" },
  { value: "OTHER_EXPENSE", label: "Other Expense" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AdjustmentsList({ adjustments, units }: { adjustments: Adjustment[]; units: Unit[] }) {
  const [editAdj, setEditAdj] = useState<Adjustment | null>(null);
  const [deleteAdj, setDeleteAdj] = useState<Adjustment | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate(formData: FormData) {
    if (!editAdj) return;
    setLoading(true);
    await updateAdjustment(editAdj.id, formData);
    setLoading(false);
    setEditAdj(null);
  }

  async function handleDelete() {
    if (!deleteAdj) return;
    setLoading(true);
    await deleteAdjustment(deleteAdj.id);
    setLoading(false);
    setDeleteAdj(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028]">Recent Adjustments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8ECE5] bg-[#FAFAF7]">
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Unit</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-[#6B7862]">Description</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-[#6B7862]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE5]">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#2D3028]">{adj.unitNumber}</td>
                    <td className="px-4 py-3 text-[#6B7862]">{MONTHS[adj.month - 1]} {adj.year}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{adj.categoryLabel}</Badge></td>
                    <td className="px-4 py-3 text-[#6B7862]">{adj.description}</td>
                    <td className={`px-4 py-3 text-right font-mono ${adj.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                      ${adj.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-[#C9A84C]" onClick={() => setEditAdj(adj)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-red-600" onClick={() => setDeleteAdj(adj)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {adjustments.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-[#8E9B85]">No adjustments yet. Add one using the form.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editAdj} onOpenChange={(open) => { if (!open) setEditAdj(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#2D3028]">Edit Adjustment</DialogTitle></DialogHeader>
          {editAdj && (
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Unit</Label>
                <select name="unitId" defaultValue={editAdj.unitId} className="w-full h-10 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]">
                  {units.map((u) => <option key={u.id} value={u.id}>{u.unitNumber} - {u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#6B7862]">Month</Label>
                  <select name="month" defaultValue={String(editAdj.month)} className="w-full h-10 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]">
                    {MONTHS.map((name, i) => <option key={i + 1} value={String(i + 1)}>{name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#6B7862]">Year</Label>
                  <Input name="year" type="number" defaultValue={editAdj.year} className="border-[#E2DED6]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Category</Label>
                <select name="category" defaultValue={editAdj.category} className="w-full h-10 rounded-md border border-[#E2DED6] bg-white px-3 text-sm text-[#2D3028] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Description</Label>
                <Input name="description" defaultValue={editAdj.description} required className="border-[#E2DED6]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Amount</Label>
                <Input name="amount" type="number" step="0.01" defaultValue={editAdj.amount} required className="border-[#E2DED6]" />
                <p className="text-xs text-[#8E9B85]">Positive = income, Negative = expense</p>
              </div>
              <Button type="submit" className="w-full bg-[#C9A84C] hover:bg-[#B8963A] text-white" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteAdj} onOpenChange={(open) => { if (!open) setDeleteAdj(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#2D3028]">Delete Adjustment</DialogTitle></DialogHeader>
          {deleteAdj && (
            <>
              <p className="text-sm text-[#6B7862]">Are you sure you want to delete this adjustment?</p>
              <p className="text-sm font-medium text-[#2D3028]">
                Unit {deleteAdj.unitNumber} - {deleteAdj.description} ({deleteAdj.categoryLabel}): ${deleteAdj.amount.toFixed(2)}
              </p>
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" onClick={() => setDeleteAdj(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
