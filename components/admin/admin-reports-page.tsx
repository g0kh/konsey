"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/lib/UserContext";

export function AdminReportsPage() {
  const { user } = useCurrentUser();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const councilStatsKey = `/api/admin/reports/council-stats?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const { data: councilStats } = useSWR(
    user ? councilStatsKey : null,
    adminFetcher(user),
  );

  const { data: branchActivity } = useSWR(
    user ? "/api/admin/reports/branch-activity" : null,
    adminFetcher(user),
  );

  const { data: monthly } = useSWR(
    user ? `/api/admin/reports/monthly-summary?year=${year}&month=${month}` : null,
    adminFetcher(user),
  );

  return (
    <div className="space-y-10">
      <section>
        <h2 className="section-header">Konsey İstatistikleri</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label>Başlangıç</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Bitiş</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="card overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Konsey Türü</th>
                <th>Toplam</th>
                <th>Tamamlanan</th>
                <th>Oran %</th>
                <th>Ort. Süre (gün)</th>
                <th>En Çok Sunan</th>
              </tr>
            </thead>
            <tbody>
              {councilStats?.stats?.map(
                (row: {
                  councilType: string;
                  total: number;
                  completed: number;
                  completionRate: number;
                  avgCompletionDays: number;
                  topSubmitter: string;
                }) => (
                  <tr key={row.councilType}>
                    <td>{row.councilType}</td>
                    <td>{row.total}</td>
                    <td>{row.completed}</td>
                    <td>{row.completionRate}%</td>
                    <td>{row.avgCompletionDays}</td>
                    <td>{row.topSubmitter}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <div className="card mt-4 h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={councilStats?.stats ?? []}>
              <XAxis dataKey="councilType" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="var(--accent-primary)" name="Toplam" />
              <Bar dataKey="completed" fill="var(--color-accent)" name="Tamamlanan" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section id="brans">
        <h2 className="section-header">Branş Aktivitesi</h2>
        <div className="card overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Branş</th>
                <th>Yorum Sayısı</th>
                <th>Bekleyen Görüş</th>
                <th>Ort. Yanıt (saat)</th>
              </tr>
            </thead>
            <tbody>
              {branchActivity?.branches?.map(
                (row: {
                  branch: string;
                  commentCount: number;
                  pendingConsults: number;
                  avgResponseHours: number | null;
                }) => (
                  <tr key={row.branch}>
                    <td>{row.branch}</td>
                    <td>{row.commentCount}</td>
                    <td>{row.pendingConsults}</td>
                    <td>{row.avgResponseHours ?? "—"}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section id="aylik">
        <h2 className="section-header">Aylık Özet</h2>
        <div className="mb-4 flex gap-3">
          <Input
            type="number"
            className="w-24"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Input
            type="number"
            className="w-20"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
          <Button variant="outline" onClick={() => window.print()}>
            PDF / Yazdır
          </Button>
        </div>
        {monthly && (
          <>
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <div className="admin-stat-card">
                <p className="text-2xl font-semibold">{monthly.summary.submitted}</p>
                <p className="text-sm text-text-secondary">Hasta sunuldu</p>
              </div>
              <div className="admin-stat-card">
                <p className="text-2xl font-semibold">{monthly.summary.completed}</p>
                <p className="text-sm text-text-secondary">Konsey tamamlandı</p>
              </div>
              <div className="admin-stat-card">
                <p className="text-2xl font-semibold">{monthly.summary.decisions}</p>
                <p className="text-sm text-text-secondary">Karar verildi</p>
              </div>
            </div>
            <div className="card overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hasta</th>
                    <th>Konsey</th>
                    <th>Karar</th>
                    <th>Kararı Veren</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.completedPresentations.map(
                    (p: {
                      id: string;
                      patient: string;
                      councilType: string;
                      councilDecision: string | null;
                      decidedBy: string;
                    }) => (
                      <tr key={p.id}>
                        <td>{p.patient}</td>
                        <td>{p.councilType}</td>
                        <td className="max-w-md">{p.councilDecision}</td>
                        <td>{p.decidedBy}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
