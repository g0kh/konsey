"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { useCurrentUser } from "@/lib/UserContext";
import { formatDateTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type DashboardData = {
  stats: {
    totalPatients: number;
    pendingPresentations: number;
    completedThisMonth: number;
    unansweredConsults: number;
    trends: {
      completedThisMonth: number;
      unansweredConsults: number;
    };
  };
  charts: {
    monthlyActivity: { month: string; count: number }[];
    councilTypeDistribution: { name: string; value: number }[];
    weeklyTrend: number[];
    weekLabels: string[];
  };
  activity: {
    description: string;
    userName: string;
    timestamp: string;
    link: string;
  }[];
  system: {
    databaseConnected: boolean;
    responseTimeMs: number;
    totalRecords: number;
    lastBackup: string | null;
    version: string;
  };
};

const PIE_COLORS = [
  "var(--color-accent)",
  "#5d88ff",
  "#6b9fff",
  "#9b7bff",
  "#ff6b9d",
  "#ffb86b",
  "#6bffc9",
  "#c9ff6b",
];

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend?: number;
}) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div className="admin-stat-card">
      <p className="text-3xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
      {trend !== undefined && (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            trendUp ? "text-status-complete" : "text-destructive",
          )}
        >
          {trendUp ? "↑" : "↓"} %{Math.abs(trend)} geçen aya göre
        </p>
      )}
    </div>
  );
}

export function AdminDashboardPage() {
  const { user } = useCurrentUser();
  const { data, isLoading } = useSWR<DashboardData>(
    user ? "/api/admin/dashboard" : null,
    adminFetcher(user),
    { refreshInterval: 60_000 },
  );

  if (isLoading || !data) {
    return <p className="text-text-secondary">Dashboard yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Hasta" value={data.stats.totalPatients} />
        <StatCard label="Bekleyen Sunum" value={data.stats.pendingPresentations} />
        <StatCard
          label="Bu Ay Tamamlanan"
          value={data.stats.completedThisMonth}
          trend={data.stats.trends.completedThisMonth}
        />
        <StatCard
          label="Yanıtsız Hızlı Görüş"
          value={data.stats.unansweredConsults}
          trend={data.stats.trends.unansweredConsults}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h2 className="section-header !mb-4">Son 6 Ay Konsey Aktivitesi</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.monthlyActivity}>
                <XAxis dataKey="month" tick={{ fill: "#9aa0a6", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9aa0a6", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="section-header !mb-4">Konsey Türü Dağılımı</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.councilTypeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => String(name).split(" ")[0]}
                >
                  {data.charts.councilTypeDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="section-header !mb-4">Haftalık Sunum Trendi</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.charts.weeklyTrend}>
              <XAxis dataKey="week" tick={{ fill: "#9aa0a6", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9aa0a6", fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ fill: "var(--color-accent)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="section-header !mb-4">Son Aktiviteler</h2>
          <ul className="space-y-3">
            {data.activity.map((item, index) => (
              <li key={index} className="border-b border-theme-border pb-3 last:border-0">
                <Link href={item.link} className="text-sm text-text-primary hover:text-accent">
                  {item.description}
                </Link>
                <p className="text-xs text-text-tertiary">
                  {item.userName} · {formatDateTime(item.timestamp)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <h2 className="section-header !mb-4">Sistem Durumu</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Veritabanı Bağlantısı</dt>
              <dd className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    data.system.databaseConnected ? "bg-status-complete" : "bg-destructive",
                  )}
                />
                {data.system.databaseConnected ? "Bağlı" : "Bağlantı Yok"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Yanıt Süresi</dt>
              <dd>{data.system.responseTimeMs}ms</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Toplam Kayıt</dt>
              <dd>{data.system.totalRecords}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Son Yedekleme</dt>
              <dd>{data.system.lastBackup ?? "Henüz yok"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Uygulama Versiyonu</dt>
              <dd>v{data.system.version}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
