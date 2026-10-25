"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRANCHES } from "@/lib/constants";
import { adminFetch } from "@/lib/admin-fetch";
import { useCurrentUser } from "@/lib/UserContext";
import type { UserRole } from "@prisma/client";
import { Pencil, Trash2, Upload } from "lucide-react";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  branch: string;
  role: UserRole;
  isActive: boolean;
  presentationCount: number;
  commentCount: number;
  createdAt: string;
};

type UserForm = {
  firstName: string;
  lastName: string;
  username: string;
  branch: (typeof BRANCHES)[number];
  role: UserRole;
  password: string;
  isActive: boolean;
};

const emptyForm = (): UserForm => ({
  firstName: "",
  lastName: "",
  username: "",
  branch: BRANCHES[0],
  role: "DOCTOR",
  password: "",
  isActive: true,
});

export function AdminUsersPage() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const { data, mutate, isLoading } = useSWR<UserRow[]>(
    user ? "/api/admin/users" : null,
    adminFetcher(user),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [importCsv, setImportCsv] = useState("");
  const [importPreview, setImportPreview] = useState<{
    preview: { name: string; branch: string; role: UserRole; error?: string }[];
    imported?: number;
    errors?: { name: string; error: string }[];
  } | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setEditing(row);
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      username: row.username,
      branch: row.branch as UserForm["branch"],
      role: row.role,
      password: "",
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!user || !form.firstName.trim() || !form.lastName.trim()) return;

    const payload: Record<string, unknown> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      branch: form.branch,
      role: form.role,
      isActive: form.isActive,
    };

    if (form.username.trim()) {
      payload.username = form.username.trim();
    }
    if (form.password.trim()) {
      payload.password = form.password;
    } else if (!editing) {
      payload.password = "Degistir123!";
    }

    const url = editing ? `/api/admin/users/${editing.id}` : "/api/admin/users";
    const method = editing ? "PATCH" : "POST";
    const response = await adminFetch(user, url, {
      method,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error(data.error ?? "Kayıt başarısız");
      return;
    }
    toast.success(editing ? "Kullanıcı güncellendi" : "Kullanıcı eklendi");
    setModalOpen(false);
    mutate();
  };

  const remove = async (row: UserRow) => {
    if (!user) return;
    if (row.presentationCount > 0) {
      toast.error(`Bu kullanıcının ${row.presentationCount} sunumu var`);
      return;
    }
    if (!confirm(`${row.name} silinsin mi?`)) return;
    const response = await adminFetch(user, `/api/admin/users/${row.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error(data.error ?? "Silme başarısız");
      return;
    }
    toast.success("Kullanıcı silindi");
    mutate();
  };

  const previewImport = async () => {
    if (!user) return;
    const response = await adminFetch(user, "/api/admin/users/bulk-import", {
      method: "POST",
      body: JSON.stringify({ csv: importCsv }),
    });
    setImportPreview(await response.json());
  };

  const confirmImport = async () => {
    if (!user) return;
    const response = await adminFetch(user, "/api/admin/users/bulk-import", {
      method: "POST",
      body: JSON.stringify({ csv: importCsv, confirm: true }),
    });
    const result = await response.json();
    setImportPreview(result);
    toast.success(`${result.imported} kullanıcı eklendi`);
    mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={openAdd}>Kullanıcı Ekle</Button>
        <Button variant="outline" onClick={() => setShowImport(!showImport)}>
          <Upload className="mr-1 size-4" />
          Toplu Kullanıcı Ekle
        </Button>
      </div>

      {showImport && (
        <div className="card space-y-3 p-4">
          <Label>CSV (ad, soyad, brans, rol)</Label>
          <Textarea
            rows={5}
            placeholder="ad,soyad,brans,rol&#10;Ahmet,Yılmaz,Radyoloji,DOCTOR"
            value={importCsv}
            onChange={(e) => setImportCsv(e.target.value)}
          />
          <p className="text-xs text-text-secondary">
            İçe aktarılan kullanıcıların varsayılan şifresi: Degistir123!
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={previewImport}>
              Önizle
            </Button>
            {importPreview && (
              <Button onClick={confirmImport}>İçe Aktar</Button>
            )}
          </div>
          {importPreview?.preview && (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Branş</th>
                    <th>Rol</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.preview.map((row, i) => (
                    <tr key={i}>
                      <td>{row.name}</td>
                      <td>{row.branch}</td>
                      <td>{row.role}</td>
                      <td className={row.error ? "text-destructive" : "text-status-complete"}>
                        {row.error ?? "OK"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Kullanıcı Adı</th>
              <th>Branş</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Sunum</th>
              <th>Yorum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="py-6 text-center">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {data?.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.name}</td>
                <td className="text-sm text-text-secondary">{row.username}</td>
                <td>{row.branch}</td>
                <td>
                  <select
                    className="select-field !h-8 !py-0 text-xs"
                    value={row.role}
                    onChange={async (e) => {
                      if (!user) return;
                      await adminFetch(user, `/api/admin/users/${row.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ role: e.target.value }),
                      });
                      mutate();
                    }}
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="READONLY">READONLY</option>
                  </select>
                </td>
                <td>{row.isActive ? "Aktif" : "Pasif"}</td>
                <td>{row.presentationCount}</td>
                <td>{row.commentCount}</td>
                <td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(row)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="section-header">
              {editing ? "Kullanıcı Düzenle" : "Kullanıcı Ekle"}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>İsim</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Soyisim</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Kullanıcı Adı {editing ? "" : "(boş bırakılırsa otomatik)"}</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder={editing ? form.username : "ornek.kullanici"}
                />
              </div>
              <div className="space-y-1">
                <Label>Branş</Label>
                <select
                  className="select-field"
                  value={form.branch}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      branch: e.target.value as typeof BRANCHES[number],
                    }))
                  }
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Rol</Label>
                <select
                  className="select-field"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                  }
                >
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="READONLY">READONLY</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{editing ? "Yeni Şifre (opsiyonel)" : "Şifre (boş: Degistir123!)"}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Hesap aktif
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={save}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
