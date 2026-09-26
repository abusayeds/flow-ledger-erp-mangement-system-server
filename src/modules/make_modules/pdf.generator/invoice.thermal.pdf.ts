const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
import { PassThrough } from "stream";
import { NA } from "./pdf.data";

/** Load an image (signature / payment-method logo) into a Buffer for
 * `doc.image`. Handles data: URIs and uploaded files served from `public/`.
 * Returns null when the source is missing/unreadable. */
const loadImg = (src: any): Buffer | null => {
  if (!src || typeof src !== "string") return null;
  try {
    if (src.startsWith("data:")) return Buffer.from(src.split(",")[1], "base64");
    if (src.startsWith("/")) {
      const abs = path.join(process.cwd(), "public", src);
      return fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    }
  } catch {
    return null;
  }
  return null;
};

/** true when a resolved value carries real content (not empty / the "N/A" sentinel). */
const has = (v: any): boolean => {
  const s = String(v ?? "").trim();
  return s !== "" && s !== NA && s !== "-";
};

/** Plain number → "1,730" / "25.5" (grouped, up to 2 decimals, no currency). */
const plain = (n: any): string =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "1,730 BDT" — grouped amount with the currency code trailing. */
const fmtMoney = (n: any, cur: string): string => `${plain(n)} ${cur}`.trim();

/** Pull the numeric value out of a preformatted money string like "BDT 25.00". */
const numOf = (s: any): number => {
  const m = String(s ?? "").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(m);
  return Number.isFinite(n) ? n : 0;
};

/** Trim a quantity string ("50.000" → "50", "1.500" → "1.5"). */
const trimNum = (s: any): string => {
  const n = Number(s);
  if (!Number.isFinite(n)) return String(s ?? "");
  return plain(n);
};

// 80mm thermal roll geometry (width matches the reference: 80mm = 226.77pt).
const PAGE_W = 226.77;
const M = 8;
const CW = PAGE_W - M * 2;

/**
 * Renders the invoice (any sales doc) onto an 80mm thermal roll, mirroring the
 * full A4 content — centered company header, meta, accepted-payment logos,
 * Invoice-To / Ship-To, itemised body with descriptions, totals, terms, notes
 * and the captured signature. Monochrome, small type, dashed-free thin rules.
 *
 * `draw` runs twice: first onto a throwaway page to measure the content height,
 * then onto the real page sized to fit (thermal rolls have no fixed length).
 */
export const generateInvoiceThermalPDF = async (data: any, settings: any, res: any) => {
  const s = settings || {};
  const header = s.header || {};
  const company = s.company || {};
  const contact = s.contact || {};
  const summary = s.summary || {};
  const noteTerms = s.notes_terms || {};
  const signature = s.signature || {};
  const footer = s.footer || {};

  const cur = data.currency || "USD";
  const sm = data.summary || {};

  // The full drawing routine — returns the final Y so the caller can size the
  // page. Kept side-effect-only on `doc` (no res writes) so it can run twice.
  const draw = (doc: any): number => {
    let y = M;

    const font = (bold: boolean, size: number) =>
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);

    // One full-width text block; advances y by the measured height.
    const line = (
      str: any,
      opts: { bold?: boolean; size?: number; align?: string; color?: string; x?: number; width?: number; gap?: number } = {},
    ) => {
      const size = opts.size ?? 7.5;
      const width = opts.width ?? CW;
      const x = opts.x ?? M;
      font(opts.bold || false, size);
      const h = doc.heightOfString(String(str ?? ""), { width });
      doc.fillColor(opts.color || "#000000").text(String(str ?? ""), x, y, {
        width,
        align: opts.align || "left",
        lineBreak: true,
      });
      y += h + (opts.gap ?? 1);
    };

    // Two independent columns sharing one baseline; returns the taller bottom.
    const twoCol = (
      left: () => number,
      right: () => number,
    ) => {
      const top = y;
      y = top;
      const lb = left();
      y = top;
      const rb = right();
      y = Math.max(lb, rb);
    };

    const rule = () => {
      doc.save().lineWidth(0.5).strokeColor("#000000")
        .moveTo(M, y + 2).lineTo(PAGE_W - M, y + 2).stroke().restore();
      y += 6;
    };

    // ── Header (centered company block) ──────────────────────────────────
    if (header.header !== false) {
      line(data.docTitle || "INVOICE", { bold: true, size: 15, align: "center", gap: 3 });
      if (company.name !== false && has(data.company?.name)) {
        line(data.company.name, { bold: true, size: 11, align: "center" });
      }
      if (company.address !== false && has(data.company?.address)) {
        String(data.company.address).split("\n").forEach((l: string) => {
          if (l.trim()) line(l.trim(), { size: 7, align: "center" });
        });
      }
      if (company.phone !== false && has(data.company?.phone)) {
        line(`Phone: ${data.company.phone}`, { size: 7, align: "center" });
      }
      if (company.email !== false && has(data.company?.email)) {
        line(data.company.email, { size: 7, align: "center", color: "#0066cc" });
      }
      y += 2;
      rule();
    }

    // ── Meta: Invoice # / P.O. #, Total / Outstanding ────────────────────
    {
      const halfW = CW / 2 - 2;
      const metaRow = (l: string, r: string) => {
        const top = y;
        font(false, 8);
        const lh = doc.heightOfString(l, { width: halfW });
        const rh = doc.heightOfString(r, { width: halfW });
        doc.fillColor("#000000").text(l, M, top, { width: halfW, lineBreak: true });
        doc.text(r, M + halfW + 4, top, { width: halfW, align: "right", lineBreak: true });
        y = top + Math.max(lh, rh) + 1;
      };
      metaRow(
        `Invoice #: ${has(data.invoiceNumber) ? data.invoiceNumber : "-"}`,
        has(data.poNumber) ? `P.O. #: ${data.poNumber}` : "",
      );
      metaRow(
        `Total: ${fmtMoney(sm.total, cur)}`,
        `Outstanding: ${fmtMoney(sm.amountDue, cur)}`,
      );
      rule();
    }

    // ── Accepted payment methods (logos) ─────────────────────────────────
    if (Array.isArray(data.paymentMethods) && data.paymentMethods.length) {
      line("We accept payment by", { size: 7, color: "#555555" });
      const logoSz = 16;
      const g = 3;
      let px = M;
      let rowY = y;
      data.paymentMethods.forEach((m: any) => {
        if (px + logoSz > PAGE_W - M) { px = M; rowY += logoSz + g; }
        const buf = loadImg(m.logo);
        if (buf) {
          try { doc.image(buf, px, rowY, { fit: [logoSz, logoSz] }); } catch { /* skip */ }
        }
        px += logoSz + g;
      });
      y = rowY + logoSz + 4;
      rule();
    }

    // ── Invoice To / Ship To ─────────────────────────────────────────────
    {
      const halfW = CW / 2 - 3;
      const leftX = M;
      const rightX = M + halfW + 6;
      const col = (x: number) => (str: any, o: { bold?: boolean; color?: string; size?: number } = {}) => {
        const size = o.size ?? 7;
        font(o.bold || false, size);
        const h = doc.heightOfString(String(str ?? ""), { width: halfW });
        doc.fillColor(o.color || "#000000").text(String(str ?? ""), x, y, { width: halfW, lineBreak: true });
        y += h + 1;
      };

      twoCol(
        () => {
          const L = col(leftX);
          L(data.billLabel || "Invoice To:", { bold: true });
          if (contact.first_last_name !== false && has(data.billTo?.name)) L(data.billTo.name, { bold: true });
          if (contact.email !== false && has(data.billTo?.email)) L(data.billTo.email, { color: "#0066cc" });
          if (contact.business_phone !== false && has(data.billTo?.businessPhone)) L(`Business Phone: ${data.billTo.businessPhone}`);
          if (has(data.billTo?.taxId)) L(`Fax: ${data.billTo.taxId}`);
          if (contact.reg_no !== false && has(data.billTo?.regNo)) L(`Reg. No: ${data.billTo.regNo}`);
          if (contact.tax_id !== false && has(data.billTo?.contactTaxId)) L(`Tax ID: ${data.billTo.contactTaxId}`);
          return y;
        },
        () => {
          const R = col(rightX);
          R("Ship To:", { bold: true });
          if (has(data.shipTo?.address)) {
            String(data.shipTo.address).split("\n").forEach((l: string) => { if (l.trim()) R(l.trim()); });
          }
          return y;
        },
      );
      if (has(data.shipTo?.shippingMethod)) {
        y += 2;
        line(`Shipping Method: ${data.shipTo.shippingMethod}`, { size: 7 });
      }
      rule();
    }

    // ── Sub-title ────────────────────────────────────────────────────────
    if (header.sub_title !== false && has(data.subTitle)) {
      line(data.subTitle, { bold: true, size: 9, align: "center", gap: 2 });
      rule();
    }

    // ── Items ────────────────────────────────────────────────────────────
    const items = [...(data.products || []), ...(data.services || [])];
    if (items.length) {
      line("Items", { bold: true, size: 8 });
      // Column header row.
      const cQty = CW * 0.34, cRate = CW * 0.30, cAmt = CW * 0.36;
      const headRow = () => {
        const top = y;
        font(true, 7);
        doc.fillColor("#000000").text("Quantity", M, top, { width: cQty });
        doc.text("Rate", M + cQty, top, { width: cRate });
        doc.text("Amount", M + cQty + cRate, top, { width: cAmt, align: "right" });
        y = top + 10;
      };
      headRow();
      doc.save().lineWidth(0.4).strokeColor("#000000")
        .moveTo(M, y).lineTo(PAGE_W - M, y).stroke().restore();
      y += 3;

      items.forEach((it: any) => {
        line(has(it.name) ? it.name : "Item", { bold: true, size: 7.5 });
        const top = y;
        font(false, 7);
        doc.fillColor("#000000").text(trimNum(it.quantity), M, top, { width: cQty });
        doc.text(plain(numOf(it.unitPrice ?? it.rate)), M + cQty, top, { width: cRate });
        doc.text(plain(numOf(it.amount)), M + cQty + cRate, top, { width: cAmt, align: "right" });
        y = top + 9;
        if (has(it.description)) line(it.description, { size: 6.5, color: "#666666" });
        y += 2;
      });
      rule();
    }

    // ── Totals ───────────────────────────────────────────────────────────
    {
      const rows: [string, string, boolean?][] = [];
      if (summary.sub_total !== false) rows.push(["Sub Total", fmtMoney(sm.subTotal, cur)]);
      if (summary.deposit !== false && sm.deposit > 0) rows.push(["Deposit", fmtMoney(sm.deposit, cur)]);
      if (summary.discount !== false && sm.discountAmount > 0) rows.push([`Discount ${sm.discountPercent}%`, fmtMoney(sm.discountAmount, cur)]);
      if (summary.inline_discount !== false && sm.inlineDiscount > 0) rows.push(["Inline Discount", fmtMoney(sm.inlineDiscount, cur)]);
      if (summary.shipping_cost !== false && sm.shippingCost > 0) rows.push(["Shipping Cost", fmtMoney(sm.shippingCost, cur)]);
      if (summary.tax !== false) {
        if (Array.isArray(sm.taxBreakdown) && sm.taxBreakdown.length > 0) {
          for (const t of sm.taxBreakdown) rows.push([`${t.name} ${t.rate}%`, fmtMoney(t.amount, cur)]);
        } else if (sm.tax > 0) rows.push(["Tax", fmtMoney(sm.tax, cur)]);
      }
      if (summary.total !== false) rows.push(["Total", fmtMoney(sm.total, cur), true]);
      if (summary.amount_paid !== false) rows.push(["Amount Paid", fmtMoney(sm.amountPaid, cur), true]);
      if (summary.deposit !== false && sm.deposit > 0) rows.push(["Deposit Due", fmtMoney(sm.depositDue, cur), true]);
      if (summary.amount_due !== false) rows.push(["Amount Due", fmtMoney(sm.amountDue, cur), true]);

      rows.forEach(([label, value, strong]) => {
        const top = y;
        font(!!strong, 8);
        const lh = doc.heightOfString(label, { width: CW * 0.5 });
        doc.fillColor("#000000").text(label, M, top, { width: CW * 0.5 });
        doc.text(value, M + CW * 0.5, top, { width: CW * 0.5, align: "right" });
        y = top + Math.max(lh, 10);
      });
      rule();
    }

    // ── Terms & Notes ────────────────────────────────────────────────────
    if (noteTerms.terms_and_condition !== false && has(data.termsAndConditions)) {
      line("Terms & Conditions", { bold: true, size: 7.5 });
      line(data.termsAndConditions, { size: 7, color: "#333333", gap: 3 });
    }
    if (noteTerms.notes !== false && has(data.notes)) {
      line("Notes", { bold: true, size: 7.5 });
      line(data.notes, { size: 7, color: "#333333", gap: 3 });
    }

    // ── Signature ────────────────────────────────────────────────────────
    y += 10;
    if (signature.company_sign !== "hide") {
      const sigBuf = loadImg(data.signature?.companyImage);
      if (sigBuf) {
        y += 4;
        try {
          doc.image(sigBuf, M + CW / 2 - 40, y, { fit: [80, 30], align: "center" });
          y += 32;
        } catch { /* ignore undecodable image */ }
      }
      line("Authorized Signatory", { size: 6.5, align: "center", color: "#666666", gap: 2 });
    }
    const customerSrc = data.signature?.customerImage || data.signature?.image;
    if (signature.contact_sign !== false && customerSrc) {
      const custBuf = loadImg(customerSrc);
      if (custBuf) {
        y += 6;
        try {
          doc.image(custBuf, M + CW / 2 - 40, y, { fit: [80, 30], align: "center" });
          y += 32;
        } catch { /* ignore */ }
      }
      line("Customer Signature", { size: 6.5, align: "center", color: "#666666", gap: 2 });
    }

    // ── Footer ───────────────────────────────────────────────────────────
    y += 4;
    doc.save().lineWidth(0.5).strokeColor("#000000")
      .moveTo(M, y).lineTo(PAGE_W - M, y).stroke().restore();
    y += 5;
    line("Thank You!", { bold: true, size: 9, align: "center" });
    if (footer.created_moon_invoice_hyperlink !== false) {
      line("Created by Qayd", { size: 6, align: "center", color: "#999999" });
    }

    return y;
  };

  // Pass 1 — measure content height on a throwaway page (drained, not returned).
  const measure = new PDFDocument({ size: [PAGE_W, 20000], margins: { top: 0, left: 0, right: 0, bottom: 0 } });
  const sink = new PassThrough();
  sink.resume();
  measure.pipe(sink);
  const contentH = draw(measure);
  measure.end();

  // Pass 2 — real page sized to the measured content.
  const doc = new PDFDocument({
    size: [PAGE_W, Math.ceil(contentH + M)],
    margins: { top: 0, left: 0, right: 0, bottom: 0 },
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="invoice-thermal.pdf"');
  doc.pipe(res);
  draw(doc);
  doc.end();
};

module.exports = { generateInvoiceThermalPDF };
