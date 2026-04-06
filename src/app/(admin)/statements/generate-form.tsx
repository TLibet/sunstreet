"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { generateStatements, generateUnitStatementAction } from "./actions";

type Owner = { id: string; name: string };
type Unit = { id: string; unitNumber: string; name: string };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function GenerateStatementsForm({ owners, units }: { owners: Owner[]; units: Unit[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"owner" | "unit">("owner");
  const now = new Date();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    if (mode === "unit") {
      await generateUnitStatementAction(formData);
    } else {
      await generateStatements(formData);
    }
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#B8963A]"
      >
        <FileText className="h-4 w-4" />
        Generate Statement
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#2D3028]">Generate Statement</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="space-y-2">
            <Label className="text-[#6B7862]">Generate by</Label>
            <div className="flex rounded-lg border border-[#E2DED6] overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("owner")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "owner"
                    ? "bg-[#7D8B73] text-white"
                    : "bg-white text-[#6B7862] hover:bg-[#E8ECE5]"
                }`}
              >
                By Owner
              </button>
              <button
                type="button"
                onClick={() => setMode("unit")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "unit"
                    ? "bg-[#7D8B73] text-white"
                    : "bg-white text-[#6B7862] hover:bg-[#E8ECE5]"
                }`}
              >
                By Unit
              </button>
            </div>
          </div>

          {/* Owner or Unit selector */}
          {mode === "owner" ? (
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Owner</Label>
              <Select name="ownerId" defaultValue="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Unit</Label>
              <Select name="unitId" required>
                <SelectTrigger><SelectValue placeholder="Select a unit" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unitNumber} - {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#6B7862]">Month</Label>
              <Select name="month" defaultValue={String(now.getMonth() + 1)}>
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
              <Input name="year" type="number" defaultValue={now.getFullYear()} />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#C9A84C] hover:bg-[#B8963A] text-white"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
