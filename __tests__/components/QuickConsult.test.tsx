import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresentationInteractionsPanel } from "@/components/konsey/presentation-interactions-panel";
import type { PresentationDetail } from "@/lib/types/presentation-detail";

jest.mock("@/lib/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const basePresentation: PresentationDetail = {
  id: "pres-1",
  councilType: "Meme Konseyi",
  presentationReason: "Test",
  clinicalSummary: null,
  currentTreatment: null,
  status: "IN_COUNCIL",
  councilDate: null,
  councilDecision: null,
  councilDecisionAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  patient: {
    firstName: "Test",
    lastName: "Hasta",
    tcNo: "12345678950",
    birthDate: null,
    gender: null,
    diagnosis: null,
  },
  submittedBy: { id: "u1", name: "Dr. Onkolog", branch: "Tıbbi Onkoloji" },
  councilDecisionBy: null,
  imaging: { pet: null, mr: null, ct: null, pathology: null, other: null },
  quickConsults: [
    {
      id: "qc-1",
      targetBranch: "Radyoloji",
      question: "PET yorumu?",
      response: null,
      respondedAt: null,
      createdAt: new Date().toISOString(),
      requestedBy: { id: "u1", name: "Dr. Onkolog", branch: "Tıbbi Onkoloji" },
      respondedBy: null,
    },
    {
      id: "qc-2",
      targetBranch: "Patoloji",
      question: "Patoloji?",
      response: null,
      respondedAt: null,
      createdAt: new Date().toISOString(),
      requestedBy: { id: "u1", name: "Dr. Onkolog", branch: "Tıbbi Onkoloji" },
      respondedBy: null,
    },
  ],
  branchComments: [],
};

describe("QuickConsult (PresentationInteractionsPanel)", () => {
  it("Hızlı görüş formu render oluyor", () => {
    render(
      <PresentationInteractionsPanel
        presentation={basePresentation}
        user={{
          id: "u1",
          name: "Dr. Onkolog",
          branch: "Tıbbi Onkoloji",
          role: "DOCTOR",
        }}
        councilDecision=""
        onCouncilDecisionChange={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );
    expect(screen.getByText("Hızlı Görüş Paneli")).toBeInTheDocument();
  });

  it("Mevcut görüşler listeleniyor", () => {
    render(
      <PresentationInteractionsPanel
        presentation={basePresentation}
        user={{
          id: "u1",
          name: "Dr. Onkolog",
          branch: "Tıbbi Onkoloji",
          role: "DOCTOR",
        }}
        councilDecision=""
        onCouncilDecisionChange={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );
    expect(screen.getByText("PET yorumu?")).toBeInTheDocument();
  });

  it("Kendi branşıma gelen görüşlerde yanıt alanı açılıyor", async () => {
    const user = userEvent.setup();
    render(
      <PresentationInteractionsPanel
        presentation={basePresentation}
        user={{
          id: "u2",
          name: "Dr. Radyolog",
          branch: "Radyoloji",
          role: "DOCTOR",
        }}
        councilDecision=""
        onCouncilDecisionChange={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Buraya yazın...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yanıtla" })).toBeInTheDocument();
  });

  it("Başka branşa gelen görüşlerde yanıt alanı görünmüyor", () => {
    render(
      <PresentationInteractionsPanel
        presentation={basePresentation}
        user={{
          id: "u3",
          name: "Dr. Onkolog",
          branch: "Tıbbi Onkoloji",
          role: "DOCTOR",
        }}
        councilDecision=""
        onCouncilDecisionChange={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.queryByPlaceholderText("Buraya yazın...")).not.toBeInTheDocument();
  });

  it("Soru alanı boşken gönderilemiyor", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn() as jest.Mock;

    render(
      <PresentationInteractionsPanel
        presentation={basePresentation}
        user={{
          id: "u1",
          name: "Dr. Onkolog",
          branch: "Tıbbi Onkoloji",
          role: "DOCTOR",
        }}
        councilDecision=""
        onCouncilDecisionChange={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Hızlı Görüş İste" }));
    await user.click(screen.getByRole("button", { name: /Gönder/i }));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
