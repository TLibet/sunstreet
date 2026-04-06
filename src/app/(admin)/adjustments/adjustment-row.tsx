"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function AdjustmentRow({ adjustment, units }: { adjustment: Adjustment; units: Unit[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    await updateAdjustment(adjustment.id, formData);
    setLoading(false);
    setEditOpen(false);
  }

  async function handleDelete() {
    setLoading(true);
    await deleteAdjustment(adjustment.id);
    setLoading(false);
    setDeleteConfirm(false);
  }

  return (
    <>
      <tr className="hover:bg-[#FAFAF7] transition-colors">
        <td className="px-4 py-3 font-medium text-[#2D3028]">{adjustment.unitNumber}</td>
        <td className="px-4 py-3 text-[#6B7862]">
          {MONTHS[adjustment.month - 1]} {adjustment.year}
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className="text-xs">{adjustment.categoryLabel}</Badge>
        </td>
        <td className="px-4 py-3 text-[#6B7862]">{adjustment.description}</td>
        <td className={`px-4 py-3 text-right font-mono ${adjustment.amount < 0 ? "text-red-600" : "text-green-600"}`}>
          ${adjustment.amount.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-[#C9A84C]" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-red-600" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#2D3028]">Edit Adjustment</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Unit</Label>
              <Select name="unitId" defaultValue={adjustment.unitId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.unitNumber} - {u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Month</Label>
                <Select name="month" defaultValue={String(adjustment.month)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#6B7862]">Year</Label>
                <Input name="year" type="number" defaultValue={adjustment.year} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Category</Label>
              <Select name="category" defaultValue={adjustment.category}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Description</Label>
              <Input name="description" defaultValue={adjustment.description} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Amount</Label>
              <Input name="amount" type="number" step="0.01" defaultValue={adjustment.amount} required />
              <p className="text-xs text-[#8E9B85]">Positive = income, Negative = expense</p>
            </div>
            <Button type="submit" className="w-full bg-[#C9A84C] hover:bg-[#B8963A] text-white" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#2D3028]">Delete Adjustment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B7862]">
            Are you sure you want to delete this adjustment?
          </p>
          <p className="text-sm font-medium text-[#2D3028]">
            Unit {adjustment.unitNumber} - {adjustment.description} ({adjustment.categoryLabel}): ${adjustment.amount.toFixed(2)}
          </p>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
