"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import {
  Archive,
  LayoutList,
  LogOut,
  Menu,
  Settings,
  UserPlus,
  UsersRound,
  X,
  Calendar,
} from "lucide-react";
import { SidebarQuickConsults } from "@/components/konsey/sidebar-quick-consults";

const mainNav = [
  { href: "/konsey", label: "Konsey Listesi", icon: LayoutList },
  { href: "/hasta-ekle", label: "Hasta Ekle", icon: UserPlus },
  { href: "/arsiv", label: "Arşiv", icon: Archive },
  { href: "/konsey/oturum", label: "Oturum Yönetimi", icon: Calendar, adminOnly: true },
];

const adminNav = [
  { href: "/admin", label: "Yönetim Paneli", icon: Settings, adminOnly: true },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase("tr-TR");
  }
  return name.slice(0, 2).toLocaleUpperCase("tr-TR");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    ...mainNav.filter((item) => !item.adminOnly || user?.role === "ADMIN"),
    ...adminNav.filter((item) => !item.adminOnly || user?.role === "ADMIN"),
  ];

  function isActive(href: string) {
    if (href === "/konsey") {
      return (
        pathname === "/konsey" ||
        (pathname.startsWith("/konsey/") &&
          pathname !== "/konsey/oturum" &&
          !pathname.includes("/yazdir") &&
          !pathname.includes("/sonuc"))
      );
    }
    if (href === "/hasta-ekle") {
      return pathname === "/hasta-ekle";
    }
    if (href === "/profil") {
      return pathname === "/profil";
    }
    if (href === "/admin") {
      return pathname.startsWith("/admin");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="app-mobile-header">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-2"
          aria-label="Menü"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <span className="text-[17px] font-semibold text-text-primary">Konsey</span>
        <div className="ml-auto">
          <NotificationBell placement="header" />
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "app-sidebar",
          mobileOpen && "app-sidebar-mobile-open",
        )}
      >
        <div className="flex h-12 items-center gap-2.5 border-b border-border px-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent">
            <UsersRound className="size-[18px]" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="app-sidebar-label min-w-0">
            <p className="text-[17px] font-semibold leading-tight text-text-primary">
              Konsey
            </p>
            <p className="text-[13px] leading-tight text-text-secondary">Sistemi</p>
          </div>
          <div className="app-sidebar-label ml-auto hidden lg:block">
            <NotificationBell placement="sidebar" />
          </div>
        </div>

        <nav className="app-sidebar-nav">
          <p className="app-nav-group-label">Ana Menü</p>
          {navItems
            .filter((item) => item.href !== "/admin")
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn("app-nav-link", active && "app-nav-link-active")}
                >
                  <Icon className="app-nav-icon" />
                  <span className="app-nav-text">{item.label}</span>
                </Link>
              );
            })}

          {user?.role === "ADMIN" && (
            <>
              <p className="app-nav-group-label mt-6">Yönetim</p>
              {adminNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn("app-nav-link", active && "app-nav-link-active")}
                  >
                    <Icon className="app-nav-icon" />
                    <span className="app-nav-text">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          {user && (
            <div className="app-sidebar-label mt-6">
              <SidebarQuickConsults
                userBranch={user.branch}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          )}
        </nav>

        <div className="app-sidebar-footer">
          {!isLoading && user && (
            <div className="flex items-center gap-2.5">
              <Link
                href="/profil"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-surface-2",
                  pathname === "/profil" && "bg-accent-subtle",
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-[12px] font-semibold text-accent">
                  {getInitials(user.name)}
                </div>
                <div className="app-user-details min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-text-primary">
                    {user.name}
                  </p>
                  <p className="truncate text-[13px] text-text-secondary">
                    {user.branch}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-all duration-150 ease hover:bg-surface-2 hover:text-text-primary"
                title="Çıkış yap"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
