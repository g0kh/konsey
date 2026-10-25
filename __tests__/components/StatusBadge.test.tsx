import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it('PENDING → "Bekliyor" + doğru renk', () => {
    render(<StatusBadge status="PENDING" />);
    const badge = screen.getByText("Bekliyor");
    expect(badge).toHaveAttribute("data-status", "PENDING");
    expect(badge.className).toContain("badge-pending");
  });

  it('IN_COUNCIL → "Konseyde" + doğru renk', () => {
    render(<StatusBadge status="IN_COUNCIL" />);
    const badge = screen.getByText("Konseyde");
    expect(badge).toHaveAttribute("data-status", "IN_COUNCIL");
    expect(badge.className).toContain("badge-active");
  });

  it('COMPLETED → "Tamamlandı" + doğru renk', () => {
    render(<StatusBadge status="COMPLETED" />);
    const badge = screen.getByText("Tamamlandı");
    expect(badge).toHaveAttribute("data-status", "COMPLETED");
    expect(badge.className).toContain("badge-complete");
  });
});
