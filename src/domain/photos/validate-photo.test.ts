import { describe, expect, it } from "vitest";
import {
  MAX_BATCH_UPLOAD_COUNT,
  validatePhotoBatch,
  validatePhotoFile,
} from "./validate-photo";

const validJpeg = () =>
  new File(["photo"], "family.jpg", { type: "image/jpeg" });

describe("validatePhotoFile (MEM-001-R03 / MEM-011-AC09)", () => {
  it("accepts JPEG, PNG, WebP, and HEIC/HEIF up to 20 MiB", () => {
    expect(validatePhotoFile(validJpeg())).toEqual({ valid: true });
    expect(
      validatePhotoFile(new File(["photo"], "portrait.png", { type: "image/png" })),
    ).toEqual({ valid: true });
    expect(
      validatePhotoFile(new File(["photo"], "portrait.webp", { type: "image/webp" })),
    ).toEqual({ valid: true });
    expect(
      validatePhotoFile(new File(["photo"], "iphone.heic", { type: "image/heic" })),
    ).toEqual({ valid: true });
    expect(
      validatePhotoFile(new File(["photo"], "iphone.heif", { type: "image/heif" })),
    ).toEqual({ valid: true });
  });

  it("rejects unsupported formats, empty files, and files over 20 MiB", () => {
    const unsupported = new File(["gif"], "anim.gif", { type: "image/gif" });
    const empty = new File([], "empty.png", { type: "image/png" });
    const oversized = validJpeg();
    Object.defineProperty(oversized, "size", { value: 20 * 1024 * 1024 + 1 });

    expect(validatePhotoFile(unsupported)).toEqual({
      valid: false,
      reason: "unsupported-type",
    });
    expect(validatePhotoFile(empty)).toEqual({
      valid: false,
      reason: "empty",
    });
    expect(validatePhotoFile(oversized)).toEqual({
      valid: false,
      reason: "too-large",
    });
  });

  it("caps batch selections to MAX_BATCH_UPLOAD_COUNT files", () => {
    const files = Array.from({ length: MAX_BATCH_UPLOAD_COUNT + 5 }, (_, i) =>
      new File(["photo"], `photo-${i + 1}.jpg`, { type: "image/jpeg" }),
    );
    const result = validatePhotoBatch(files);
    expect(result.accepted).toHaveLength(MAX_BATCH_UPLOAD_COUNT);
    expect(result.truncatedCount).toBe(5);
  });
});
