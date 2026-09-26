/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, no-undef */
import { Response } from "express";
const PDFDocument = require("pdfkit");

const hexToRgb = (hex: any): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};

const money = (n: any) => (Number(n) || 0).toFixed(2);
const dateStr = (d: any) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/** Render a real purchase invoice to a streamed PDF (style driven by the company PDF settings). */
export const generatePurchaseInvoicePDF = (invoice: any, settings: any, res: Response) => {
  const style = (settings && settings.style) || {};
  const fill = style.fill_color || "#3a4a6b";
  const fillText = style.fill_text_color || "#ffffff";
  const border = style.border_color || "#cccccc";
  const text = style.text_color || "#000000";

  const PAGE_W = 595;
  const margin = 36;
  const CONTENT_W = PAGE_W - margin * 2;
  const rgb = (hex: string) => hexToRgb(hex);

  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoice_number || "purchase-invoice"}.pdf"`);
  doc.pipe(res);

  let y = margin;
  const setFont = (bold = false, size = 9) => doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
  const drawText = (str: any, x: number, yy: number, opts: any = {}) => {
    setFont(opts.bold || false, opts.size || 9);
    doc.fillColor(rgb(opts.color || text));
    doc.text(String(str ?? ""), x, yy, { width: opts.width ?? CONTENT_W, align: opts.align ?? "left", lineBreak: opts.lineBreak ?? false });
  };
  const rect = (x: number, yy: number, w: number, h: number, fillHex: string | null, strokeHex: string | null) => {
    doc.save();
    if (fillHex) doc.fillColor(rgb(fillHex));
    if (strokeHex) doc.strokeColor(rgb(strokeHex));
    if (fillHex && strokeHex) doc.rect(x, yy, w, h).fillAndStroke();
    else if (fillHex) doc.rect(x, yy, w, h).fill();
    else if (strokeHex) doc.rect(x, yy, w, h).stroke();
    doc.restore();
  };

  // ── Title ──
  setFont(true, 18);
  doc.fillColor(rgb(text)).text("PURCHASE INVOICE", margin, y, { width: CONTENT_W, align: "center" });
  y += 26;

  // ── Meta box (number / dates / status) ──
  const meta: [string, string][] = [
    ["Invoice #", invoice.invoice_number || ""],
    ["Invoice Date", dateStr(invoice.date)],
    ["Due Date", dateStr(invoice.due_date)],
    ["Status", String(invoice.status || "").toUpperCase()],
  ];
  meta.forEach((row, i) => {
    const rowH = 16;
    const ry = y + i * rowH;
    rect(margin + CONTENT_W * 0.5, ry, CONTENT_W * 0.5, rowH, i % 2 === 0 ? "#f0f4ff" : "#ffffff", border);
    drawText(row[0], margin + CONTENT_W * 0.5 + 4, ry + 4, { bold: true, width: CONTENT_W * 0.24 });
    drawText(row[1], margin + CONTENT_W * 0.74, ry + 4, { width: CONTENT_W * 0.24, align: "right" });
  });

  // ── Vendor / Warehouse ──
  const vendor = invoice.vendor_id || {};
  const wh = invoice.warehouse_id || {};
  let leftY = y;
  drawText("Vendor:", margin, leftY, { bold: true }); leftY += 13;
  drawText(vendor.name || "-", margin, leftY); leftY += 12;
  if (vendor.email) { drawText(vendor.email, margin, leftY, { color: "#0066cc" }); leftY += 12; }
  if (wh && wh.name) {
    leftY += 4;
    drawText("Warehouse:", margin, leftY, { bold: true }); leftY += 13;
    drawText(wh.name, margin, leftY); leftY += 12;
    if (wh.address) { drawText(`${wh.address}${wh.city ? ", " + wh.city : ""}`, margin, leftY); leftY += 12; }
  }
  y = Math.max(leftY, y + meta.length * 16) + 12;

  // ── Items table ──
  const lineItems = [...(invoice.product || []), ...(invoice.service || [])];
  const cols = [
    { label: "Item", w: CONTENT_W - 0.5 * CONTENT_W, key: "name", align: "left" },
    { label: "Qty", w: CONTENT_W * 0.1, key: "quantity" },
    { label: "Rate", w: CONTENT_W * 0.14, key: "rate" },
    { label: "Disc", w: CONTENT_W * 0.1, key: "discount" },
    { label: "Tax", w: CONTENT_W * 0.1, key: "tax" },
    { label: "Amount", w: CONTENT_W * 0.16, key: "amount" },
  ];
  let hx = margin;
  cols.forEach((c) => {
    rect(hx, y, c.w, 16, fill, border);
    setFont(true, 8);
    doc.fillColor(rgb(fillText)).text(c.label, hx + 2, y + 4, { width: c.w - 4, align: (c.align as any) || "center" });
    hx += c.w;
  });
  y += 16;

  lineItems.forEach((it: any, i: number) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
    let cx = margin;
    const product = it.product_id || {};
    const service = it.service_id || {};
    const cells = [
      { v: product.productName || product.sku || service.name || "-", align: "left" },
      { v: it.quantity },
      { v: money(it.rate) },
      { v: money(it.discount) },
      { v: money(it.tax) },
      { v: money(it.amount) },
    ];
    cols.forEach((c, ci) => {
      rect(cx, y, c.w, 15, bg, border);
      setFont(false, 8);
      doc.fillColor(rgb(text)).text(String(cells[ci].v ?? ""), cx + 2, y + 3, { width: c.w - 4, align: (cells[ci].align as any) || "center", lineBreak: false });
      cx += c.w;
    });
    y += 15;
  });
  y += 8;

  // ── Summary ──
  const rows: [string, string, boolean?][] = [
    ["Subtotal", money(invoice.sub_total)],
    ["Discount", money(invoice.discount)],
    ["Shipping", money(invoice.shipping_cost)],
    ["Tax", money(invoice.tax)],
    ["Total", money(invoice.total), true],
    ["Paid", money(invoice.paid_amount)],
    ["Debit Note Applied", money(invoice.debit_note_applied)],
    ["Balance Due", money(invoice.balance_amount), true],
  ];
  const sumX = margin + CONTENT_W * 0.55;
  const sumW = CONTENT_W * 0.45;
  rows.forEach((row, i) => {
    const rowH = 14;
    const bold = !!row[2];
    const bg = bold ? "#e8edf5" : i % 2 === 0 ? "#f9f9f9" : "#ffffff";
    rect(sumX, y, sumW, rowH, bg, border);
    drawText(row[0], sumX + 4, y + 3, { bold, width: sumW * 0.55 });
    drawText(row[1], sumX + sumW * 0.55, y + 3, { bold, width: sumW * 0.42, align: "right" });
    y += rowH;
  });

  if (invoice.notes) {
    y += 12;
    drawText("Notes:", margin, y, { bold: true }); y += 12;
    setFont(false, 8);
    doc.fillColor(rgb("#333333")).text(String(invoice.notes), margin, y, { width: CONTENT_W * 0.5, lineBreak: true });
  }

  doc.end();
};
