"use client";

import Link from "next/link";
import useSWR from "swr";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";

export function AdminSessionsPage() {
  const { data: sessions = [], isLoading } = useSWR<
    {
      id: string;
      councilType: string;
      sessionDate: string;
      notes: string | null;
      createdBy: { name: string };
      presentations: { orderIndex: number; presentation: { id: string } }[];
    }[]
  >("/api/council-sessions", fetcher);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-text-secondary">
          Konsey oturumlarını görüntüleyin ve yönetin.
        </p>
        <Link href="/konsey/oturum" className={cn(buttonVariants())}>
          Oturum Yönetimine Git
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Konsey Türü</th>
              <th>Tarih</th>
              <th>Oluşturan</th>
              <th>Sunum Sayısı</th>
              <th>Notlar</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-6 text-center">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.councilType}</td>
                <td>{new Date(session.sessionDate).toLocaleString("tr-TR")}</td>
                <td>{session.createdBy.name}</td>
                <td>{session.presentations.length}</td>
                <td className="max-w-xs truncate">{session.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
