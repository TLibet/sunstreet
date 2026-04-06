"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteStatement } from "./actions";

type Statement = {
  id: string;
  ownerName: string;
  month: number;
  year: number;
  units: string;
  totalGrossIncome: number;
  totalMgmtFees: number;
  totalDueToOwner: number;
  status: string;
};

export function StatementsList({ statements }: { statements: Statement[] }) {
  const router = useRouter();
  const [delStmt, setDelStmt] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!delStmt) return;
    setLoading(true);
    await deleteStatement(delStmt.id);
    setLoading(false);
    setDelStmt(null);
    router.refresh();
  }

  return (
    <>
      <tbody className="divide-y divide-[#E8ECE5]">
        {statements.map((stmt) => (
          <tr key={stmt.id} className="hover:bg-[#FAFAF7] transition-colors">
            <td className="px-4 py-3 font-medium">
              <Link href={`/statements/${stmt.id}`} className="text-[#C9A84C] hover:underline">{stmt.ownerName}</Link>
            </td>
            <td className="px-4 py-3 text-[#6B7862]">
              {new Date(stmt.year, stmt.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </td>
            <td className="px-4 py-3 text-[#6B7862]">{stmt.units}</td>
            <td className="px-4 py-3 text-right font-mono text-[#2D3028]">${stmt.totalGrossIncome.toFixed(2)}</td>
            <td className="px-4 py-3 text-right font-mono text-red-600">-${stmt.totalMgmtFees.toFixed(2)}</td>
            <td className="px-4 py-3 text-right font-mono font-bold text-[#2D3028]">${stmt.totalDueToOwner.toFixed(2)}</td>
            <td className="px-4 py-3">
              <Badge variant={stmt.status === "SENT" ? "default" : stmt.status === "FINALIZED" ? "secondary" : "outline"}>{stmt.status}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8E9B85] hover:text-red-600" onClick={() => setDelStmt(stmt)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </td>
          </tr>
        ))}
        {statements.length === 0 && (
          <tr><td colSpan={8} className="px-4 py-12 text-center text-[#8E9B85]">No statements yet. Generate your first statement above.</td></tr>
        )}
      </tbody>

      <Dialog open={!!delStmt} onOpenChange={(open) => { if (!open) setDelStmt(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#2D3028]">Delete Statement</DialogTitle></DialogHeader>
          {delStmt && (
            <>
              <p className="text-sm text-[#6B7862]">Are you sure you want to delete this statement?</p>
              <p className="text-sm font-medium text-[#2D3028]">
                {delStmt.ownerName} — {new Date(delStmt.year, delStmt.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-[#6B7862]">Units: {delStmt.units} | Net Due: ${delStmt.totalDueToOwner.toFixed(2)}</p>
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" onClick={() => setDelStmt(null)}>Cancel</Button>
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
