"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/UserContext";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useCurrentUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Giriş başarısız");
        return;
      }

      await refreshUser();
      const next = searchParams.get("next") || "/konsey";
      router.push(next);
      router.refresh();
    } catch {
      toast.error("Giriş yapılamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Giriş Yap"
      subtitle="Kullanıcı adınız ve şifrenizle giriş yapın"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Kullanıcı Adı</Label>
          <Input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="ör. admin"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="font-medium text-accent hover:underline">
          Kayıt olun
        </Link>
      </p>
    </AuthLayout>
  );
}
