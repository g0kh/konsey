const fs = require("fs");
const path = require("path");

const resultsPath = path.join(process.cwd(), "test-results", "results.json");
const coveragePath = path.join(process.cwd(), "coverage", "coverage-summary.json");
const outputPath = path.join(process.cwd(), "test-results", "report.html");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function moduleFromFile(filePath) {
  if (filePath.includes("/database/")) return "database";
  if (filePath.includes("/api/")) return "api";
  if (filePath.includes("/components/")) return "components";
  if (filePath.includes("/system/")) return "system";
  return "other";
}

function main() {
  if (!fs.existsSync(resultsPath)) {
    console.error("test-results/results.json bulunamadı. Önce jest --json çalıştırın.");
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  const modules = new Map();
  const failedTests = [];

  for (const suite of results.testResults ?? []) {
    const module = moduleFromFile(suite.name);
    const entry = modules.get(module) ?? {
      module,
      passed: 0,
      failed: 0,
      durationMs: 0,
    };

    entry.durationMs += suite.endTime - suite.startTime;

    for (const assertion of suite.assertionResults ?? []) {
      if (assertion.status === "passed") {
        entry.passed += 1;
      } else if (assertion.status === "failed") {
        entry.failed += 1;
        failedTests.push({
          module,
          name: assertion.fullName ?? assertion.title,
          message: (assertion.failureMessages ?? []).join("\n"),
        });
      }
    }

    modules.set(module, entry);
  }

  let coveragePercent = null;
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
    const total = coverage.total?.lines?.pct;
    if (typeof total === "number") {
      coveragePercent = total;
    }
  }

  const moduleRows = [...modules.values()]
    .map(
      (m) =>
        `<tr><td>${m.module}</td><td>${m.passed}</td><td>${m.failed}</td><td>${m.durationMs}ms</td></tr>`,
    )
    .join("");

  const failedRows = failedTests
    .map(
      (f) =>
        `<tr><td>${f.module}</td><td>${escapeHtml(f.name)}</td><td><pre>${escapeHtml(f.message)}</pre></td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
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
  <p>Oluşturulma: ${new Date().toISOString()}</p>
  <div class="summary">
    <div class="card"><strong>Toplam süre</strong><br>${results.startTime && results.endTime ? results.endTime - results.startTime : 0}ms</div>
    <div class="card"><strong>Kapsam</strong><br>${coveragePercent ?? "—"}%</div>
    <div class="card"><strong>Başarısız</strong><br>${failedTests.length}</div>
  </div>
  <h2>Modül Özeti</h2>
  <table><thead><tr><th>Modül</th><th>Geçti</th><th>Kaldı</th><th>Süre</th></tr></thead><tbody>${moduleRows}</tbody></table>
  <h2>Başarısız Testler</h2>
  <table><thead><tr><th>Modül</th><th>Test</th><th>Hata</th></tr></thead><tbody>${failedRows || "<tr><td colspan=3>Yok</td></tr>"}</tbody></table>
</body>
</html>`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log(`Rapor oluşturuldu: ${outputPath}`);
}

main();
