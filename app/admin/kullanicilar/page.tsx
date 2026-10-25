import { Suspense } from "react";
import { AdminUsersPage } from "@/components/admin/admin-users-page";

export default function AdminUsersRoute() {
  return (
    <Suspense fallback={<p className="text-text-secondary">Yükleniyor…</p>}>
      <AdminUsersPage />
    </Suspense>
  );
}
