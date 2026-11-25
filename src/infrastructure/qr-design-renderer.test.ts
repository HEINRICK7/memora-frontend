import { describe, expect, it } from "vitest";
import { createQrDesignSvg, type QrDesign } from "./qr-design-renderer";

const BASE_DESIGN: QrDesign = {
  codeColor: "#191d20",
  cornerColor: "#475cfa",
  backgroundColor: "#ffffff",
  transparentBackground: false,
  dotStyle: "round",
  cornerStyle: "square",
  margin: 2,
  logoDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  showLogo: true,
  logoScale: 0.28,
  caption: "Escaneie para enviar suas fotos",
};

describe("createQrDesignSvg", () => {
  it("renders a larger logo up to 34% with a tight backing frame", () => {
    const svg = createQrDesignSvg("https://memora.otimizanegocio.com/m/abc123", {
      ...BASE_DESIGN,
      logoScale: 0.34,
    });

    const viewBoxMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    expect(viewBoxMatch).not.toBeNull();
    const viewSize = Number(viewBoxMatch![1]);
    const qrModules = viewSize - BASE_DESIGN.margin * 2;

    const imageMatch = svg.match(/<image x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
    expect(imageMatch).not.toBeNull();
    const logoWidth = Number(imageMatch![3]);

    expect(logoWidth / qrModules).toBeCloseTo(0.34, 2);

    const badgeMatch = svg.match(/<rect data-qr-logo-frame="true" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
    expect(badgeMatch).not.toBeNull();
    const badgePaddingPerSide = (Number(badgeMatch![3]) - logoWidth) / 2;
    expect(badgePaddingPerSide).toBeLessThanOrEqual(0.45);
  });

  it("clears QR dot modules inside the logo cutout zone", () => {
    const svg = createQrDesignSvg("https://memora.otimizanegocio.com/m/abc123", BASE_DESIGN);
    const badgeMatch = svg.match(/<rect data-qr-logo-frame="true" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
    expect(badgeMatch).not.toBeNull();

    const left = Number(badgeMatch![1]);
    const top = Number(badgeMatch![2]);
    const right = left + Number(badgeMatch![3]);
    const bottom = top + Number(badgeMatch![4]);

    const circles = [...svg.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)];
    expect(circles.length).toBeGreaterThan(20);
    for (const match of circles) {
      const cx = Number(match[1]);
      const cy = Number(match[2]);
      const insideCutout = cx >= left && cx <= right && cy >= top && cy <= bottom;
      expect(insideCutout).toBe(false);
    }
  });
});
