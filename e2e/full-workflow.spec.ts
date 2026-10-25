import { expect, test } from "@playwright/test";

const STORAGE_KEY = "onkoloji-konsey-user";
const VALID_TC = "12345678901";

async function selectUser(page: import("@playwright/test").Page, name: string) {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByPlaceholder("Doktor adı veya branş ara...").fill(name);
  await page.getByRole("button", { name }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

test.describe("TEST SUITE 1: Kullanıcı Kimlik Seçimi", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();
  });

  test("Sayfa açılınca user modal görünüyor", async ({ page }) => {
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Kimliğinizi Seçin")).toBeVisible();
  });

  test("Kullanıcı adı aranabilir", async ({ page }) => {
    await page.getByPlaceholder("Doktor adı veya branş ara...").fill("Radyoloji");
    await expect(page.getByText("Dr. Elif Şahin")).toBeVisible();
  });

  test("Kullanıcı seçilince modal kapanıyor ve header'da ad görünüyor", async ({
    page,
  }) => {
    await page.getByPlaceholder("Doktor adı veya branş ara...").fill("Ayşe");
    await page.getByRole("button", { name: "Dr. Ayşe Yılmaz" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText("Dr. Ayşe Yılmaz")).toBeVisible();
  });

  test("Değiştir tıklanınca modal tekrar açılıyor", async ({ page }) => {
    await selectUser(page, "Dr. Ayşe Yılmaz");
    await page.getByRole("button", { name: "Değiştir" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Sayfa yenilenince seçili kullanıcı korunuyor", async ({ page }) => {
    await selectUser(page, "Dr. Ayşe Yılmaz");
    await page.reload();
    await expect(page.getByText("Dr. Ayşe Yılmaz")).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("TEST SUITE 2: Yeni Hasta Sunumu", () => {
  test("Tam sunum akışı", async ({ page }) => {
    test.setTimeout(60_000);
    await selectUser(page, "Dr. Mehmet Kaya");
    await page.goto("/hasta-ekle");

    await page.getByLabel(/Ad \*/).fill("E2E");
    await page.getByLabel(/Soyad \*/).fill("Hasta");
    await page.getByLabel(/TC Kimlik No \*/).fill(VALID_TC);
    await page.getByRole("button", { name: "İleri" }).click();

    await page.getByLabel(/Konseye Sunulma Sebebi \*/).fill("E2E test sunumu");
    await page.getByRole("button", { name: "İleri" }).click();
    await page.getByRole("button", { name: "İleri" }).click();

    await expect(page.getByText("Sunum Özeti")).toBeVisible();
    await page.getByRole("button", { name: "Konseye Gönder" }).click();

    await expect(page).toHaveURL(/\/konsey/, { timeout: 15_000 });
    await expect(page.getByText("E2E Hasta").first()).toBeVisible();
  });
});

test.describe("TEST SUITE 3: Konsey Listesi Filtreleme", () => {
  test.beforeEach(async ({ page }) => {
    await selectUser(page, "Dr. Ayşe Yılmaz");
    await page.goto("/konsey");
  });

  test("Tab değiştirince liste filtreniyor", async ({ page }) => {
    await page.getByRole("button", { name: "Meme Konseyi" }).click();
    await expect(page.getByRole("button", { name: "Meme Konseyi" })).toHaveClass(
      /pill-tab-active/,
    );
  });

  test("Arama kutusu hasta adı ile filtreler", async ({ page }) => {
    await page
      .getByPlaceholder("Hasta adı veya TC ile ara...")
      .fill("Fatma");
    await expect(page.getByText("Fatma Özkan")).toBeVisible();
  });
});

test.describe("TEST SUITE 4: Konsey Detay İş Akışı", () => {
  test("Detay sayfası ve konsey akışı", async ({ page }) => {
    await selectUser(page, "Dr. Mehmet Kaya");
    await page.goto("/konsey");
    await page.getByText("Fatma Özkan").first().click();

    await expect(page.getByText("Konseye Sunulma Sebebi")).toBeVisible();

    const takeToCouncil = page.getByRole("button", { name: /Konseye Al/i });
    if (await takeToCouncil.isVisible()) {
      await takeToCouncil.click();
    }

    await expect(page.getByText("Hızlı Görüş Paneli")).toBeVisible();
    await page.getByRole("button", { name: "Hızlı Görüş İste" }).click();

    const consultPanel = page
      .locator("section")
      .filter({ hasText: "Hızlı Görüş Paneli" });
    await consultPanel.locator("select").selectOption("Radyoloji");
    await consultPanel.locator("textarea").fill("E2E radyoloji sorusu");
    await consultPanel.getByRole("button", { name: "Gönder" }).click();
    await expect(page.getByText("E2E radyoloji sorusu")).toBeVisible();
  });
});

test.describe("TEST SUITE 5: Sistem Sağlığı", () => {
  test("Health endpoint bağlı gösteriyor", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.database.connected).toBe(true);
  });
});

test.describe("TEST SUITE 6: Veri Kalıcılığı", () => {
  test("Kullanıcı değiştirilip sayfa yenilenince korunur", async ({ page }) => {
    await selectUser(page, "Dr. Volkan Eren");
    await page.reload();
    await expect(page.getByText("Dr. Volkan Eren")).toBeVisible();
  });
});
