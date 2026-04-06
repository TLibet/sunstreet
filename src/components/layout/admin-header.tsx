"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/owners": "Owners",
  "/units": "Units",
  "/bookings": "Bookings",
  "/statements": "Statements",
  "/adjustments": "Adjustments",
  "/settings": "Settings",
};

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || "";

  return (
    <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#2D3028]">{pageTitle}</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#6B7862]">{session?.user?.name}</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#E8ECE5] text-[#7D8B73] text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
