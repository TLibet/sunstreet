"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const YEAR_COLORS: Record<number, { fill: string; label: string }> = {
  0: { fill: "#E2DED6", label: "" },
  1: { fill: "#8E9B85", label: "" },
  2: { fill: "#C9A84C", label: "" },
  3: { fill: "#7D8B73", label: "" },
  4: { fill: "#B8963A", label: "" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // Find previous year value for comparison
  const sorted = [...payload].sort((a: any, b: any) => a.name.localeCompare(b.name));
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2]?.value : null;
  const curr = sorted[sorted.length - 1]?.value;
  const pctChange = prev && prev > 0 ? ((curr - prev) / prev) * 100 : null;

  return (
    <div className="bg-white border border-[#E2DED6] rounded-lg shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-[#2D3028] mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: ${entry.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      ))}
      {pctChange !== null && (
        <p className={`text-xs font-semibold mt-1 ${pctChange >= 0 ? "text-green-600" : "text-red-600"}`}>
          {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}% YoY
        </p>
      )}
    </div>
  );
}

export function YearOverYearChart({ data, years }: { data: Record<string, any>[]; years: string[] }) {
  if (years.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#7D8B73]" />
            Year-over-Year Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8E9B85] text-center py-8">
            Need at least 2 years of data to compare. Keep syncing bookings!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter to only months that have data in at least one year
  const activeData = data.filter((row) => years.some((y) => row[y] > 0));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base text-[#2D3028] flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#7D8B73]" />
          Year-over-Year Revenue
        </CardTitle>
        <div className="flex items-center gap-3 text-xs text-[#8E9B85]">
          Revenue by month, compared across years
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => <span className="text-[#8E9B85]">{value}</span>}
              />
              {years.map((year, i) => (
                <Bar
                  key={year}
                  dataKey={year}
                  name={year}
                  fill={YEAR_COLORS[i % 5].fill}
                  radius={[3, 3, 0, 0]}
                  animationDuration={800 + i * 200}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
