import Link from "next/link";
import type { PresentationStatus } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { STATUS_LABELS } from "@/lib/presentation-utils";
import { cn } from "@/lib/utils";

/* ── Card ── */
export function DSCard({
  className,
  clickable,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { clickable?: boolean }) {
  return (
    <div
      className={cn("card", clickable && "card-clickable cursor-pointer", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Page header ── */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-text-primary">{title}</h1>
          {description && (
            <p className="mt-1.5 text-[16px] text-text-secondary">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

/* ── Status badge ── */
const BADGE_CLASS: Record<PresentationStatus, string> = {
  PENDING: "badge badge-pending",
  IN_COUNCIL: "badge badge-active",
  COMPLETED: "badge badge-complete",
  CANCELLED: "badge badge-cancelled",
};

export function DSBadge({
  status,
  label,
  variant,
  className,
}: {
  status?: PresentationStatus;
  label?: string;
  variant?: "pending" | "active" | "done" | "urgent";
  className?: string;
}) {
  if (status) {
    return (
      <span className={cn(BADGE_CLASS[status], className)}>
        {label ?? STATUS_LABELS[status]}
      </span>
    );
  }
  const variantClass = {
    pending: "badge badge-pending",
    active: "badge badge-active",
    done: "badge badge-complete",
    urgent: "badge badge-urgent",
  }[variant ?? "pending"];
  return <span className={cn(variantClass, className)}>{label}</span>;
}

/* ── Council type chip (neutral) ── */
export function CouncilChip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return <span className={cn("council-chip", className)}>{label}</span>;
}

/* ── Empty state ── */
export function DSEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <Icon className="mb-3 size-12 text-text-muted" />
      <p className="text-[17px] font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="mt-1 text-[15px] text-text-secondary">{description}</p>
      )}
    </div>
  );
}

/* ── Select wrapper ── */
export function DSSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("select-field", className)} {...props}>
      {children}
    </select>
  );
}

/* ── Table primitives ── */
export function DSTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <table className={cn("ds-table", className)}>{children}</table>;
}

/* ── Ghost icon link ── */
export function DSGhostIconLink({
  href,
  title,
  children,
  external,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      title={title}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-all duration-150 ease hover:bg-surface-2 hover:text-text-primary"
    >
      {children}
    </Link>
  );
}

/* ── Filter label row ── */
export function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[14px] font-medium text-text-secondary">
      {children}
    </label>
  );
}

export function FilterChevron() {
  return <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />;
}
