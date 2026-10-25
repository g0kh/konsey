import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { googleSansFlex } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onkoloji Konsey Sistemi",
  description: "Hastane onkoloji konsey yönetim platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={googleSansFlex.variable}>
      <body
        className={`${googleSansFlex.className} min-h-screen bg-bg font-sans text-[16px] text-text-primary antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
