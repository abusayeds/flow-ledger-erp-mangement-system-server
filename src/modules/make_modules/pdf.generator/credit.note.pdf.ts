const PDFDocument = require("pdfkit");

// ─── Color Helper ────────────────────────────────────────────────────────────
const hexToRgb = (hex: any): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const getDummyCreditNoteData = () => ({
  invoiceNumber: "MTPL001619",
  poNumber:      "852",
  date:          "Feb 9, 2021",
  dueDate:       "Feb 9, 2021",
  total:         "648.53 USD",
  outstanding:   "98.52 USD",

  company: {
    name: "info", regNo: "12344", taxId: "123457",
    address: "dhaka\nDhaka\nDhaka 1234 5728\nBangladesh",
    phone: "01770075689", mobile: "+8801770075689", fax: "25",
    email: "info@invoiic.com", website: "https://web.mooninvoice.com",
  },

  billTo: {
    name: "Organization", email: "email@moontechiabs.com",
    phone: "7412589633",  businessPhone: "8523659", poBox: "2501",
    taxId: "KT-2030",     regNo: "REIS 001",        contactTaxId: "UT147852",
    address: "A101\nThupai Complex\nAhmedabad Gujarat 259741\nIndia",
  },

  shipTo: {
    address: "A101\nThupai Complex\nAhmedabad Gujarat 259741\nIndia",
    shippingMethod: "Standard Ground",
  },

  products: [
    { srNo:  1, name: "Moon Invoice Product 1",  description: "Create FREE unlimited invoices for freelancers, small business owners, and contractors for 7 days.", hsn: "HSN0001", quantity: 1, unitPrice: 160,  discount:  6, gst:  7.5, amount: 146.00  },
    { srNo:  2, name: "Moon Invoice Product 2",  description: "Create FREE unlimited invoices for freelancers, small business owners, and contractors for 7 days.", hsn: "HSN0001", quantity: 1, unitPrice: 200,  discount: 10, gst: 10.0, amount: 190.00  },

  ],

  services: [
    { srNo: 1, name: "TR01 - Moon Invoice Task",        description: "Create added attachment feature on Invoice, Estimate, Purchase Order, and Credit Note.", sac: "SAC0001", quantity: 1, rate:  120, discount:  "6%", gst: 6, amount:  114.00  },
    { srNo: 2, name: "TR02 - UI Redesign",              description: "Complete redesign of dashboard and reporting module with new design system.",            sac: "SAC0002", quantity: 2, rate:  200, discount: "10%", gst: 8, amount:  374.40  },
    
  ],

  summary: {
    subTotal: 449, discount: 44.9, inlineDiscount: 0,
    shippingCost: 100, gst9on5: 13.5, total: 617.8,
    amountPaid: 100, returnOrder: 1500, amountDue: 417.8,
  },

  termsAndConditions: "Changes and new functionality consider as CR.",
  notes: "1. Newly designed Invoice PDF\n2. Added round off feature.\n3. Revised subtotal amount display.",

  hsnSacSummary: [
    { hsnSac: "1116542", taxableValue: "100.00 USD", centralRate: "0.00", centralAmount: "0.00 USD", stateRate: "9%", stateAmount: "9.00 USD", totalTax: "9.00 USD" },
    { hsnSac: "Total",   taxableValue: "100.00 USD", centralRate: "",     centralAmount: "0.00 USD", stateRate: "",   stateAmount: "9.00 USD", totalTax: "9.00 USD" },
  ],

  signature:  { companyName: "info", subtitle: "Authorized Signatory" },
  qrCodeData: "https://mooninvoice.com/invoice/MTPL001619",
   paymentDetails: [
    { paymentNo: "01", date: "Sep 7, 2023", amount: "100.00 USD", paymentType: "Stripe" },
  ],
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ════════════════════════════════════════════════════════════════════════════
export const generateCreditNotePDF = async (settings: any, res: any) => {
  const data = getDummyCreditNoteData();
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
    doc.fillColor(rgb(textColor)).text("CREDIT NOTE", margin.left, y, {
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

    const detailRows: string[][] = [];
    detailRows.push(["Date", data.date]);
    if (header.total_amount      !== false) detailRows.push(["Total",  data.total]);

    detailRows.forEach((row, i) => {
      const ry = rightY + i * rowH;
      drawRect(boxX, ry, boxW, rowH, i % 2 === 0 ? "#f0f4ff" : "#ffffff", borderColor);
      drawText(row[0], boxX + 4,           ry + 3, { bold: true, width: boxW * 0.45 });
      drawText(row[1], boxX + boxW * 0.47, ry + 3, { width: boxW * 0.5, align: "right" });
    });

    rightY += detailRows.length * rowH + 5;
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

    drawText("Credit To:", billX, billY, { bold: true }); billY += 12;
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
  if (header.sub_title !== false) {
    drawText("Moon Invoice - Easy Invoicing", margin.left, y, {
      bold: true, align: header.sub_title_alignment || "center",
      size: baseFontSize + 1, width: CONTENT_W,
    });
    y += 14;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 4 — PRODUCTS TABLE
  // ════════════════════════════════════════════════════════════════════════
  const drawProdHeader = () => { y = drawTableHeader(prodCols, tableX, y, 16); };

  if (data.products.length > 0) { checkPageBreak(32); drawProdHeader(); }

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

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 5 — SERVICES TABLE
  // ════════════════════════════════════════════════════════════════════════
  const drawSvcHeader = () => { y = drawTableHeader(svcCols, tableX, y, 16); };

  if (data.services.length > 0) { checkPageBreak(32); drawSvcHeader(); }

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

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 6 — TERMS & SUMMARY
  // ════════════════════════════════════════════════════════════════════════
  const sumRows: any[] = [];
  if (summary.sub_total       !== false) sumRows.push(["Sub Total",       `${data.summary.subTotal.toFixed(2)} USD`]);
  if (summary.inline_discount !== false) sumRows.push(["Inline Discount", `${data.summary.inlineDiscount.toFixed(2)} USD`]);
  sumRows.push(["GST 9% on 5%", `${data.summary.gst9on5.toFixed(2)} USD`]);
  if (summary.total           !== false) sumRows.push(["Total",           `${data.summary.total.toFixed(2)} USD`,     true]);

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
  if (signature.company_sign !== "hide" || header.qr_code !== false) {
    const qrW  = 70;
    const sigW = 130;
    y += 28;
    checkPageBreak(qrW + 40);

    const baseY = y;
    const sigX  = margin.left + CONTENT_W * 0.25;
    const qrX   = PAGE_W - margin.right - CONTENT_W * 0.15 - qrW;

    if (signature.company_sign !== "hide") {
      doc.save().strokeColor(rgb(borderColor))
        .moveTo(sigX, baseY + 20).lineTo(sigX + sigW, baseY + 20)
        .stroke().restore();
      drawText(data.signature.companyName, sigX, baseY + 22, { bold: true, width: sigW, align: "center" });
      drawText(data.signature.subtitle,    sigX, baseY + 35, { width: sigW, align: "center", color: "#666666" });
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

    y += qrW + 15;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  FIX: Decorate the LAST page before ending
  // This ensures border + footer appear on every single page,
  // including the final one (previously it was skipped).
  // ════════════════════════════════════════════════════════════════════════
  decorateCurrentPage();

  doc.end();
};

module.exports = { generateCreditNotePDF };