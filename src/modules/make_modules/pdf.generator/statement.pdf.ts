/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ACCOUNT STATEMENT PDF — layout mirrors the app's on-device statement
 * (lib/shared/pdf/statement_pdf.dart) so switching to the server PDF keeps the
 * exact same document:
 *  - Centered "STATEMENT" title
 *  - Left: business block + "Statement To:"
 *  - Right: Date / Amount / Paid / Balance summary boxes
 *  - Table: Date | Details | Amount | Paid | Balance  (+ bold Total row)
 *  - "Authorised Signature" rule, optional footer
 *
 * Data source: StatementModel-less — built from invoices/bills + payments via
 * resolveStatementData.
 */
const PDFDocument = require("pdfkit");

const hexToRgb = (hex: any): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};

export const generateStatementPDF = async (data: any, settings: any, res: any) => {
  const d = data || {};
  const s = settings || {};
  const style = s.style || {};
  const footer = s.footer || {};

  const textColor = style.text_color || "#000000";
  const borderColor = style.border_color || "#BDBDBD";
  const fillColor = style.fill_color || style.header_color || "#F2F2F2";
  const margin = style.margin || { top: 28, right: 28, bottom: 28, left: 28 };

  const PAGE_W = 595;
  const PAGE_H = 842;
  const CONTENT_W = PAGE_W - margin.left - margin.right;

  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="statement.pdf"');
  doc.pipe(res);

  const rgb = (hex: string) => hexToRgb(hex);
  const setFont = (bold = false, size = 8) =>
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);

  const drawText = (str: any, x: number, y: number, opts: any = {}) => {
    setFont(opts.bold || false, opts.size || 8);
    doc.fillColor(rgb(opts.color || textColor));
    doc.text(String(str ?? ""), x, y, {
      width: opts.width ?? CONTENT_W,
      align: opts.align ?? "left",
      lineBreak: opts.lineBreak !== undefined ? opts.lineBreak : false,
    });
  };

  const drawRect = (x: number, y: number, w: number, h: number, fill: string | null) => {
    doc.save();
    if (fill) doc.fillColor(rgb(fill));
    doc.strokeColor(rgb(borderColor)).lineWidth(0.5);
    if (fill) doc.rect(x, y, w, h).fillAndStroke();
    else doc.rect(x, y, w, h).stroke();
    doc.restore();
  };

  let y = margin.top;

  // --- Title ---------------------------------------------------------------
  drawText(d.title || "STATEMENT", margin.left, y, {
    bold: true,
    size: 14,
    align: "center",
    width: CONTENT_W,
  });
  y += 26;

  // --- Header: business / statement-to (left) + summary boxes (right) ------
  const summaryW = 150;
  const leftW = CONTENT_W - summaryW - 16;
  let leftY = y;

  const showBusiness = style.show_company_name !== false;
  if (showBusiness) {
    drawText(d.businessName, margin.left, leftY, { bold: true, width: leftW });
    leftY += 11;
    for (const line of d.businessLines || []) {
      drawText(line, margin.left, leftY, { width: leftW });
      leftY += 10;
    }
  }
  if ((d.statementTo || []).length) {
    if (showBusiness) leftY += 8;
    drawText("Statement To:", margin.left, leftY, { bold: true, width: leftW });
    leftY += 11;
    for (const line of d.statementTo) {
      drawText(line, margin.left, leftY, { width: leftW });
      leftY += 10;
    }
  }

  // Summary boxes: label cell (filled) + value cell, stacked.
  const sx = margin.left + CONTENT_W - summaryW;
  const labelW = 60;
  const valueW = summaryW - labelW;
  const rowH = 15;
  let sy = y;
  const summary: [string, any][] = [
    ["Date", d.date],
    ["Amount", d.amount],
    ["Paid", d.paid],
    ["Balance", d.balance],
  ];
  for (const [label, value] of summary) {
    drawRect(sx, sy, labelW, rowH, fillColor);
    drawRect(sx + labelW, sy, valueW, rowH, null);
    drawText(label, sx + 4, sy + 4, { bold: true, width: labelW - 8 });
    drawText(value ?? "", sx + labelW + 4, sy + 4, { width: valueW - 8 });
    sy += rowH;
  }

  y = Math.max(leftY, sy) + 18;

  // --- Transactions table --------------------------------------------------
  // Flex 2:4:2:2:2 — same proportions as the app's layout.
  const units = 12;
  const u = CONTENT_W / units;
  const cols = [
    { title: "Date", w: u * 2, align: "left" },
    { title: "Details", w: u * 4, align: "left" },
    { title: "Amount", w: u * 2, align: "right" },
    { title: "Paid", w: u * 2, align: "right" },
    { title: "Balance", w: u * 2, align: "right" },
  ];
  const cellH = 16;

  const drawRow = (
    values: any[],
    opts: { header?: boolean; bold?: boolean } = {},
  ) => {
    // New page when the row wouldn't fit above the bottom margin.
    if (y + cellH > PAGE_H - margin.bottom) {
      doc.addPage();
      y = margin.top;
    }
    let x = margin.left;
    cols.forEach((c, i) => {
      drawRect(x, y, c.w, cellH, opts.header ? fillColor : null);
      drawText(values[i] ?? "", x + 4, y + 5, {
        bold: opts.header || opts.bold,
        width: c.w - 8,
        align: c.align,
      });
      x += c.w;
    });
    y += cellH;
  };

  drawRow(cols.map((c) => c.title), { header: true });
  for (const r of d.rows || []) {
    drawRow([r.date, r.details, r.amount, r.paid, r.balance]);
  }
  if (d.total) {
    drawRow([d.total.date, d.total.details, d.total.amount, d.total.paid, d.total.balance], {
      bold: true,
    });
  }

  // --- Signature -----------------------------------------------------------
  if (style.show_signature !== false) {
    y += 40;
    if (y + 20 > PAGE_H - margin.bottom) {
      doc.addPage();
      y = margin.top;
    }
    doc.save();
    doc.strokeColor(rgb(borderColor)).lineWidth(0.5);
    doc.moveTo(margin.left, y).lineTo(margin.left + 120, y).stroke();
    doc.restore();
    drawText("Authorised Signature", margin.left, y + 3, { width: 160 });
  }

  // --- Footer --------------------------------------------------------------
  const footerText = footer.text || "Thank you for your business.";
  if (footer.show_powered_by || style.show_footer) {
    drawText(footerText, margin.left, PAGE_H - margin.bottom - 12, {
      align: "center",
      width: CONTENT_W,
    });
  }

  doc.end();
};
