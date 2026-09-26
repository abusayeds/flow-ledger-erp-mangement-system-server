/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PAYMENT RECEIPT PDF — layout matches product screenshot:
 *  - Centered title
 *  - Logo + company (name, country, email)
 *  - Received From block
 *  - Table: Payment # | Payment date | Amount | Payment Type
 *  - Signature
 *
 * Data source: PaymentModel (via resolvePaymentReceiptData).
 */
const PDFDocument = require("pdfkit");
const https = require("https");
const http = require("http");

const hexToRgb = (hex: any): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};

const loadImageBuffer = (src: string | null | undefined): Promise<Buffer | null> =>
  new Promise((resolve) => {
    if (!src || typeof src !== "string") return resolve(null);
    if (src.startsWith("data:")) {
      try {
        const b64 = src.split(",")[1];
        return resolve(Buffer.from(b64, "base64"));
      } catch {
        return resolve(null);
      }
    }
    if (!/^https?:\/\//i.test(src)) return resolve(null);
    const lib = src.startsWith("https") ? https : http;
    lib
      .get(src, (resp: any) => {
        const chunks: Buffer[] = [];
        resp.on("data", (c: Buffer) => chunks.push(c));
        resp.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", () => resolve(null));
  });

export const generatePaymentReceiptPDF = async (data: any, settings: any, res: any) => {
  const s = settings || {};
  const style = s.style || {};
  const footer = s.footer || {};

  const borderColor = style.border_color || "#000000";
  const textColor = style.text_color || "#000000";
  const rawMargin = style.margin || { top: 36, right: 36, bottom: 36, left: 36 };
  const PAGE_W = 595;
  const PAGE_H = 842;

  // The outer page border is drawn at BORDER_INSET from the page edge. Content
  // must stay inside it, so clamp the (settings-supplied) margins to at least
  // BORDER_INSET + a small gap — otherwise a small configured margin lets text
  // and the table cross/overlap the border.
  const BORDER_INSET = 18;
  const MIN_MARGIN = BORDER_INSET + 12;
  const margin = {
    top: Math.max(Number(rawMargin.top) || 36, MIN_MARGIN),
    right: Math.max(Number(rawMargin.right) || 36, MIN_MARGIN),
    bottom: Math.max(Number(rawMargin.bottom) || 36, MIN_MARGIN),
    left: Math.max(Number(rawMargin.left) || 36, MIN_MARGIN),
  };
  const CONTENT_W = PAGE_W - margin.left - margin.right;

  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="payment-receipt.pdf"');
  doc.pipe(res);

  const rgb = (hex: string) => hexToRgb(hex);
  const setFont = (bold = false, size = 10) =>
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);

  const drawText = (str: any, x: number, yy: number, opts: any = {}) => {
    setFont(opts.bold || false, opts.size || 10);
    doc.fillColor(rgb(opts.color || textColor));
    doc.text(String(str ?? ""), x, yy, {
      width: opts.width ?? CONTENT_W,
      align: opts.align ?? "left",
      lineBreak: opts.lineBreak !== undefined ? opts.lineBreak : false,
    });
  };

  const drawRect = (
    x: number,
    yy: number,
    w: number,
    h: number,
    fillHex: string | null,
    strokeHex: string | null,
  ) => {
    doc.save();
    if (fillHex) doc.fillColor(rgb(fillHex));
    if (strokeHex) doc.strokeColor(rgb(strokeHex)).lineWidth(0.8);
    if (fillHex && strokeHex) doc.rect(x, yy, w, h).fillAndStroke();
    else if (fillHex) doc.rect(x, yy, w, h).fill();
    else if (strokeHex) doc.rect(x, yy, w, h).stroke();
    doc.restore();
  };

  // Outer page border (screenshot style)
  doc
    .save()
    .strokeColor(rgb(borderColor))
    .lineWidth(1)
    .rect(BORDER_INSET, BORDER_INSET, PAGE_W - BORDER_INSET * 2, PAGE_H - BORDER_INSET * 2)
    .stroke()
    .restore();

  let y = margin.top;

  // ── Title ──────────────────────────────────────────────────────────────
  setFont(true, 16);
  doc.fillColor(rgb(textColor)).text(data?.title || "PAYMENT RECEIPT", margin.left, y, {
    width: CONTENT_W,
    align: "center",
  });
  y += 28;

  const leftX = margin.left;

  // ── Logo ───────────────────────────────────────────────────────────────
  const logoSize = 56;
  const logoBuf = await loadImageBuffer(data?.company?.logo);
  if (logoBuf) {
    try {
      doc.image(logoBuf, leftX, y, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
    } catch {
      drawRect(leftX, y, logoSize, logoSize, "#111111", "#000000");
    }
  } else {
    drawRect(leftX, y, logoSize, logoSize, "#111111", "#000000");
  }
  y += logoSize + 12;

  // ── Company block ──────────────────────────────────────────────────────
  const company = data?.company || {};
  if (company.name) {
    drawText(company.name, leftX, y, { bold: true, size: 11 });
    y += 14;
  }
  if (company.country) {
    drawText(company.country, leftX, y, { size: 10 });
    y += 13;
  }
  if (company.email) {
    drawText(company.email, leftX, y, { size: 10, color: "#0066cc" });
    y += 16;
  } else {
    y += 4;
  }

  // ── Received From ──────────────────────────────────────────────────────
  drawText("Received From:", leftX, y, { bold: true, size: 10 });
  y += 14;

  const lines: string[] = data?.receivedFrom?.lines?.length
    ? data.receivedFrom.lines
    : [
        data?.receivedFrom?.name,
        data?.receivedFrom?.companyName,
        data?.receivedFrom?.email,
        data?.receivedFrom?.mobile ? `Mobile: ${data.receivedFrom.mobile}` : null,
        data?.receivedFrom?.taxId,
        data?.receivedFrom?.regNo,
      ].filter((v: any) => v && v !== "N/A");

  lines.forEach((line: string) => {
    drawText(line, leftX, y, { size: 10 });
    y += 13;
  });
  y += 14;

  // ── Payment table ──────────────────────────────────────────────────────
  const pay = data?.payment || {};
  const cols = [
    { label: "Payment #", w: CONTENT_W * 0.22, value: pay.paymentNo },
    { label: "Payment date", w: CONTENT_W * 0.28, value: pay.date },
    { label: "Amount", w: CONTENT_W * 0.25, value: pay.amount },
    { label: "Payment Type", w: CONTENT_W * 0.25, value: pay.paymentType },
  ];
  // Fix last col width drift
  const used = cols.slice(0, 3).reduce((s, c) => s + c.w, 0);
  cols[3].w = CONTENT_W - used;

  const headerH = 18;
  const rowH = 18;
  let px = leftX;
  cols.forEach((col) => {
    drawRect(px, y, col.w, headerH, null, "#000000");
    drawText(col.label, px + 4, y + 4, { bold: true, size: 9, width: col.w - 8 });
    px += col.w;
  });
  y += headerH;

  px = leftX;
  cols.forEach((col) => {
    drawRect(px, y, col.w, rowH, null, "#000000");
    drawText(col.value ?? "N/A", px + 4, y + 4, { size: 9, width: col.w - 8 });
    px += col.w;
  });
  y += rowH + 40;

  // ── Signature ──────────────────────────────────────────────────────────
  const sigBuf = await loadImageBuffer(data?.signature?.image);
  const sigW = 120;
  const sigH = 40;
  if (sigBuf) {
    try {
      doc.image(sigBuf, leftX, y, { width: sigW, height: sigH, fit: [sigW, sigH] });
      y += sigH + 6;
    } catch {
      doc
        .save()
        .strokeColor(rgb("#000000"))
        .moveTo(leftX, y + 30)
        .lineTo(leftX + sigW, y + 30)
        .stroke()
        .restore();
      y += 40;
    }
  } else {
    doc
      .save()
      .strokeColor(rgb("#000000"))
      .moveTo(leftX, y + 30)
      .lineTo(leftX + sigW, y + 30)
      .stroke()
      .restore();
    y += 40;
  }

  // Footer (optional)
  if (footer.created_moon_invoice_hyperlink !== false) {
    setFont(false, 7);
    doc.fillColor(rgb("#999999")).text("Created by Qayd", margin.left, PAGE_H - margin.bottom - 8, {
      width: CONTENT_W,
      align: "center",
    });
  }

  doc.end();
};

module.exports = { generatePaymentReceiptPDF };
