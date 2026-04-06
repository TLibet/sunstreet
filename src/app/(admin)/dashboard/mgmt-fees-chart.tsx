"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

type DataPoint = { month: string; fees: number };

export function MgmtFeesChart({ data }: { data: DataPoint[] }) {
  const activeData = data.filter((d) => d.fees > 0);

  if (activeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#C9A84C]" />
            Management Fees by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8E9B85] text-center py-8">No booking data yet.</p>
        </CardContent>
      </Card>
    );
  }

  const maxFee = Math.max(...activeData.map((d) => d.fees));
  const totalFees = activeData.reduce((sum, d) => sum + d.fees, 0);

  // Running average
  const runningAvg: number[] = [];
  let cumSum = 0;
  for (let i = 0; i < activeData.length; i++) {
    cumSum += activeData[i].fees;
    runningAvg.push(cumSum / (i + 1));
  }

  // Chart layout
  const labelHeight = 24;
  const chartTop = 10;
  const chartBottom = 200;
  const barAreaHeight = chartBottom - chartTop;
  const barPadding = 6;
  const barWidth = 36;
  const stepWidth = barWidth + barPadding;
  const svgWidth = activeData.length * stepWidth + barPadding;
  const svgHeight = chartBottom + labelHeight;

  function yPos(val: number) {
    return chartBottom - (val / maxFee) * barAreaHeight;
  }

  // Running average line path
  const avgPath = runningAvg.map((avg, i) => {
    const x = barPadding + i * stepWidth + barWidth / 2;
    const y = yPos(avg);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#C9A84C]" />
          Management Fees by Month
        </CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#C9A84C]" />
            <span className="text-[#8E9B85]">Monthly</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#7D8B73] rounded" />
            <span className="text-[#8E9B85]">Running Avg</span>
          </span>
          <span className="text-[#8E9B85]">
            Total: <span className="font-semibold text-[#C9A84C]">${totalFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto mt-2">
          <svg width={svgWidth} height={svgHeight} className="block">
            {/* Grid lines */}
            <line x1="0" y1={yPos(maxFee)} x2={svgWidth} y2={yPos(maxFee)} stroke="#E8ECE5" strokeWidth="1" />
            <line x1="0" y1={yPos(maxFee / 2)} x2={svgWidth} y2={yPos(maxFee / 2)} stroke="#E8ECE5" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1={chartBottom} x2={svgWidth} y2={chartBottom} stroke="#E2DED6" strokeWidth="1" />

            {/* Y-axis labels */}
            <text x={2} y={yPos(maxFee) - 4} fontSize="10" fill="#8E9B85" fontFamily="system-ui">${(maxFee / 1000).toFixed(1)}k</text>
            <text x={2} y={yPos(maxFee / 2) - 4} fontSize="10" fill="#8E9B85" fontFamily="system-ui">${(maxFee / 2000).toFixed(1)}k</text>

            {/* Bars */}
            {activeData.map((d, i) => {
              const barH = Math.max((d.fees / maxFee) * barAreaHeight, 3);
              const x = barPadding + i * stepWidth;
              const y = chartBottom - barH;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill="#C9A84C" opacity={0.85}>
                    <title>{d.month}: ${d.fees.toLocaleString("en-US", { minimumFractionDigits: 2 })}</title>
                  </rect>
                  {barH > 22 && (
                    <text x={x + barWidth / 2} y={y + 14} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="system-ui">
                      ${(d.fees / 1000).toFixed(1)}k
                    </text>
                  )}
                  {/* X-axis label — inside SVG, aligned to bar center */}
                  <text x={x + barWidth / 2} y={chartBottom + 16} textAnchor="middle" fontSize="10" fill="#8E9B85" fontFamily="system-ui">
                    {d.month}
                  </text>
                </g>
              );
            })}

            {/* Running average line */}
            <path d={avgPath} fill="none" stroke="#7D8B73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Average dots */}
            {runningAvg.map((avg, i) => {
              const x = barPadding + i * stepWidth + barWidth / 2;
              const y = yPos(avg);
              return <circle key={i} cx={x} cy={y} r="3" fill="#7D8B73" stroke="white" strokeWidth="1.5" />;
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
