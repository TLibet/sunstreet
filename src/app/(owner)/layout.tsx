"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, FileText, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/owner-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/owner-statements", label: "Statements", icon: FileText },
  { href: "/owner-units", label: "My Units", icon: Building2 },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="flex h-screen">
      <aside className="flex h-screen w-64 flex-col bg-[#7D8B73] shadow-xl">
        <div className="flex h-20 items-center justify-center px-4 border-b border-[#6B7862]">
          <Link href="/owner-dashboard">
            <img src="/logo.svg" alt="Sun Street Properties" className="h-14 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

        <div className="border-t border-[#6B7862] p-3">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#6B7862] text-[#F5F0E8] text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-[#F5F0E8]/80">{session?.user?.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#F5F0E8]/60 hover:bg-[#6B7862]/50 hover:text-[#F5F0E8] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#FAFAF7] p-6">{children}</main>
    </div>
  );
}
