"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/design-system";
import { BRANCHES, COUNCIL_TYPES } from "@/lib/constants";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";

export function UserProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useCurrentUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [branch, setBranch] = useState<string>(BRANCHES[0]);
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch("/api/users/me/preferences", {
          credentials: "include",
        });
        if (response.ok) {
          const data = (await response.json()) as {
            firstName: string;
            lastName: string;
            username: string;
            branch: string;
            phone: string;
            preferredCouncilTypes: string[];
          };
          setFirstName(data.firstName);
          setLastName(data.lastName);
          setUsername(data.username);
          setBranch(data.branch);
          setPhone(data.phone ?? "");
          setSelected(data.preferredCouncilTypes ?? []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadPreferences();
  }, []);

  function toggleCouncil(type: string) {
    setSelected((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  }

  async function savePreferences() {
    if (selected.length === 0) {
      toast.error("En az bir konsey seçin");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/users/me/preferences", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          branch,
          phone,
          preferredCouncilTypes: selected,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Bilgiler kaydedilemedi");
      }

      await refreshUser();
      toast.success("Profil bilgileri kaydedildi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Kullanıcı Paneli"
        description="İsim, klinik, telefon ve konsey görevlerinizi buradan düzenleyebilirsiniz"
      />

      {loading ? (
        <p className="text-sm text-text-secondary">Yükleniyor...</p>
      ) : (
        <>
          <section className="card space-y-4 p-5">
            <h2 className="section-header">Hesap Bilgileri</h2>
            <p className="text-sm text-text-secondary">
              Telefon numaranız yalnızca size görünür. Konsey raporlarında,
              katılan hekim listesinde ve diğer kullanıcılara gösterilmez.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-firstName">İsim</Label>
                <Input
                  id="profile-firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-lastName">Soyisim</Label>
                <Input
                  id="profile-lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-username">Kullanıcı adı</Label>
              <Input id="profile-username" value={username} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-branch">Klinik / Branş</Label>
              <select
                id="profile-branch"
                className="select-field w-full"
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
              >
                {BRANCHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Cep telefonu</Label>
              <Input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="05xx xxx xx xx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <p className="text-sm text-text-secondary">
                Şifre unutma durumunda yeni şifre bu numaraya iletilir.
              </p>
            </div>
            {user && (
              <p className="text-sm text-text-secondary">
                Giriş yapan hesap: {user.username}
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="section-header">Görevli Olduğum Konseyler</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Yalnız seçtiğiniz konseyler listelenir. Görevlerinizi buradan
              değiştirebilir veya yeni konsey ekleyebilirsiniz.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {COUNCIL_TYPES.map((type) => {
                const isSelected = selected.includes(type);
                return (
                  <label
                    key={type}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      isSelected
                        ? "border-accent-border bg-accent-subtle"
                        : "border-theme-border bg-surface hover:bg-elevated",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-ds"
                      checked={isSelected}
                      onChange={() => toggleCouncil(type)}
                    />
                    <span className="text-sm font-medium text-text-primary">{type}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="card space-y-3 p-5 text-sm leading-relaxed text-text-secondary">
            <h2 className="section-header">Hızlı görüş ve destek</h2>
            <p>
              Konsey öncesinde hızlı görüş gerekiyorsa hasta ekleme adımında
              ilgili branşa bildirim gider. Kendi branşınıza gelen bildirimleri
              bildirim ekranından takip edin.
            </p>
            <p>
              Sistem geliştirme aşamasındadır. Sorun veya öneri için{" "}
              <a className="font-medium text-accent" href="mailto:gokhan@kanser.ai">
                gokhan@kanser.ai
              </a>{" "}
              adresine yazabilirsiniz.
            </p>
          </section>

          <Button type="button" disabled={saving} onClick={() => void savePreferences()}>
            {saving ? "Kaydediliyor..." : "Bilgileri Kaydet"}
          </Button>
        </>
      )}
    </div>
  );
}
