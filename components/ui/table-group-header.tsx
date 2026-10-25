import { formatTurkishUppercase } from "@/lib/turkish";

export function TableGroupHeader({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  const title = formatTurkishUppercase(label);

  return (
    <div className="table-group-header-section" role="heading" aria-level={2}>
      <div className="table-group-header-glass">
        <div className="table-group-header-pattern" aria-hidden />
        <div className="table-group-header-vectors" aria-hidden>
          <svg viewBox="0 0 120 40" className="table-group-header-svg-left">
            <circle cx="20" cy="20" r="16" fill="currentColor" opacity="0.15" />
            <circle cx="50" cy="12" r="8" fill="currentColor" opacity="0.1" />
          </svg>
          <svg viewBox="0 0 120 40" className="table-group-header-svg-right">
            <circle cx="100" cy="20" r="16" fill="currentColor" opacity="0.15" />
            <circle cx="70" cy="28" r="8" fill="currentColor" opacity="0.1" />
          </svg>
        </div>
        <span className="table-group-header-text">
          {title} · {count} hasta
        </span>
      </div>
    </div>
  );
}
