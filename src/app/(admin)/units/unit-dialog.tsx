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
import { Plus } from "lucide-react";
import { createUnit } from "./actions";

type Owner = { id: string; name: string };

export function UnitDialog({ owners }: { owners: Owner[] }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await createUnit(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Unit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit Number *</Label>
              <Input id="unitNumber" name="unitNumber" placeholder="e.g. 144" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgmtFeePercentage">Mgmt Fee %</Label>
              <Input
                id="mgmtFeePercentage"
                name="mgmtFeePercentage"
                type="number"
                step="0.1"
                placeholder="15"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" placeholder="Property name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner *</Label>
            <Select name="ownerId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hosputableListingId">Hospitable Listing ID</Label>
            <Input
              id="hosputableListingId"
              name="hosputableListingId"
              placeholder="UUID from Hospitable"
            />
          </div>
          <Button type="submit" className="w-full">
            Create Unit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
