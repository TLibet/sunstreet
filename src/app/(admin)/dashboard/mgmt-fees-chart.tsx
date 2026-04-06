"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DataPoint = { month: string; fees: number };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2DED6] rounded-lg shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-[#2D3028] mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: ${entry.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

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

  const totalFees = activeData.reduce((sum, d) => sum + d.fees, 0);

  // Add running average to data
  let cumSum = 0;
  const chartData = activeData.map((d, i) => {
    cumSum += d.fees;
    return { ...d, avg: Math.round((cumSum / (i + 1)) * 100) / 100 };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#C9A84C]" />
          Management Fees by Month
        </CardTitle>
        <span className="text-xs text-[#8E9B85]">
          Total: <span className="font-semibold text-[#C9A84C]">${totalFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECE5" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#8E9B85" }}
                axisLine={{ stroke: "#E2DED6" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8E9B85" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: 11, color: "#8E9B85" }}
                formatter={(value: string) => <span className="text-[#8E9B85]">{value}</span>}
              />
              <Bar
                dataKey="fees"
                name="Monthly Fees"
                fill="#C9A84C"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
                animationDuration={800}
              />
              <Line
                dataKey="avg"
                name="Running Avg"
                type="monotone"
                stroke="#7D8B73"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#7D8B73", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#7D8B73", stroke: "#fff", strokeWidth: 2 }}
                animationDuration={1200}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
