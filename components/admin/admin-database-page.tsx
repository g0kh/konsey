"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch } from "@/lib/admin-fetch";
import { SUPER_ADMIN_BRANCHES } from "@/lib/constants";
import { useCurrentUser } from "@/lib/UserContext";

export function AdminDatabasePage() {
  const { user } = useCurrentUser();
  const isSuperAdmin =
    user?.role === "ADMIN" &&
    SUPER_ADMIN_BRANCHES.includes(user.branch as (typeof SUPER_ADMIN_BRANCHES)[number]);

  const { data: stats, mutate: refreshStats } = useSWR(
    user ? "/api/admin/db/stats" : null,
    adminFetcher(user),
    { refreshInterval: 30_000 },
  );

  const [health, setHealth] = useState<{
    checks: { id: string; label: string; status: string; message: string }[];
    ranAt: string;
  } | null>(null);
  const [sql, setSql] = useState("SELECT COUNT(*) as total FROM \"Patient\"");
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
  } | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [staleConsults, setStaleConsults] = useState<
    { id: string; patient: string; question: string; createdAt: string }[]
  >([]);

  const runHealth = async () => {
    if (!user) return;
    const response = await adminFetch(user, "/api/admin/db/health");
    setHealth(await response.json());
  };

  const runQuery = async () => {
    if (!user) return;
    const response = await adminFetch(user, "/api/admin/db/query", {
      method: "POST",
      body: JSON.stringify({ sql }),
    });
    if (!response.ok) {
      const err = (await response.json()) as { error?: string };
      toast.error(err.error ?? "Sorgu hatası");
      return;
    }
    const result = await response.json();
    setQueryResult(result);
    setQueryHistory((h) => [sql, ...h.filter((q) => q !== sql)].slice(0, 10));
  };

  const cleanupCancelled = async () => {
    if (!user || !confirm("30 günden eski iptal kayıtları silinecek. Onaylıyor musunuz?")) {
      return;
    }
    const response = await adminFetch(
      user,
      "/api/admin/db/cleanup?type=cancelled&days=30",
      { method: "DELETE" },
    );
    const result = (await response.json()) as { deleted: number };
    toast.success(`${result.deleted} kayıt silindi`);
    refreshStats();
  };

  const loadStaleConsults = async () => {
    if (!user) return;
    const response = await adminFetch(user, "/api/admin/db/cleanup");
    const data = await response.json();
    setStaleConsults(data.staleConsults ?? []);
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-header !mb-0">Tablo İstatistikleri</h2>
          <Button variant="outline" size="sm" onClick={() => refreshStats()}>
            Yenile
          </Button>
        </div>
        <div className="card overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tablo</th>
                <th>Kayıt Sayısı</th>
                <th>Son Güncelleme</th>
                <th>Disk Boyutu (yakl.)</th>
              </tr>
            </thead>
            <tbody>
              {stats?.tables?.map(
                (row: {
                  table: string;
                  count: number;
                  lastUpdated: string | null;
                  approxSizeKb: number;
                }) => (
                  <tr key={row.table}>
                    <td>{row.table}</td>
                    <td>{row.count}</td>
                    <td className="text-xs">
                      {row.lastUpdated
                        ? new Date(row.lastUpdated).toLocaleString("tr-TR")
                        : "—"}
                    </td>
                    <td>{row.approxSizeKb} KB</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-header">Sistem Sağlık Kontrolü</h2>
        <Button onClick={runHealth} className="mb-4">
          Kontrolü Çalıştır
        </Button>
        {health && (
          <ul className="card space-y-2 p-4">
            {health.checks.map((check) => (
              <li key={check.id} className="flex items-start gap-2 text-sm">
                <span>
                  {check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗"}
                </span>
                <div>
                  <p className="font-medium">{check.label}</p>
                  <p className="text-text-secondary">{check.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="section-header">Veri Temizleme</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={cleanupCancelled}>
            İptal Edilmiş Kayıtları Temizle
          </Button>
          <Button variant="outline" onClick={loadStaleConsults}>
            Yanıtsız Görüş Raporu
          </Button>
        </div>
        {staleConsults.length > 0 && (
          <div className="card mt-4 overflow-x-auto p-4">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hasta</th>
                  <th>Soru</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {staleConsults.map((c) => (
                  <tr key={c.id}>
                    <td>{c.patient}</td>
                    <td>{c.question}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="yedekleme">
        <h2 className="section-header">Yedekleme</h2>
        <p className="text-sm text-text-secondary">
          Veritabanı yedeklemesi sunucu yöneticisi tarafından yapılandırılmalıdır.
          CSV dışa aktarma için Sunumlar sayfasını kullanın.
        </p>
      </section>

      {isSuperAdmin && (
        <section id="sorgu">
          <h2 className="section-header">Ham Sorgu (Süper Admin)</h2>
          <div className="card space-y-3 p-4">
            <Label>SQL (SELECT only)</Label>
            <Textarea rows={4} value={sql} onChange={(e) => setSql(e.target.value)} />
            <Button onClick={runQuery}>Çalıştır</Button>
            {queryHistory.length > 0 && (
              <div className="text-xs text-text-tertiary">
                Geçmiş:{" "}
                {queryHistory.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    className="mr-2 underline"
                    onClick={() => setSql(q)}
                  >
                    #{i + 1}
                  </button>
                ))}
              </div>
            )}
            {queryResult && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {queryResult.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, i) => (
                      <tr key={i}>
                        {queryResult.columns.map((col) => (
                          <td key={col}>{String(row[col] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
