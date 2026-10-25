import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresentationForm } from "@/components/presentation-form";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

jest.mock("@/lib/UserContext", () => ({
  useCurrentUser: () => ({
    user: {
      id: "user-1",
      username: "test.user",
      name: "Test Kullanıcı",
      firstName: "Test",
      lastName: "Kullanıcı",
      branch: "Tıbbi Onkoloji",
      role: "DOCTOR",
    },
    refreshUser: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock("@/lib/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { toast } from "@/lib/toast";

const VALID_TC = "12345678901";

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/Ad \*/), {
    target: { value: "Test" },
  });
  fireEvent.change(screen.getByLabelText(/Soyad \*/), {
    target: { value: "Hasta" },
  });
  fireEvent.change(screen.getByLabelText(/TC Kimlik No \*/), {
    target: { value: VALID_TC },
  });
}

beforeEach(() => {
  mockPush.mockClear();
  mockRefresh.mockClear();
  (toast.success as jest.Mock).mockClear();
  (toast.error as jest.Mock).mockClear();
});

describe("PresentationForm", () => {
  it("Step 1 render oluyor, zorunlu alanlar var", () => {
    render(<PresentationForm />);
    expect(screen.getByLabelText(/Ad \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Soyad \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/TC Kimlik No \*/)).toBeInTheDocument();
  });

  it("TC alanına 10 karakter girilince İleri geçiş yapmaz", async () => {
    const user = userEvent.setup();
    render(<PresentationForm />);

    fireEvent.change(screen.getByLabelText(/Ad \*/), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByLabelText(/Soyad \*/), {
      target: { value: "Hasta" },
    });
    fireEvent.change(screen.getByLabelText(/TC Kimlik No \*/), {
      target: { value: "1234567890" },
    });
    await user.click(screen.getByRole("button", { name: "İleri" }));

    expect(screen.getByText("Adım 1 / 4")).toBeInTheDocument();
  });

  it("TC alanına 11 rakam girilince geçer", async () => {
    const user = userEvent.setup();
    render(<PresentationForm />);
    fillStep1();
    await user.click(screen.getByRole("button", { name: "İleri" }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Konsey Türü \*/)).toBeInTheDocument();
    });
  });

  it("TC alanına harf girilince hata", async () => {
    const user = userEvent.setup();
    render(<PresentationForm />);

    fillStep1();
    fireEvent.change(screen.getByLabelText(/TC Kimlik No \*/), {
      target: { value: "abcdefghijk" },
    });
    await user.click(screen.getByRole("button", { name: "İleri" }));

    expect(screen.getByText("Adım 1 / 4")).toBeInTheDocument();
  });

  it("Step 1 valid → Step 2'ye geçiş", async () => {
    const user = userEvent.setup();
    render(<PresentationForm />);
    fillStep1();
    await user.click(screen.getByRole("button", { name: "İleri" }));

    expect(await screen.findByLabelText(/Konsey Türü \*/)).toBeInTheDocument();
  });

  it("Step 2'de sunum sebebi olmadan İleri tıklanamaz", async () => {
    const user = userEvent.setup();
    render(<PresentationForm />);
    fillStep1();
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await screen.findByLabelText(/Konsey Türü \*/);

    await user.click(screen.getByRole("button", { name: "İleri" }));
    expect(screen.getByText("Adım 2 / 4")).toBeInTheDocument();
  });

  it("Form submit API'yi çağırıyor", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ presentationId: "p1", patientId: "pt1" }),
    }) as jest.Mock;

    render(<PresentationForm />);
    fillStep1();
    await user.click(screen.getByRole("button", { name: "İleri" }));

    fireEvent.change(screen.getByLabelText(/Konseye Sunulma Sebebi \*/), {
      target: { value: "İlk değerlendirme" },
    });
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await user.click(screen.getByRole("button", { name: "Konseye Gönder" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/presentations",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("API başarısız → hata toast gösteriliyor", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Sunum gönderilemedi" }),
    }) as jest.Mock;

    render(<PresentationForm />);
    fillStep1();
    await user.click(screen.getByRole("button", { name: "İleri" }));
    fireEvent.change(screen.getByLabelText(/Konseye Sunulma Sebebi \*/), {
      target: { value: "İlk değerlendirme" },
    });
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await user.click(screen.getByRole("button", { name: "Konseye Gönder" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("API başarılı → redirect ve başarı toast", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ presentationId: "p1", patientId: "pt1" }),
    }) as jest.Mock;

    render(<PresentationForm />);
    fillStep1();
    await user.click(screen.getByRole("button", { name: "İleri" }));
    fireEvent.change(screen.getByLabelText(/Konseye Sunulma Sebebi \*/), {
      target: { value: "İlk değerlendirme" },
    });
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await user.click(screen.getByRole("button", { name: "İleri" }));
    await user.click(screen.getByRole("button", { name: "Konseye Gönder" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/konsey");
    });
  });
});
