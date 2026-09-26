import fs from "fs";
import path from "path";

let cachedLogoBuffer: Buffer | null | undefined = undefined;

const LOGO_PATH = path.join(process.cwd(), "public", "files", "qayd.png");
 console.log(LOGO_PATH);
 
export const getQaydLogoBuffer = (): Buffer | null => {
  if (cachedLogoBuffer !== undefined) {
    return cachedLogoBuffer; 
  }
  try {
    cachedLogoBuffer = fs.readFileSync(LOGO_PATH);
  } catch (err) {
    console.error("Qayd logo load failed:", LOGO_PATH, err);
    cachedLogoBuffer = null;
  }
  return cachedLogoBuffer;
};


export const drawQaydBranding = (
  doc: any,
  x: number,
  y: number,
  width: number,
  opts: {
    align?: "left" | "center" | "right";
    logoSize?: number;
    text?: string;
    textColor?: string;
    fontSize?: number;
  } = {}
) => {
  const logoBuf   = getQaydLogoBuffer();
  const align     = opts.align     || "center";
  const logoSize  = opts.logoSize  || 12;
  const text      = opts.text      || "Created by Qayd";
  const textColor = opts.textColor || "#999999";
  const fontSize  = opts.fontSize  || 7;
  const gap       = 4;

  doc.save();
  doc.font("Helvetica").fontSize(fontSize).fillColor(textColor);

  if (logoBuf) {
    const textW  = doc.widthOfString(text);
    const totalW = logoSize + gap + textW;

    let startX = x;
    if (align === "center") startX = x + (width - totalW) / 2;
    else if (align === "right") startX = x + width - totalW;

    try {
      doc.image(logoBuf, startX, y - (logoSize - fontSize) / 2, {
        width: logoSize,
        height: logoSize,
      });
      doc.text(text, startX + logoSize + gap, y, { lineBreak: false });
    } catch (err) {
      console.error("Qayd logo render failed:", err);
      doc.text(text, x, y, { width, align, lineBreak: false });
    }
  } else {
    doc.text(text, x, y, { width, align, lineBreak: false });
  }

  doc.restore();
};