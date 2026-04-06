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
            No booking data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter out months with $0
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
          <p className="text-sm text-[#8E9B85] text-center py-8">No management fee data to display.</p>
        </CardContent>
      </Card>
    );
  }

  const maxFee = Math.max(...activeData.map((d) => d.fees));
  const totalFees = activeData.reduce((sum, d) => sum + d.fees, 0);
  const chartHeight = 200;

  // Calculate running average
  const runningAvg: number[] = [];
  let cumSum = 0;
  for (let i = 0; i < activeData.length; i++) {
    cumSum += activeData[i].fees;
    runningAvg.push(cumSum / (i + 1));
  }

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = chartHeight;
  const barPadding = 8;
  const barWidth = Math.max(20, (svgWidth - barPadding * (activeData.length + 1)) / activeData.length);
  const usableWidth = activeData.length * (barWidth + barPadding) + barPadding;

  // Build running average line path
  const avgPath = runningAvg.map((avg, i) => {
    const x = barPadding + i * (barWidth + barPadding) + barWidth / 2;
    const y = svgHeight - (avg / maxFee) * (svgHeight - 30);
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
        <div className="relative mt-2" style={{ height: chartHeight + 40 }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-[10px] text-[#8E9B85] w-14">
            <span>${(maxFee / 1000).toFixed(1)}k</span>
            <span>${(maxFee / 2000).toFixed(1)}k</span>
            <span>$0</span>
          </div>

          {/* Chart area */}
          <div className="ml-14 overflow-x-auto">
            <svg
              viewBox={`0 0 ${usableWidth} ${svgHeight}`}
              className="w-full"
              style={{ minWidth: activeData.length * 50, height: chartHeight }}
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line x1="0" y1={svgHeight * 0.02} x2={usableWidth} y2={svgHeight * 0.02} stroke="#E8ECE5" strokeWidth="0.5" />
              <line x1="0" y1={svgHeight * 0.5} x2={usableWidth} y2={svgHeight * 0.5} stroke="#E8ECE5" strokeWidth="0.5" strokeDasharray="4" />

              {/* Bars */}
              {activeData.map((d, i) => {
                const barH = Math.max((d.fees / maxFee) * (svgHeight - 30), 3);
                const x = barPadding + i * (barWidth + barPadding);
                const y = svgHeight - barH;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={3}
                      fill="#C9A84C"
                      opacity={0.85}
                    >
                      <title>{d.month}: ${d.fees.toLocaleString("en-US", { minimumFractionDigits: 2 })}</title>
                    </rect>
                    {/* Value label on bar */}
                    {barH > 20 && (
                      <text
                        x={x + barWidth / 2}
                        y={y + 14}
                        textAnchor="middle"
                        fill="white"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui"
                      >
                        ${(d.fees / 1000).toFixed(1)}k
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Running average line */}
              <path d={avgPath} fill="none" stroke="#7D8B73" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Average dots */}
              {runningAvg.map((avg, i) => {
                const x = barPadding + i * (barWidth + barPadding) + barWidth / 2;
                const y = svgHeight - (avg / maxFee) * (svgHeight - 30);
                return <circle key={i} cx={x} cy={y} r="3" fill="#7D8B73" stroke="white" strokeWidth="1.5" />;
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex" style={{ minWidth: activeData.length * 50 }}>
              {activeData.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] text-[#8E9B85] pt-1"
                  style={{ width: barWidth + barPadding, marginLeft: i === 0 ? barPadding : 0 }}
                >
                  {d.month}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
