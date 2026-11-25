import { describe, expect, it, vi } from "vitest";
import { optimizePhotoForUpload } from "./client-image-optimizer";

describe("optimizePhotoForUpload (MEM-011-AC11)", () => {
  it("falls back to original JPEG/PNG when bitmap decoding is unavailable", async () => {
    const original = new File(["small-jpeg"], "foto.jpg", { type: "image/jpeg" });
    const result = await optimizePhotoForUpload(original, { decodeBitmap: null });
    expect(result).toBe(original);
  });

  it("downscales oversized images to 2048px and converts WebP to JPEG at 0.85 quality", async () => {
    const close = vi.fn();
    const decodeBitmap = vi.fn(async () => ({ width: 4000, height: 3000, close }));
    const encodeCanvas = vi.fn(async (width: number, height: number, mimeType: string, quality: number) => {
      expect(width).toBe(2048);
      expect(height).toBe(1536);
      expect(mimeType).toBe("image/jpeg");
      expect(quality).toBe(0.85);
      return new Blob(["optimized-bytes"], { type: "image/jpeg" });
    });

    const webp = new File(["raw-webp-data-larger-payload"], "festa.webp", { type: "image/webp" });
    const optimized = await optimizePhotoForUpload(webp, { decodeBitmap, encodeCanvas });

    expect(optimized.type).toBe("image/jpeg");
    expect(optimized.name).toBe("festa.jpg");
    expect(close).toHaveBeenCalledTimes(1);
    expect(encodeCanvas).toHaveBeenCalledTimes(1);
  });

  it("compresses JPEGs above 600 KB even when dimensions fit within 2048px", async () => {
    const decodeBitmap = vi.fn(async () => ({ width: 1600, height: 1200 }));
    const encodeCanvas = vi.fn(async (width: number, height: number, mimeType: string) => {
      expect(width).toBe(1600);
      expect(height).toBe(1200);
      expect(mimeType).toBe("image/jpeg");
      return new Blob([new Uint8Array(180_000)], { type: "image/jpeg" });
    });

    const mediumJpeg = new File([new Uint8Array(750_000)], "mesa.jpg", { type: "image/jpeg" });
    const optimized = await optimizePhotoForUpload(mediumJpeg, { decodeBitmap, encodeCanvas });

    expect(optimized.size).toBe(180_000);
    expect(optimized.type).toBe("image/jpeg");
    expect(encodeCanvas).toHaveBeenCalledTimes(1);
  });

  it("converts opaque PNG screenshots to JPEG while preserving transparent PNGs", async () => {
    const opaquePng = new File([new Uint8Array(900_000)], "print.png", { type: "image/png" });
    const optimizedOpaque = await optimizePhotoForUpload(opaquePng, {
      decodeBitmap: async () => ({ width: 1170, height: 2532 }),
      detectTransparency: async () => false,
      encodeCanvas: async (_w, _h, mimeType) => {
        expect(mimeType).toBe("image/jpeg");
        return new Blob([new Uint8Array(150_000)], { type: "image/jpeg" });
      },
    });
    expect(optimizedOpaque.type).toBe("image/jpeg");
    expect(optimizedOpaque.name).toBe("print.jpg");

    const transparentPng = new File([new Uint8Array(900_000)], "adesivo.png", { type: "image/png" });
    const optimizedTransparent = await optimizePhotoForUpload(transparentPng, {
      decodeBitmap: async () => ({ width: 1000, height: 1000 }),
      detectTransparency: async () => true,
      encodeCanvas: async (_w, _h, mimeType) => {
        expect(mimeType).toBe("image/png");
        return new Blob([new Uint8Array(400_000)], { type: "image/png" });
      },
    });
    expect(optimizedTransparent.type).toBe("image/png");
    expect(optimizedTransparent.name).toBe("adesivo.png");
  });

  it("throws a friendly error when WebP/HEIC cannot be converted in the current browser", async () => {
    const heic = new File(["heic-bytes"], "iphone.heic", { type: "image/heic" });
    await expect(
      optimizePhotoForUpload(heic, {
        decodeBitmap: async () => {
          throw new Error("unsupported codec");
        },
      }),
    ).rejects.toThrow(/HEIC|WebP|JPEG/i);
  });
});
