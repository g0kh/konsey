import Link from "next/link";

export function AuthLayout({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
              İzmir Şehir Hastanesi
            </p>
            <p className="mt-2 text-lg font-semibold text-text-primary">
              Onkoloji Konsey Sistemi
            </p>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </div>
  );
}
