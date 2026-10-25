"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useCurrentUser();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="border-b border-border px-4 py-4">
          <p className="text-[16px] font-semibold text-text-primary">Konsey</p>
          <p className="text-[13px] text-text-muted">Yönetim Paneli</p>
        </div>
        <nav className="admin-sidebar-nav">
          {ADMIN_NAV.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <p className="admin-nav-section-title">{section.title}</p>
              {section.items.map((item) => {
                const baseHref = item.href.split("?")[0].split("#")[0];
                const active =
                  pathname === baseHref ||
                  (baseHref !== "/admin" && pathname.startsWith(baseHref));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "admin-nav-link",
                      active && "admin-nav-link-active",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1 className="text-[18px] font-semibold text-text-primary">
            Yönetim Paneli
          </h1>
          <div className="flex items-center gap-3">
            {user && (
              <div className="text-right text-sm">
                <p className="font-medium text-text-primary">{user.name}</p>
                <p className="text-xs text-text-tertiary">{user.branch}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => logout()}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Çıkış
            </button>
            <Link
              href="/konsey"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ArrowLeft className="mr-1 size-4" />
              Sisteme Dön
            </Link>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
