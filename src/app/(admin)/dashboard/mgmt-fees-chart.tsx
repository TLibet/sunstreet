"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

type DataPoint = { month: string; fees: number };

export function MgmtFeesChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#C9A84C]" />
            Management Fees by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8E9B85] text-center py-8">
            No statements generated yet. Generate statements to see management fee trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxFee = Math.max(...data.map((d) => d.fees));
  const totalFees = data.reduce((sum, d) => sum + d.fees, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#C9A84C]" />
          Management Fees by Month
        </CardTitle>
        <span className="text-sm text-[#8E9B85]">
          Total: <span className="font-semibold text-[#C9A84C]">${totalFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48 mt-4">
          {data.map((d, i) => {
            const height = maxFee > 0 ? (d.fees / maxFee) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-[#2D3028] bg-white shadow-lg border border-[#E2DED6] rounded px-2 py-1 whitespace-nowrap">
                  ${d.fees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {/* Bar */}
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-10 rounded-t-sm bg-[#C9A84C] group-hover:bg-[#B8963A] transition-colors"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] text-[#8E9B85] mt-1">{d.month}</span>
              </div>
            );
          })}
        </div>

        {/* Y-axis reference lines */}
        <div className="flex justify-between mt-2 text-[10px] text-[#8E9B85]">
          <span>$0</span>
          <span>${maxFee.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
