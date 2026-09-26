/** Parse CSV text (Laravel faq/knowledge import parity). */
export const importCsvRows = (csv: string, previewLimit = 0) => {
  if (!csv || typeof csv !== "string" || !csv.trim()) {
    return { ok: false as const, error: "Please select csv file" };
  }
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { ok: false as const, error: "CSV must include header and at least one row" };

  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  let html = `<table><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr>`;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
    if (previewLimit && i <= previewLimit) {
      html += `<tr>${header.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`;
    }
  }
  html += "</table>";
  return { ok: true as const, header, rows, html: previewLimit ? html : undefined };
};
