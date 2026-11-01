const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

export { esc as escapeHtml };

// CSV com ";" e BOM, que abre direto no Excel em português
export function downloadCsv(filename, header, rows) {
  const cell = (v) => {
    const s =
      typeof v === "number"
        ? v.toFixed(2).replace(".", ",").replace(/,00$/, "")
        : String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv =
    "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const PRINT_CSS = `
  @page { margin: 18mm; }
  body { font-family: Inter, system-ui, sans-serif; color: #132a2d; font-size: 13px; line-height: 1.5; }
  header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-size: 18px; margin: 0; } h2 { font-size: 14px; margin: 20px 0 6px; }
  .muted { color: #55666b; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: left; padding: 7px 6px; border-bottom: 1px solid #e3eaea; vertical-align: top; }
  th { font-size: 11px; font-weight: 500; color: #55666b; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  .sign { margin-top: 64px; width: 260px; border-top: 1px solid #132a2d; padding-top: 6px; }
`;

// Abre uma janela com o documento e chama a impressão (o navegador oferece "Salvar como PDF")
export function printDocument(title, bodyHtml) {
  const w = window.open("", "_blank", "width=860,height=1000");
  if (!w) return false;
  w.document
    .write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>${PRINT_CSS}</style></head><body>
    <header><div><h1>${esc(title)}</h1><div class="muted">VetCare · Clínica veterinária</div></div>
    <div class="muted">${new Date().toLocaleDateString("pt-BR")}</div></header>
    ${bodyHtml}
    <script>window.onload = () => { window.focus(); window.print(); };<\/script></body></html>`);
  w.document.close();
  return true;
}

export function tableHtml(header, rows, numericCols = []) {
  const th = header
    .map(
      (h, i) =>
        `<th class="${numericCols.includes(i) ? "n" : ""}">${esc(h)}</th>`,
    )
    .join("");
  const tr = rows
    .map(
      (r) =>
        `<tr>${r.map((c, i) => `<td class="${numericCols.includes(i) ? "n" : ""}">${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}
