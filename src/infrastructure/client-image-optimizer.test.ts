import { describe, expect, it, vi } from "vitest";
import { optimizePhotoForUpload } from "./client-image-optimizer";

describe("optimizePhotoForUpload (MEM-011-AC11)", () => {
  it("falls back to original JPEG/PNG when bitmap decoding is unavailable", async () => {
    const original = new File(["small-jpeg"], "foto.jpg", { type: "image/jpeg" });
    const result = await optimizePhotoForUpload(original, { decodeBitmap: null });
    expect(result).toBe(original);
  });

  it("downscales oversized JPEG images and converts WebP to JPEG", async () => {
    const close = vi.fn();
    const decodeBitmap = vi.fn(async () => ({ width: 4000, height: 3000, close }));
    const encodeCanvas = vi.fn(async (width: number, height: number, mimeType: string) => {
      expect(width).toBe(2560);
      expect(height).toBe(1920);
      expect(mimeType).toBe("image/jpeg");
      return new Blob(["optimized-bytes"], { type: "image/jpeg" });
    });

    const webp = new File(["raw-webp-data-larger-payload"], "festa.webp", { type: "image/webp" });
    const optimized = await optimizePhotoForUpload(webp, { decodeBitmap, encodeCanvas });

    expect(optimized.type).toBe("image/jpeg");
    expect(optimized.name).toBe("festa.jpg");
    expect(close).toHaveBeenCalledTimes(1);
    expect(encodeCanvas).toHaveBeenCalledTimes(1);
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
