"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRANCHES, COUNCIL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/UserContext";

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-accent-border bg-accent-subtle px-3 py-2 text-sm leading-relaxed text-text-secondary">
      {children}
    </p>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useCurrentUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [branch, setBranch] = useState<(typeof BRANCHES)[number]>(BRANCHES[0]);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCouncils, setSelectedCouncils] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    if (selectedCouncils.length === 0) {
      toast.error("En az bir konsey seçin");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          branch,
          phone,
          password,
          confirmPassword,
          preferredCouncilTypes: selectedCouncils,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        username?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Kayıt başarısız");
        return;
      }

      if (data.username) {
        setCreatedUsername(data.username);
      }

      await refreshUser();
    } catch {
      toast.error("Kayıt oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  function closeSuccessModal() {
    setCreatedUsername(null);
    router.push("/konsey");
    router.refresh();
  }

  return (
    <>
      <AuthLayout
        wide
        title="Kayıt Ol"
        subtitle="Bilgilerinizi adım adım doldurun. Bu bilgiler profilinizden sonra da değiştirilebilir."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Kimlik ve klinik</h2>
            <InfoNote>
              İsminiz ve bağlı olduğunuz klinik, konsey listesinde ve raporlarda
              görünür. Telefon numaranız hiçbir raporda veya başka hekime
              gösterilmez.
            </InfoNote>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">İsim</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyisim</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Klinik / Branş</Label>
              <select
                id="branch"
                value={branch}
                onChange={(event) =>
                  setBranch(event.target.value as (typeof BRANCHES)[number])
                }
                className="select-field w-full"
                required
              >
                {BRANCHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Telefon</h2>
            <InfoNote>
              Şifre unutma gibi durumlarda yeni şifre bu telefona iletileceği
              için cep numaranızı istiyoruz. Numara yalnızca sizin hesabınıza
              aittir; konsey raporlarında ve katılan hekim listelerinde yer
              almaz.
            </InfoNote>
            <div className="space-y-2">
              <Label htmlFor="phone">Cep telefonu</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="05xx xxx xx xx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Şifre</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Tekrar şifre</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Görevli olduğunuz konseyler
            </h2>
            <InfoNote>
              Mevcut konsey listesinden görevli olduğunuz konseyleri seçin.
              Seçtiklerinize atanırsınız ve yalnız bu konseylerin hastalarını
              görürsünüz. Sonra profil ekranından ekleyebilir veya
              çıkarabilirsiniz.
            </InfoNote>
            <div className="grid gap-2 sm:grid-cols-2">
              {COUNCIL_TYPES.map((type) => {
                const isSelected = selectedCouncils.includes(type);
                return (
                  <label
                    key={type}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5",
                      isSelected
                        ? "border-accent-border bg-accent-subtle"
                        : "border-theme-border bg-surface",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-ds"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedCouncils((current) =>
                          current.includes(type)
                            ? current.filter((item) => item !== type)
                            : [...current, type],
                        )
                      }
                    />
                    <span className="text-sm font-medium text-text-primary">{type}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Hızlı görüş</h2>
            <InfoNote>
              Konsey öncesinde bir branştan hızlı görüş istenen durumlar varsa,
              hasta eklerken bu adımda not düşülür ve ilgili branşa hızlı
              bildirim gider. Kendi branşınıza da hızlı bildirim gelebilir; bunu
              bildirim ekranından takip edin.
            </InfoNote>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Geliştirme</h2>
            <InfoNote>
              Sistem geliştirme aşamasındadır. Konsey sistemiyle ilgili sorun
              veya öneriniz varsa{" "}
              <a className="font-medium text-accent" href="mailto:gokhan@kanser.ai">
                gokhan@kanser.ai
              </a>{" "}
              adresine yazabilirsiniz. İsim, klinik, telefon ve konsey
              görevlerinizi profil ekranından düzenleyebilirsiniz.
            </InfoNote>
          </section>

          <Button type="submit" className="w-full" disabled={loading || !!createdUsername}>
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-medium text-accent hover:underline">
            Giriş yapın
          </Link>
        </p>
      </AuthLayout>

      {createdUsername && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div
            className="card w-full max-w-md p-6 shadow-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-success-title"
          >
            <h2
              id="register-success-title"
              className="text-xl font-semibold text-text-primary"
            >
              Kayıt Tamamlandı
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Giriş yapmak için aşağıdaki kullanıcı adını not alın. Bu bilgi
              yalnızca bir kez gösterilir.
            </p>
            <div className="mt-4 rounded-lg border border-accent-border bg-accent-subtle px-4 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Kullanıcı Adınız
              </p>
              <p className="mt-2 text-2xl font-bold tracking-wide text-text-primary">
                {createdUsername}
              </p>
            </div>
            <Button type="button" className="mt-6 w-full" onClick={closeSuccessModal}>
              Anladım, Devam Et
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
