"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import { Archive, Calendar, LayoutList, UserPlus } from "lucide-react";

const navItems = [
  { href: "/konsey", label: "Konsey", icon: LayoutList },
  { href: "/hasta-ekle", label: "Hasta Ekle", icon: UserPlus },
  { href: "/arsiv", label: "Arşiv", icon: Archive },
  { href: "/konsey/oturum", label: "Oturum", icon: Calendar, adminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN",
  );

  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobil navigasyon">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/konsey" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-200",
              isActive ? "text-glow" : "text-text-secondary",
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
