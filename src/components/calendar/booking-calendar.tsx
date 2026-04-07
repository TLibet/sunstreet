"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NightlyRate } from "@/types";

type CalendarBooking = {
  id: string;
  guestName: string | null;
  source: string;
  checkIn: string;
  checkOut: string;
  nightlyRates: NightlyRate[] | null;
  baseAmount: string;
  status: string;
};

type CalendarDay = {
  date: string;
  dayOfMonth: number;
  dayOfWeek: string;
  booking: CalendarBooking | null;
  rate: number | null;
};

const SOURCE_COLORS: Record<string, string> = {
  AIRBNB: "bg-red-50 border-red-200 text-red-800",
  VRBO: "bg-blue-50 border-blue-200 text-blue-800",
  MISTERBNB: "bg-purple-50 border-purple-200 text-purple-800",
  DIRECT: "bg-green-50 border-green-200 text-green-800",
  OWNER_HOLD: "bg-yellow-50 border-yellow-200 text-yellow-800",
  MAINTENANCE: "bg-gray-100 border-gray-300 text-gray-600",
  MAJOR_HOLIDAY: "bg-orange-50 border-orange-200 text-orange-800",
  OTHER: "bg-gray-50 border-gray-200 text-gray-600",
};

const SOURCE_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb",
  VRBO: "VRBO",
  MISTERBNB: "MisterBNB",
  DIRECT: "Direct",
  OWNER_HOLD: "Owner Hold",
  MAINTENANCE: "Maintenance",
  MAJOR_HOLIDAY: "Holiday",
  OTHER: "Other",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildCalendarDays(
  year: number,
  month: number,
  bookings: CalendarBooking[]
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = DAY_NAMES[dateObj.getDay()];

    // Find booking covering this day (check-in <= date < check-out)
    let matchedBooking: CalendarBooking | null = null;
    let rate: number | null = null;

    for (const booking of bookings) {
      if (booking.status === "CANCELLED") continue;
      const checkIn = booking.checkIn.split("T")[0];
      const checkOut = booking.checkOut.split("T")[0];

      if (date >= checkIn && date < checkOut) {
        matchedBooking = booking;

        // Try to get rate from nightlyRates
        if (booking.nightlyRates) {
          const nightlyRate = booking.nightlyRates.find(
            (nr: NightlyRate) => nr.date === date
          );
          if (nightlyRate) rate = nightlyRate.rate;
        }

        // Fallback: calculate uniform rate
        if (rate === null && Number(booking.baseAmount) > 0) {
          const ciDate = new Date(checkIn);
          const coDate = new Date(checkOut);
          const nights = Math.round(
            (coDate.getTime() - ciDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (nights > 0) rate = Number(booking.baseAmount) / nights;
        }
        break;
      }
    }

    days.push({ date, dayOfMonth: day, dayOfWeek, booking: matchedBooking, rate });
  }

  return days;
}

type Props = {
  unitId: string;
  bookings: CalendarBooking[];
  mgmtFeePercentage?: number;
  initialMonth?: number;
  initialYear?: number;
};

export function BookingCalendar({
  unitId,
  bookings,
  mgmtFeePercentage = 0.15,
  initialMonth,
  initialYear,
}: Props) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(initialMonth || now.getMonth() + 1);
  const [year, setYear] = useState(initialYear || now.getFullYear());

  const calendarDays = buildCalendarDays(year, month, bookings);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  // Summary calculations
  const bookedDays = calendarDays.filter(
    (d) =>
      d.booking &&
      d.booking.source !== "OWNER_HOLD" &&
      d.booking.source !== "MAINTENANCE"
  );
  const totalRevenue = bookedDays.reduce((sum, d) => sum + (d.rate || 0), 0);
  const avgNightly =
    bookedDays.length > 0 ? totalRevenue / bookedDays.length : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SOURCE_LABELS).map(([key, label]) => (
          <Badge key={key} variant="outline" className={cn("text-xs", SOURCE_COLORS[key])}>
            {label}
          </Badge>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[60px_50px_1fr_100px] bg-gray-100 text-xs font-medium text-gray-600">
          <div className="px-3 py-2">Day</div>
          <div className="px-3 py-2">DOW</div>
          <div className="px-3 py-2">Booking</div>
          <div className="px-3 py-2 text-right">Rate</div>
        </div>

        {/* Day rows */}
        {calendarDays.map((day) => {
          const isWeekend = day.dayOfWeek === "Fri" || day.dayOfWeek === "Sat";
          const colorClass = day.booking
            ? SOURCE_COLORS[day.booking.source] || SOURCE_COLORS.OTHER
            : "";

          return (
            <div
              key={day.date}
              onClick={day.booking ? () => router.push(`/bookings/${day.booking!.id}`) : undefined}
              className={cn(
                "grid grid-cols-[60px_50px_1fr_100px] border-t text-sm",
                day.booking ? `${colorClass} cursor-pointer hover:brightness-95 transition-all` : isWeekend ? "bg-gray-50" : "bg-white"
              )}
            >
              <div className="px-3 py-1.5 font-medium">{day.dayOfMonth}</div>
              <div
                className={cn(
                  "px-3 py-1.5 text-xs",
                  isWeekend ? "font-semibold" : "text-gray-500"
                )}
              >
                {day.dayOfWeek}
              </div>
              <div className="px-3 py-1.5 truncate">
                {day.booking ? (
                  <span className="text-xs">
                    {day.booking.guestName || SOURCE_LABELS[day.booking.source]}
                    <span className="ml-2 text-gray-400">
                      ({SOURCE_LABELS[day.booking.source]})
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">-</span>
                )}
              </div>
              <div className="px-3 py-1.5 text-right font-mono text-xs">
                {day.rate !== null ? `$${day.rate.toFixed(0)}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 rounded-lg border p-4 bg-white">
        <div>
          <p className="text-xs text-[#8E9B85]">Booked Nights</p>
          <p className="text-lg font-bold text-[#2D3028]">{bookedDays.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#8E9B85]">Monthly Total</p>
          <p className="text-lg font-bold text-[#2D3028]">${totalRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-[#8E9B85]">Nightly Average</p>
          <p className="text-lg font-bold text-[#2D3028]">${avgNightly.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-[#8E9B85]">Mgmt Fees ({(mgmtFeePercentage * 100).toFixed(0)}%)</p>
          <p className="text-lg font-bold text-[#2D3028]">${(totalRevenue * mgmtFeePercentage).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
