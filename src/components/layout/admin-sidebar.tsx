"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/owners", label: "Owners", icon: Users },
  { href: "/units", label: "Units", icon: Building2 },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/statements", label: "Statements", icon: FileText },
  { href: "/adjustments", label: "Adjustments", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#7D8B73] shadow-xl">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center px-4 border-b border-[#6B7862]">
        <Link href="/dashboard">
          <Logo className="h-14" variant="light" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#6B7862] text-white border-l-3 border-[#C9A84C] pl-[9px]"
                  : "text-[#F5F0E8]/80 hover:bg-[#6B7862]/50 hover:text-[#F5F0E8]"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-[#C9A84C]" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-[#6B7862] p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#F5F0E8]/60 hover:bg-[#6B7862]/50 hover:text-[#F5F0E8] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
