const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/** Load an image (signature/attachment) into a Buffer for `doc.image`.
 * Handles data: URIs and uploaded files served from `public/` (e.g. a stored
 * "/files/xyz.png"). Returns null when the source is missing/unreadable. */
const loadSignatureBuffer = (src: any): Buffer | null => {
  if (!src || typeof src !== "string") return null;
  try {
    if (src.startsWith("data:")) return Buffer.from(src.split(",")[1], "base64");
    // Uploaded files live under public/ and are served at the same path.
    if (src.startsWith("/")) {
      const abs = path.join(process.cwd(), "public", src);
      return fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    }
  } catch {
    return null;
  }
  return null;
};

// ─── Amount → words (currency-aware) ─────────────────────────────────────────
const _ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const _TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const _chunk = (x: number): string =>
  x === 0 ? "" :
  x < 20 ? _ONES[x] :
  x < 100 ? `${_TENS[Math.floor(x / 10)]}${x % 10 ? " " + _ONES[x % 10] : ""}` :
  `${_ONES[Math.floor(x / 100)]} Hundred${x % 100 ? " " + _chunk(x % 100) : ""}`;
const _intWords = (n: number): string => {
  if (n === 0) return "Zero";
  const scales: [number, string][] = [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"], [1, ""]];
  let rest = Math.floor(n);
  const parts: string[] = [];
  for (const [v, name] of scales) {
    const q = Math.floor(rest / v);
    if (q) { parts.push(`${_chunk(q)}${name ? " " + name : ""}`); rest %= v; }
  }
  return parts.join(" ") || "Zero";
};
const _CURRENCY_UNITS: Record<string, [string, string]> = {
  BDT: ["Takas", "Paisas"], USD: ["Dollars", "Cents"], EUR: ["Euros", "Cents"],
  GBP: ["Pounds", "Pence"], INR: ["Rupees", "Paise"], AUD: ["Dollars", "Cents"],
  CAD: ["Dollars", "Cents"], PKR: ["Rupees", "Paisas"], AED: ["Dirhams", "Fils"],
};
/** e.g. amountToWords(6201.52, "BDT") -> "Six Thousand Two Hundred One Takas and Fifty Two Paisas". */
const amountToWords = (amount: number, currency: string): string => {
  const cur = (currency || "USD").toUpperCase();
  const [major, minor] = _CURRENCY_UNITS[cur] || [cur, "Cents"];
  const abs = Math.abs(Number(amount) || 0);
  const whole = Math.floor(abs);
  const frac = Math.round((abs - whole) * 100);
  const words = `${_intWords(whole)} ${major}`;
  return frac > 0 ? `${words} and ${_intWords(frac)} ${minor}` : words;
};

// ─── Color Helper ────────────────────────────────────────────────────────────
const hexToRgb = (hex: any): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};


// ════════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ════════════════════════════════════════════════════════════════════════════
export const generateInvoicePDF = async (data: any, settings: any, res: any) => {
  const s    = settings || {};

  const style     = s.style       || {};
  const columns   = s.columns     || {};
  const header    = s.header      || {};
  const company   = s.company     || {};
  const contact   = s.contact     || {};
  const summary   = s.summary     || {};
  const noteTerms = s.notes_terms || {};
  const signature = s.signature   || {};
  const footer    = s.footer      || {};

  // ── Colors ──────────────────────────────────────────────────────────────
  const fillColor     = style.fill_color      || "#3a4a6b";
  const fillTextColor = style.fill_text_color  || "#ffffff";
  const borderColor   = style.border_color    || "#cccccc";
  const textColor     = style.text_color      || "#000000";

  // ── Font size ────────────────────────────────────────────────────────────
  const fontSizeMap: any = { small: 7, normal: 8, medium: 8, large: 9, big: 9 };
  const baseFontSize = (typeof style.font_size === "number"
    ? style.font_size
    : (String(style.font_size ?? "").trim() !== "" && !isNaN(Number(style.font_size))
        ? Number(style.font_size)
        : fontSizeMap[style.font_size])) || 8;

  // ── Page metrics ─────────────────────────────────────────────────────────
  const margin    = style.margin || { top: 30, right: 30, bottom: 30, left: 30 };
  const PAGE_W    = 595;
  const PAGE_H    = 842;
  const CONTENT_W = PAGE_W - margin.left - margin.right;

  // Leave room for footer + outer-border stroke at the bottom
  const BOTTOM_LIMIT = PAGE_H - margin.bottom - 40;

  // ── PDFKit — bufferPages so we can walk back and draw borders ────────────
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="purchase-order.pdf"');
  doc.pipe(res);

  let y         = margin.top;
  let pageCount = 1;

  // ════════════════════════════════════════════════════════════════════════
  // PRIMITIVE HELPERS
  // ════════════════════════════════════════════════════════════════════════
  const rgb = (hex: any) => hexToRgb(hex);

  const setFont = (bold = false, size = baseFontSize) =>
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);

  const drawRect = (
    x: number, yy: number, w: number, h: number,
    fillHex: string | null, strokeHex: string | null
  ) => {
    doc.save();
    if (fillHex)   doc.fillColor(rgb(fillHex));
    if (strokeHex) doc.strokeColor(rgb(strokeHex));
    if (fillHex && strokeHex) doc.rect(x, yy, w, h).fillAndStroke();
    else if (fillHex)         doc.rect(x, yy, w, h).fill();
    else if (strokeHex)       doc.rect(x, yy, w, h).stroke();
    doc.restore();
  };

  const drawText = (str: any, x: number, yy: number, opts: any = {}) => {
    setFont(opts.bold || false, opts.size || baseFontSize);
    doc.fillColor(rgb(opts.color || textColor));
    doc.text(String(str ?? ""), x, yy, {
      width:     opts.width    ?? CONTENT_W,
      align:     opts.align    ?? "left",
      lineBreak: opts.lineBreak !== undefined ? opts.lineBreak : false,
    });
  };

  // ════════════════════════════════════════════════════════════════════════
  // PER-PAGE DECORATIONS  (footer + outer border)
  // ════════════════════════════════════════════════════════════════════════
  const decorateCurrentPage = () => {
    // ── Footer ──
    if (footer.created_moon_invoice_hyperlink !== false) {
      setFont(false, 7);
      doc.fillColor(rgb("#999999")).text(
        "Created by Qayd",
        margin.left,
        PAGE_H - margin.bottom - 12,
        { width: CONTENT_W, align: "center" }
      );
    }

    // ── Outer border — drawn on EVERY page ──
    if (style.outer_border !== "hide") {
      doc.save()
        .strokeColor(rgb(borderColor))
        .lineWidth(0.75)
        .rect(
          margin.left  - 5,
          margin.top   - 5,
          CONTENT_W    + 10,
          PAGE_H - margin.top - margin.bottom + 10
        )
        .stroke()
        .restore();
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // PAGE BREAK
  // ════════════════════════════════════════════════════════════════════════
  const checkPageBreak = (neededHeight: number, onNewPage?: () => void) => {
    if (y + neededHeight > BOTTOM_LIMIT) {
      decorateCurrentPage();   // ✅ decorate BEFORE leaving the current page
      doc.addPage();
      pageCount++;
      y = margin.top;
      if (onNewPage) onNewPage();
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // TABLE HELPERS
  // ════════════════════════════════════════════════════════════════════════
  const drawTableHeader = (cols: any[], x: number, yy: number, rowH = 16): number => {
    let cx = x;
    cols.forEach((col) => {
      drawRect(cx, yy, col.w, rowH, fillColor, borderColor);
      setFont(true, baseFontSize - 0.5);
      doc.fillColor(rgb(fillTextColor)).text(col.label, cx + 2, yy + 4, {
        width: col.w - 4, align: col.align || "center",
      });
      cx += col.w;
    });
    return yy + rowH;
  };

  const drawTableRow = (
    cells: any[], x: number, yy: number, rowH: number, rowIndex: number
  ): number => {
    const bg = rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9";
    let cx = x;
    cells.forEach((cell) => {
      drawRect(cx, yy, cell.w, rowH, bg,
        style.vertical_lines !== "hide" ? borderColor : null);
      if (style.horizontal_lines !== "hide") {
        doc.save().strokeColor(rgb(borderColor))
          .moveTo(cx, yy + rowH).lineTo(cx + cell.w, yy + rowH)
          .stroke().restore();
      }
      setFont(cell.bold || false, baseFontSize - 0.5);
      doc.fillColor(rgb(textColor)).text(String(cell.value ?? ""), cx + 2, yy + 3, {
        width: cell.w - 4, align: cell.align || "center", lineBreak: false,
      });
      cx += cell.w;
    });
    return yy + rowH;
  };

  const drawDescRow = (description: string, rowIndex: number, tableX: number) => {
    const descH = 18;
    drawRect(tableX, y, CONTENT_W, descH,
      rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9", null);
    if (style.horizontal_lines !== "hide") {
      doc.save().strokeColor(rgb(borderColor))
        .moveTo(tableX, y + descH).lineTo(tableX + CONTENT_W, y + descH)
        .stroke().restore();
    }
    setFont(false, baseFontSize - 1);
    doc.fillColor(rgb("#555555")).text(description, tableX + 40, y + 3, {
      width: CONTENT_W - 50, lineBreak: false,
    });
    y += descH;
  };

  // ════════════════════════════════════════════════════════════════════════
  // COLUMN BUILDERS
  // ════════════════════════════════════════════════════════════════════════
  const buildProdCols = (): any[] => {
    const c: any[] = [];
    if (columns.serial     !== false)  c.push({ label: "Sr. No.",   w: 38, key: "srNo" });
    c.push({ label: "Products",         w: 0,  key: "name",    align: "left" });
    if (columns.hsn        !== false)  c.push({ label: "H S N",     w: 52, key: "hsn" });
    if (columns.quntity    !== "hide") c.push({ label: "Quantity",   w: 48, key: "quantity" });
    c.push({ label: "Unit\nPrice",       w: 48, key: "unitPrice" });
    if (columns.discount   !== false)  c.push({ label: "Discount",   w: 48, key: "discount" });
    if (columns.tax        !== "hide") c.push({ label: "G S T",      w: 38, key: "gst" });
    if (columns.line_total !== false)  c.push({ label: "Amount",     w: 50, key: "amount" });
    const fix = c.filter(x => x.key !== "name").reduce((s, x) => s + x.w, 0);
    const nc  = c.find(x => x.key === "name"); if (nc) nc.w = CONTENT_W - fix;
    return c;
  };

  const buildSvcCols = (): any[] => {
    const c: any[] = [];
    if (columns.serial     !== false)  c.push({ label: "Sr. No.",   w: 38, key: "srNo" });
    c.push({ label: "Services",         w: 0,  key: "name",    align: "left" });
    if (columns.sac        !== false)  c.push({ label: "S A C",     w: 52, key: "sac" });
    if (columns.quntity    !== "hide") c.push({ label: "Quantity",   w: 48, key: "quantity" });
    c.push({ label: "Rate",              w: 48, key: "rate" });
    if (columns.discount   !== false)  c.push({ label: "Discount",   w: 48, key: "discount" });
    if (columns.tax        !== "hide") c.push({ label: "G S T",      w: 38, key: "gst" });
    if (columns.line_total !== false)  c.push({ label: "Amount",     w: 50, key: "amount" });
    const fix = c.filter(x => x.key !== "name").reduce((s, x) => s + x.w, 0);
    const nc  = c.find(x => x.key === "name"); if (nc) nc.w = CONTENT_W - fix;
    return c;
  };

  const tableX   = margin.left;
  const prodCols = buildProdCols();
  const svcCols  = buildSvcCols();

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 1 — HEADER
  // ════════════════════════════════════════════════════════════════════════
  if (header.header !== false) {
    setFont(true, 16);
    doc.fillColor(rgb(textColor)).text(data.docTitle || "INVOICE", margin.left, y, {
      width: CONTENT_W, align: header.title_alignment || "center",
    });
    y += 22;

    const infoX  = margin.left;
    const infoW  = CONTENT_W * 0.42;
    const startY = y;
    let leftY    = y;

    if (company.name    !== false) { setFont(true, baseFontSize + 2); doc.fillColor(rgb(textColor)).text(data.company.name, infoX, leftY, { width: infoW }); leftY += 14; }
    if (company.Reg_no  !== false) { drawText(`Reg. No: ${data.company.regNo}`,  infoX, leftY); leftY += 11; }
    if (company.tax_id  !== false) { drawText(`Tax ID: ${data.company.taxId}`,   infoX, leftY); leftY += 11; }
    if (company.address !== false) { data.company.address.split("\n").forEach((l: string) => { drawText(l, infoX, leftY); leftY += 11; }); }
    if (company.phone   !== false) { drawText(`Phone: ${data.company.phone}`,    infoX, leftY); leftY += 11; }
    if (company.mobile  !== false) { drawText(`Mobile: ${data.company.mobile}`,  infoX, leftY); leftY += 11; }
    if (company.fax     !== false) { drawText(`Fax: ${data.company.fax}`,        infoX, leftY); leftY += 11; }
    if (company.email   !== false) { drawText(data.company.email,   infoX, leftY, { color: "#0066cc" }); leftY += 11; }
    if (company.website !== false) { drawText(data.company.website, infoX, leftY, { color: "#0066cc" }); leftY += 11; }

    const detailX = margin.left + CONTENT_W * 0.5;
    const boxX    = detailX - 5;
    const boxW    = PAGE_W - boxX - margin.right;
    const rowH    = 14;
    let rightY    = startY;

    const detailRows = [];
    if (header.number !== false)    detailRows.push(["Invoice #", data.invoiceNumber]);
    if (header.po_no !== false)     detailRows.push(["P.O. #", data.poNumber]);
    detailRows.push(["Date", data.date]);
    if (header.due_date !== false)  detailRows.push(["Due Date", data.dueDate]);
    if (header.total_amount !== false) detailRows.push(["Total", data.total]);
    if (header.total_outstanding !== false) detailRows.push(["Outstanding", data.outstanding]);

    detailRows.forEach((row, i) => {
      const ry = rightY + i * rowH;
      drawRect(boxX, ry, boxW, rowH, i % 2 === 0 ? "#f0f4ff" : "#ffffff", borderColor);
      drawText(row[0], boxX + 4,           ry + 3, { bold: true, width: boxW * 0.45 });
      drawText(row[1], boxX + boxW * 0.47, ry + 3, { width: boxW * 0.5, align: "right" });
    });

    rightY += detailRows.length * rowH + 5;

    // Accepted payment methods, right-aligned under the meta table (reference
    // layout: "We accept payment by" + the method logos in the header).
    if (Array.isArray(data.paymentMethods) && data.paymentMethods.length) {
      drawText("We accept payment by", boxX, rightY + 2, {
        width: boxW, align: "right", color: "#666666", size: baseFontSize - 1,
      });
      let py = rightY + 14;
      let px = boxX;
      const logoSz = 18;
      const gap = 4;
      data.paymentMethods.forEach((m: any) => {
        if (px + logoSz > boxX + boxW) { px = boxX; py += logoSz + gap; }
        const buf = loadSignatureBuffer(m.logo);
        if (buf) {
          try { doc.image(buf, px, py, { fit: [logoSz, logoSz] }); } catch { /* skip */ }
        }
        px += logoSz + gap;
      });
      rightY = py + logoSz + 6;
    }

    y = Math.max(leftY, rightY) + 10;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 2 — BILL TO / SHIP TO
  // ════════════════════════════════════════════════════════════════════════
  {
    const halfW = CONTENT_W / 2 - 5;
    const billX = margin.left;
    const shipX = margin.left + halfW + 10;
    let billY   = y;
    let shipY   = y;

    drawText(data.billLabel || "Invoice To:", billX, billY, { bold: true }); billY += 12;
    if (contact.first_last_name !== false) { drawText(data.billTo.name,  billX, billY, { bold: true }); billY += 11; }
    if (contact.email           !== false) { drawText(data.billTo.email, billX, billY, { color: "#0066cc" }); billY += 11; }
    if (contact.home_phone      !== false) { drawText(`Home: ${data.billTo.phone}`,             billX, billY); billY += 11; }
    if (contact.business_phone  !== false) { drawText(`Business: ${data.billTo.businessPhone}`, billX, billY); billY += 11; }
    drawText(`P.O. Box: ${data.billTo.poBox}`, billX, billY); billY += 11;
    drawText(`Fax: ${data.billTo.taxId}`,      billX, billY); billY += 11;
    if (contact.reg_no !== false) { drawText(`Reg. No: ${data.billTo.regNo}`,       billX, billY); billY += 11; }
    if (contact.tax_id !== false) { drawText(`Tax ID: ${data.billTo.contactTaxId}`, billX, billY); billY += 11; }

    drawText("Ship To:", shipX, shipY, { bold: true }); shipY += 12;
    data.shipTo.address.split("\n").forEach((l: string) => { drawText(l, shipX, shipY); shipY += 11; });
    shipY += 5;
    drawText("Shipping Method:", shipX, shipY, { bold: true }); shipY += 11;
    drawText(data.shipTo.shippingMethod, shipX, shipY); shipY += 11;

    y = Math.max(billY, shipY) + 10;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 3 — SUBTITLE
  // ════════════════════════════════════════════════════════════════════════
  if (header.sub_title !== false && data.subTitle) {
    drawText(data.subTitle, margin.left, y, {
      bold: true, align: header.sub_title_alignment || "center",
      size: baseFontSize + 1, width: CONTENT_W,
    });
    y += 14;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 4 — PRODUCTS TABLE
  // ════════════════════════════════════════════════════════════════════════
  const drawProdHeader = () => { y = drawTableHeader(prodCols, tableX, y, 16); };

  // Only render the Products section when there ARE products — otherwise a
  // services-only document showed an empty "Products" table header.
  if (data.products.length > 0) {
    checkPageBreak(32);
    drawProdHeader();

    data.products.forEach((prod: any, i: number) => {
      const totalH = 14 + (prod.description ? 18 : 0);
      checkPageBreak(totalH, drawProdHeader);

      y = drawTableRow(
        prodCols.map((col: any) =>
          col.key === "name"
            ? { value: prod.name, w: col.w, align: "left" }
            : { value: prod[col.key], w: col.w }
        ),
        tableX, y, 14, i
      );

      if (prod.description) {
        checkPageBreak(18, drawProdHeader);
        drawDescRow(prod.description, i, tableX);
      }
    });

    y += 6;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 5 — SERVICES TABLE
  // ════════════════════════════════════════════════════════════════════════
  const drawSvcHeader = () => { y = drawTableHeader(svcCols, tableX, y, 16); };

  // Only render the Services section when there ARE services — a products-only
  // document must not show an empty "Services" table.
  if (data.services.length > 0) {
    checkPageBreak(32);
    drawSvcHeader();

    data.services.forEach((svc: any, i: number) => {
      const totalH = 14 + (svc.description ? 18 : 0);
      checkPageBreak(totalH, drawSvcHeader);

      y = drawTableRow(
        svcCols.map((col: any) =>
          col.key === "name"
            ? { value: svc.name, w: col.w, align: "left" }
            : { value: svc[col.key], w: col.w }
        ),
        tableX, y, 14, i
      );

      if (svc.description) {
        checkPageBreak(18, drawSvcHeader);
        drawDescRow(svc.description, i, tableX);
      }
    });

    y += 10;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6 — TERMS & SUMMARY
  // ════════════════════════════════════════════════════════════════════════
  // Currency label for the totals block — must match the doc's currency (used
  // by the header & line items), not a hardcoded "USD".
  const cur = data.currency || "USD";
  const sm = data.summary;
  // Percent for the label (JS already trims: 1 → "1", 8.5 → "8.5", 20 → "20").
  const pct = (v: number) => `${v}`;
  const sumRows: any[] = [];
  if (summary.sub_total       !== false) sumRows.push(["Sub Total",       `${sm.subTotal.toFixed(2)} ${cur}`]);
  if (summary.deposit         !== false && sm.deposit > 0) sumRows.push(["Deposit", `${sm.deposit.toFixed(2)} ${cur}`]);
  if (summary.discount        !== false && sm.discountAmount > 0) sumRows.push([`Discount ${pct(sm.discountPercent)}% on ${sm.subTotal.toFixed(2)}`, `${sm.discountAmount.toFixed(2)} ${cur}`]);
  if (summary.inline_discount !== false && sm.inlineDiscount > 0) sumRows.push(["Inline Discount", `${sm.inlineDiscount.toFixed(2)} ${cur}`]);
  if (summary.shipping_cost   !== false && sm.shippingCost > 0) sumRows.push(["Shipping Cost",   `${sm.shippingCost.toFixed(2)} ${cur}`]);
  // Named-tax rows ("Custom tax 20% on 771"); fall back to a single "Tax" row.
  if (summary.tax !== false) {
    if (Array.isArray(sm.taxBreakdown) && sm.taxBreakdown.length > 0) {
      for (const t of sm.taxBreakdown) {
        sumRows.push([`${t.name} ${pct(t.rate)}% on ${t.base.toFixed(2)}`, `${t.amount.toFixed(2)} ${cur}`]);
      }
    } else if (sm.tax > 0) {
      sumRows.push(["Tax", `${sm.tax.toFixed(2)} ${cur}`]);
    }
  }
  if (summary.total           !== false) sumRows.push(["Total",           `${sm.total.toFixed(2)} ${cur}`,     true]);
  if (summary.amount_paid     !== false) sumRows.push(["Amount Paid",     `${sm.amountPaid.toFixed(2)} ${cur}`]);
  if (summary.deposit         !== false && sm.deposit > 0) sumRows.push(["Deposit Due", `${sm.depositDue.toFixed(2)} ${cur}`, true]);
  if (summary.amount_due      !== false) sumRows.push(["Amount Due",      `${sm.amountDue.toFixed(2)} ${cur}`,  true]);

  checkPageBreak(Math.max(80, sumRows.length * 13 + 20));

  const termsX = margin.left;
  const termsW = CONTENT_W * 0.55;
  const sumX   = margin.left + CONTENT_W * 0.57;
  const sumW   = CONTENT_W * 0.43;
  let termsY   = y;
  let sumY     = y;

  if (noteTerms.terms_and_condition !== false) {
    drawText("Terms & Conditions", termsX, termsY, { bold: true }); termsY += 11;
    setFont(false, baseFontSize - 1);
    doc.fillColor(rgb("#333333")).text(data.termsAndConditions, termsX, termsY, { width: termsW, lineBreak: true });
    termsY += 18;
  }
  if (noteTerms.notes !== false) {
    if (noteTerms.notes_title !== false) { drawText("Notes:", termsX, termsY, { bold: true }); termsY += 11; }
    setFont(false, baseFontSize - 1);
    doc.fillColor(rgb("#333333")).text(data.notes, termsX, termsY, { width: termsW, lineBreak: true });
    termsY += 35;
  }

  sumRows.forEach((row, i) => {
    const rowH   = 13;
    const isBold = !!row[2];
    const bg     = isBold ? "#e8edf5" : (i % 2 === 0 ? "#f9f9f9" : "#ffffff");
    drawRect(sumX, sumY, sumW, rowH, bg, borderColor);
    drawText(row[0], sumX + 4,           sumY + 2, { bold: isBold, size: baseFontSize - 0.5, width: sumW * 0.55 });
    drawText(row[1], sumX + sumW * 0.55, sumY + 2, { bold: isBold, size: baseFontSize - 0.5, width: sumW * 0.42, align: "right" });
    sumY += rowH;
  });

  // Total in Words (reference layout: under the totals, in the summary column).
  if (summary.total_in_words !== false) {
    sumY += 4;
    drawText("Total in Words", sumX + 4, sumY, { bold: true, size: baseFontSize - 0.5, width: sumW - 8, align: "right" });
    sumY += 11;
    setFont(false, baseFontSize - 1.5);
    doc.fillColor(rgb("#333333")).text(
      amountToWords(sm.total, cur),
      sumX + 4, sumY, { width: sumW - 8, align: "right", lineBreak: true },
    );
    sumY += 22;
  }

  y = Math.max(termsY, sumY) + 15;

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 7 — HSN / SAC SUMMARY
  // ════════════════════════════════════════════════════════════════════════
  if (summary.hsc_sac_summary !== false) {
    checkPageBreak(26 + data.hsnSacSummary.length * 14 + 10);

    const hsnCols: any[] = [
      { label: "HSN/SAC",          w: 70 },
      { label: "Taxable Value",    w: 80 },
      { label: "Central Tax",      w: 110, sub: true, cols: [{ label: "Rate", w: 55 }, { label: "Amount", w: 55 }] },
      { label: "State Tax",        w: 110, sub: true, cols: [{ label: "Rate", w: 55 }, { label: "Amount", w: 55 }] },
      { label: "Total Tax Amount", w: CONTENT_W - 370 },
    ];

    let hx = tableX;
    hsnCols.forEach((col) => {
      drawRect(hx, y, col.w, 14, fillColor, borderColor);
      setFont(true, baseFontSize - 1);
      doc.fillColor(rgb(fillTextColor)).text(col.label, hx + 2, y + 4, { width: col.w - 4, align: "center" });
      hx += col.w;
    });
    y += 14;

    let hx2 = tableX;
    hsnCols.forEach((col: any) => {
      if (col.sub) {
        col.cols.forEach((sub: any) => {
          drawRect(hx2, y, sub.w, 12, fillColor, borderColor);
          setFont(true, baseFontSize - 1.5);
          doc.fillColor(rgb(fillTextColor)).text(sub.label, hx2 + 2, y + 3, { width: sub.w - 4, align: "center" });
          hx2 += sub.w;
        });
      } else {
        drawRect(hx2, y, col.w, 12, fillColor, borderColor);
        hx2 += col.w;
      }
    });
    y += 12;

    data.hsnSacSummary.forEach((row: any, i: number) => {
      checkPageBreak(14);
      const rh     = 14;
      const isLast = i === data.hsnSacSummary.length - 1;
      const bg     = isLast ? "#e8edf5" : (i % 2 === 0 ? "#ffffff" : "#f5f5f5");
      const vals   = [row.hsnSac, row.taxableValue, row.centralRate, row.centralAmount, row.stateRate, row.stateAmount, row.totalTax];
      const widths = [70, 80, 55, 55, 55, 55, CONTENT_W - 370];
      let rx = tableX;
      vals.forEach((v: string, vi: number) => {
        drawRect(rx, y, widths[vi], rh, bg, borderColor);
        setFont(isLast, baseFontSize - 1);
        doc.fillColor(rgb(textColor)).text(v, rx + 2, y + 3, { width: widths[vi] - 4, align: "center" });
        rx += widths[vi];
      });
      y += rh;
    });
    y += 10;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 8 — SIGNATURE + QR
  // ════════════════════════════════════════════════════════════════════════
  const customerSrc = data.signature?.customerImage || data.signature?.image;
  const showCustomerSig = signature.contact_sign !== false && !!customerSrc;
  if (signature.company_sign !== "hide" || header.qr_code !== false || showCustomerSig) {
    const qrW  = 70;
    const sigW = 130;
    const sigImgH = 34;
    // Push the whole block down so the signature image never overlaps
    // totals / notes / payment rows above.
    y += 28;
    checkPageBreak(qrW + sigImgH + 50);

    const baseY = y;
    // Signature sits at the bottom-left (reference layout); QR stays right.
    const sigX  = margin.left;
    const qrX   = PAGE_W - margin.right - CONTENT_W * 0.15 - qrW;
    const lineY = baseY + sigImgH + 4;

    if (signature.company_sign !== "hide") {
      // Company / Authorized Signatory — from Settings signatures, not the
      // per-document customer signature.
      const sigBuf = loadSignatureBuffer(data.signature?.companyImage);
      if (sigBuf) {
        try {
          doc.image(sigBuf, sigX, baseY, {
            fit: [sigW, sigImgH], align: "center",
          });
        } catch { /* ignore an undecodable image, keep the label */ }
      }
      doc.save().strokeColor(rgb(borderColor))
        .moveTo(sigX, lineY).lineTo(sigX + sigW, lineY)
        .stroke().restore();
      drawText(data.signature.companyName, sigX, lineY + 3, { bold: true, width: sigW, align: "center" });
      drawText(data.signature.subtitle,    sigX, lineY + 16, { width: sigW, align: "center", color: "#666666" });
    }

    // Optional customer signature — only when PDF setting is on AND the
    // document actually has a captured signature image.
    if (showCustomerSig) {
      const custBuf = loadSignatureBuffer(customerSrc);
      // Sit left of the QR column so both can coexist.
      const custX = Math.max(sigX + sigW + 24, qrX - sigW - 16);
      if (custBuf) {
        try {
          doc.image(custBuf, custX, baseY, {
            fit: [sigW, sigImgH], align: "center",
          });
        } catch { /* ignore */ }
      }
      doc.save().strokeColor(rgb(borderColor))
        .moveTo(custX, lineY).lineTo(custX + sigW, lineY)
        .stroke().restore();
      drawText("Customer Signature", custX, lineY + 16, {
        width: sigW, align: "center", color: "#666666",
      });
    }

    if (header.qr_code !== false) {
      try {
        const QRCode    = require("qrcode");
        const qrBuffer: Buffer = await QRCode.toBuffer(data.qrCodeData, {
          type: "png", width: qrW, margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        doc.image(qrBuffer, qrX, baseY, { width: qrW, height: qrW });
        drawText("Scan to verify", qrX, baseY + qrW + 3, {
          size: 6, color: "#888888", width: qrW, align: "center",
        });
      } catch (_err) {
        drawRect(qrX, baseY, qrW, qrW, "#f5f5f5", borderColor);
        drawText("QR", qrX + qrW / 2 - 8, baseY + qrW / 2 - 8, { size: 14, bold: true });
      }
    }

    y = Math.max(lineY + 30, baseY + qrW + 18);
  }

   // ─── PAYMENT DETAILS ─────────────────────────────────────────────────────
  // Only when payments exist against this document (and the setting allows it),
  // so documents with no payments don't show an empty table.
  if (Array.isArray(data.paymentDetails) && data.paymentDetails.length > 0 &&
      summary.payment_details !== false) {
    y += 5;
    // Title
    drawRect(tableX, y, CONTENT_W, 16, fillColor, borderColor);
    setFont(true, baseFontSize);
    doc.fillColor(rgb(fillTextColor)).text("Payment Details", tableX, y + 4, { width: CONTENT_W, align: "center" });
    y += 16;

    const payCols = [
      { label: "Payment #", w: CONTENT_W * 0.20, key: "paymentNo" },
      { label: "Date",      w: CONTENT_W * 0.18, key: "date" },
      { label: "Method",    w: CONTENT_W * 0.20, key: "method", align: "left" as const },
      { label: "Amount",    w: CONTENT_W * 0.24, key: "amount", align: "right" as const },
      { label: "Status",    w: CONTENT_W * 0.18, key: "status", align: "center" as const },
    ];

    // Header
    let px = tableX;
    payCols.forEach((col) => {
      drawRect(px, y, col.w, 14, "#e8edf5", borderColor)
      drawText(col.label, px + 2, y + 3, { bold: true, size: baseFontSize - 0.5, width: col.w - 4, align: col.align });
      px += col.w;
    });
    y += 14;

    data.paymentDetails.forEach((pay: any, i: number) => {
      const rh = 14;
      const bg = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
      let ppx = tableX;
      payCols.forEach((col) => {
        drawRect(ppx, y, col.w, rh, bg, borderColor);
        drawText(pay[col.key], ppx + 2, y + 3, { size: baseFontSize - 0.5, width: col.w - 4, align: col.align });
        ppx += col.w;
      });
      y += rh;
    });

    // Total Paid / Balance summary (currency-aware) under the table.
    if (data.paymentSummary) {
      const sumX2 = tableX + CONTENT_W * 0.55;
      const sumW2 = CONTENT_W * 0.45;
      const sumRow = (label: string, value: string) => {
        drawRect(sumX2, y, sumW2, 14, "#f0f4ff", borderColor);
        drawText(label, sumX2 + 4, y + 3, { bold: true, size: baseFontSize - 0.5, width: sumW2 * 0.5 });
        drawText(value, sumX2 + sumW2 * 0.5, y + 3, { bold: true, size: baseFontSize - 0.5, width: sumW2 * 0.5 - 4, align: "right" });
        y += 14;
      };
      sumRow("Total Paid", data.paymentSummary.totalPaid);
      sumRow("Balance Due", data.paymentSummary.balance);
    }

    y += 10;
  }

  // ════════════════════════════════════════════════════════════════════════
  // ✅ FIX: Decorate the LAST page before ending
  // This ensures border + footer appear on every single page,
  // including the final one (previously it was skipped).
  // ════════════════════════════════════════════════════════════════════════
  decorateCurrentPage();

  doc.end();
};

module.exports = { generateInvoicePDF };