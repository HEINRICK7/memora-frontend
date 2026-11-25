import QRCode from "qrcode";

export type QrDotStyle = "square" | "rounded" | "round";
export type QrCornerStyle = "square" | "rounded" | "circle";

export type QrDesign = {
  codeColor: string;
  cornerColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  dotStyle: QrDotStyle;
  cornerStyle: QrCornerStyle;
  margin: number;
  logoDataUrl: string | null;
  showLogo: boolean;
  logoScale: number;
  caption: string;
};

const QR_COLOR_PATTERN = /^#[\da-f]{6}$/i;

function safeColor(value: string, fallback: string): string {
  return QR_COLOR_PATTERN.test(value) ? value : fallback;
}

function shape(x: number, y: number, size: number, style: QrDotStyle, fill: string): string {
  if (style === "round") {
    const radius = size / 2;
    return `<circle cx="${x + radius}" cy="${y + radius}" r="${radius}" fill="${fill}"/>`;
  }
  const radius = style === "rounded" ? size * 0.32 : 0;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${fill}"/>`;
}

function finder(x: number, y: number, style: QrCornerStyle, color: string): string {
  const cornerRadius = style === "rounded" ? 1.4 : style === "circle" ? 3.5 : 0;
  const innerRadius = style === "rounded" ? 0.85 : style === "circle" ? 2.5 : 0;
  const centerRadius = style === "rounded" ? 0.45 : style === "circle" ? 1.5 : 0;
  return [
    `<rect x="${x}" y="${y}" width="7" height="7" rx="${cornerRadius}" fill="${color}"/>`,
    `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="${innerRadius}" fill="#ffffff"/>`,
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="${centerRadius}" fill="${color}"/>`,
  ].join("");
}

function isFinderModule(row: number, col: number, size: number): boolean {
  return (row < 7 && col < 7)
    || (row < 7 && col >= size - 7)
    || (row >= size - 7 && col < 7);
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

export function createQrDesignSvg(value: string, design: QrDesign, width = 512, includeCaption = false): string {
  const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const margin = Math.max(0, Math.min(8, Math.round(design.margin)));
  const viewSize = size + margin * 2;
  const viewHeight = viewSize + (includeCaption && design.caption.trim() ? 4 : 0);
  const codeColor = safeColor(design.codeColor, "#191d20");
  const cornerColor = safeColor(design.cornerColor, codeColor);
  const backgroundColor = safeColor(design.backgroundColor, "#ffffff");
  const cells: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!qr.modules.get(row, col) || isFinderModule(row, col, size)) continue;
      cells.push(shape(col, row, 1, design.dotStyle, codeColor));
    }
  }

  const eyes = [
    finder(0, 0, design.cornerStyle, cornerColor),
    finder(size - 7, 0, design.cornerStyle, cornerColor),
    finder(0, size - 7, design.cornerStyle, cornerColor),
  ].join("");

  const logoSize = Math.max(5, Math.min(size * 0.28, size * design.logoScale));
  const logoLeft = (size - logoSize) / 2;
  const logoTop = (size - logoSize) / 2;
  const logoMarkup = design.showLogo && design.logoDataUrl
    ? [
        `<rect x="${logoLeft - 0.7}" y="${logoTop - 0.7}" width="${logoSize + 1.4}" height="${logoSize + 1.4}" rx="1.5" fill="#ffffff"/>`,
        `<image x="${logoLeft}" y="${logoTop}" width="${logoSize}" height="${logoSize}" href="${design.logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`,
      ].join("")
    : "";

  const background = design.transparentBackground
    ? ""
    : `<rect width="${viewSize}" height="${viewHeight}" fill="${backgroundColor}"/>`;
  const caption = includeCaption && design.caption.trim()
    ? `<text x="${viewSize / 2}" y="${viewSize + 2.65}" text-anchor="middle" font-family="Arial, sans-serif" font-size="1.45" font-weight="700" fill="${codeColor}">${escapeXml(design.caption.trim())}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width * viewHeight / viewSize}" viewBox="0 0 ${viewSize} ${viewHeight}" shape-rendering="geometricPrecision">${background}<g transform="translate(${margin} ${margin})">${cells.join("")}${eyes}${logoMarkup}</g>${caption}</svg>`;
}

export function qrSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
