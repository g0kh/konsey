export type ModuleResult = {
  module: string;
  passed: number;
  failed: number;
  durationMs: number;
};

export type TestReportData = {
  modules: ModuleResult[];
  failedTests: { name: string; message: string; module: string }[];
  coveragePercent: number | null;
  recordCounts: Record<string, number>;
  totalDurationMs: number;
  generatedAt: string;
};

export function buildHtmlReport(data: TestReportData): string {
  const moduleRows = data.modules
    .map(
      (m) =>
        `<tr><td>${m.module}</td><td>${m.passed}</td><td>${m.failed}</td><td>${m.durationMs}ms</td></tr>`,
    )
    .join("");

  const failedRows = data.failedTests
    .map(
      (f) =>
        `<tr><td>${f.module}</td><td>${f.name}</td><td><pre>${escapeHtml(f.message)}</pre></td></tr>`,
    )
    .join("");

  const countRows = Object.entries(data.recordCounts)
    .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Onkoloji Konsey Test Raporu</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #0f1117; color: #e8eaed; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 2rem; }
    th, td { border: 1px solid #333; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #1a1d27; }
    h1, h2 { color: #8ab4f8; }
    pre { white-space: pre-wrap; margin: 0; font-size: 12px; }
    .summary { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .card { background: #1a1d27; padding: 1rem 1.5rem; border-radius: 8px; min-width: 140px; }
  </style>
</head>
<body>
  <h1>Onkoloji Konsey Test Raporu</h1>
  <p>Oluşturulma: ${data.generatedAt}</p>
  <div class="summary">
    <div class="card"><strong>Toplam süre</strong><br>${data.totalDurationMs}ms</div>
    <div class="card"><strong>Kapsam</strong><br>${data.coveragePercent ?? "—"}%</div>
    <div class="card"><strong>Başarısız</strong><br>${data.failedTests.length}</div>
  </div>
  <h2>Modül Özeti</h2>
  <table><thead><tr><th>Modül</th><th>Geçti</th><th>Kaldı</th><th>Süre</th></tr></thead><tbody>${moduleRows}</tbody></table>
  <h2>Başarısız Testler</h2>
  <table><thead><tr><th>Modül</th><th>Test</th><th>Hata</th></tr></thead><tbody>${failedRows || "<tr><td colspan=3>Yok</td></tr>"}</tbody></table>
  <h2>Veritabanı Kayıt Sayıları</h2>
  <table><thead><tr><th>Tablo</th><th>Sayı</th></tr></thead><tbody>${countRows}</tbody></table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
