"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/yetkisiz") {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
