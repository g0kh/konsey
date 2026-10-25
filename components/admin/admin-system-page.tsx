"use client";

import { useState } from "react";
import useSWR from "swr";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-fetch";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";

export function AdminSystemPage() {
  const { user } = useCurrentUser();
  const { data: dashboard } = useSWR(
    user ? "/api/admin/dashboard" : null,
    adminFetcher(user),
  );
  const [health, setHealth] = useState<{
    checks: { label: string; status: string; message: string }[];
  } | null>(null);

  const runHealth = async () => {
    if (!user) return;
    const response = await adminFetch(user, "/api/admin/db/health");
    setHealth(await response.json());
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="section-header">Sistem Durumu</h2>
        {dashboard?.system && (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-text-secondary">Veritabanı</dt>
              <dd className="flex items-center gap-2 font-medium">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    dashboard.system.databaseConnected
                      ? "bg-status-complete"
                      : "bg-destructive",
                  )}
                />
                {dashboard.system.databaseConnected ? "Bağlı" : "Bağlantı Yok"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-text-secondary">Yanıt Süresi</dt>
              <dd className="font-medium">{dashboard.system.responseTimeMs}ms</dd>
            </div>
            <div>
              <dt className="text-sm text-text-secondary">Toplam Kayıt</dt>
              <dd className="font-medium">{dashboard.system.totalRecords}</dd>
            </div>
            <div>
              <dt className="text-sm text-text-secondary">Versiyon</dt>
              <dd className="font-medium">v{dashboard.system.version}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="card p-6">
        <h2 className="section-header">Sağlık Kontrolü</h2>
        <Button onClick={runHealth} className="mt-4">
          Tam Kontrol Çalıştır
        </Button>
        {health && (
          <ul className="mt-4 space-y-2">
            {health.checks.map((check, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span>
                  {check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗"}
                </span>
                <span>
                  <strong>{check.label}:</strong> {check.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
