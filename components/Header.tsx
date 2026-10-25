"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/konsey", label: "Konsey Listesi" },
  { href: "/arsiv", label: "Arşiv" },
  { href: "/konsey/oturum", label: "Oturum Yönetimi", adminOnly: true },
  { href: "/admin", label: "Yönetim", adminOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useCurrentUser();

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN",
  );

  return (
    <header className="sticky top-0 z-30 border-b border-theme-border bg-header">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link href="/konsey" className="flex shrink-0 items-center gap-2.5">
          <span
            className="flex size-6 items-center justify-center rounded-sm bg-primary"
            aria-hidden
          >
            <span className="size-2 rounded-sm bg-glow" />
          </span>
          <span className="font-display text-sm font-bold tracking-wide text-text-primary sm:text-base">
            ONKOLOJI KONSEY
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/konsey" && pathname.startsWith("/konsey/") && pathname !== "/konsey/oturum");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-tab",
                  isActive && "nav-tab-active rounded-lg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />

          {!isLoading && user && (
            <div className="hidden items-center gap-2 rounded-full border border-theme-border bg-surface px-3 py-1.5 lg:flex">
              <span className="max-w-[140px] truncate text-sm font-medium text-text-primary">
                {user.name}
              </span>
              <span className="badge badge-branch !py-0.5 !text-[10px]">
                {user.branch}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoading}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
