const PDFDocument = require("pdfkit");

// ─── Color Helper ────────────────────────────────────────────────────────────
const hexToRgb = (hex: any): [number, number, number] => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
};

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const getDummyPaymentMoodData = () => ({
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
  received : {
    name  : "Moon invoicing" ,
    regNo : "887" ,
    taxId : "895"
  } , 

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
  signature:  { companyName: "info", subtitle: "Authorized Signatory" },
  qrCodeData: "https://mooninvoice.com/invoice/MTPL001619",
   paymentDetails: [
    { paymentNo: "01", date: "Sep 7, 2023", amount: "100.00 USD", paymentType: "Stripe" },
  ],
  invoiceDetails: [
  { invoiceNo: "MTPL001619", amount: "500.00 USD" }
]
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ════════════════════════════════════════════════════════════════════════════
/**
 * [liveData] comes from resolvePaymentMadeData (VendorPaymentModel). When it is
 * omitted the built-in sample is used, so the PDF-settings preview still renders.
 */
export const generatePaymentMoodPDF = async (liveData: any, settings: any, res: any) => {
  const data = liveData || getDummyPaymentMoodData();
  const s    = settings || {};

  const style     = s.style       || {};
  const columns   = s.columns     || {};
  const header    = s.header      || {};
  const company   = s.company     || {};

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

  // ════════════════════════════════════════════════════════════════════════
  // SECTION 1 — HEADER
  // ════════════════════════════════════════════════════════════════════════
  if (header.header !== false) {
    setFont(true, 16);
    doc.fillColor(rgb(textColor)).text("PAYMENT MADE", margin.left, y, {
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

     drawText(`PAYMENT TO : `,  infoX, leftY , { color: "#1111" }) ; leftY += 11; 
     drawText(` ${data.received.name}`,  infoX, leftY); leftY += 11; 
     drawText(`Reg id : ${data.received.regNo}`,  infoX, leftY); leftY += 11; 
     drawText(`Tax ID: ${data.received.taxId}`,   infoX, leftY); leftY += 11; 
    

    const detailX = margin.left + CONTENT_W * 0.5;
    const boxX    = detailX - 5;
    const boxW    = PAGE_W - boxX - margin.right;
    const rowH    = 14;
    let rightY    = startY;

    const detailRows: string[][] = [];

    detailRows.forEach((row, i) => {
      const ry = rightY + i * rowH;
      drawRect(boxX, ry, boxW, rowH, i % 2 === 0 ? "#f0f4ff" : "#ffffff", borderColor);
      drawText(row[0], boxX + 4,           ry + 3, { bold: true, width: boxW * 0.45 });
      drawText(row[1], boxX + boxW * 0.47, ry + 3, { width: boxW * 0.5, align: "right" });
    });

    rightY += detailRows.length * rowH + 5;
    y = Math.max(leftY, rightY) + 10;
  }

 // ─── PAYMENT DETAILS ─────────────────────────────────────────────────────
  {
   

    const payCols = [
      { label: "Payment #", w: CONTENT_W * 0.18 },
      { label: "Date",      w: CONTENT_W * 0.25 },
      { label: "Amount",    w: CONTENT_W * 0.32 },
      { label: "Payment Type", w: CONTENT_W * 0.25 },
    ];

    // Header
    let px = tableX;
    payCols.forEach((col) => {
      drawRect(px, y, col.w, 14, "#e8edf5", borderColor)
      drawText(col.label, px + 2, y + 3, { bold: true, size: baseFontSize - 0.5, width: col.w - 4 });
      px += col.w;
    });
    y += 14;

    data.paymentDetails.forEach((pay: any, i: number) => {
      const rh = 14;
      const bg = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
      const vals3 = [pay.paymentNo, pay.date, pay.amount, pay.paymentType];
      let ppx = tableX;
      payCols.forEach((col, ci) => {
        drawRect(ppx, y, col.w, rh, bg, borderColor);
        drawText(vals3[ci], ppx + 2, y + 3, { size: baseFontSize - 0.5, width: col.w - 4 });
        ppx += col.w;
      });
      y += rh;
    });

    y += 10;
  }
// ─── INVOICE DETAILS ─────────────────────────────────────────────
{
  const invoiceCols = [
    { label: "Invoice #", w: CONTENT_W * 0.5 },
    { label: "Amount", w: CONTENT_W * 0.5 },
  ];

  // Header
  let px = tableX;
  invoiceCols.forEach((col) => {
    drawRect(px, y, col.w, 14, "#e8edf5", borderColor);
    drawText(col.label, px + 2, y + 3, {
      bold: true,
      size: baseFontSize - 0.5,
      width: col.w - 4
    });
    px += col.w;
  });

  y += 14;

  // Rows
  data.invoiceDetails.forEach((inv: any, i: number) => {
    const rh = 14;
    const bg = i % 2 === 0 ? "#ffffff" : "#f9f9f9";

    const values = [inv.invoiceNo, inv.amount];

    let ppx = tableX;
    invoiceCols.forEach((col, ci) => {
      drawRect(ppx, y, col.w, rh, bg, borderColor);
      drawText(values[ci], ppx + 2, y + 3, {
        size: baseFontSize - 0.5,
        width: col.w - 4
      });
      ppx += col.w;
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

module.exports = { generatePaymentMoodPDF };