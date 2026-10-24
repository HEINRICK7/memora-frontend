import { describe, expect, it } from "vitest";
import { validatePhotoFile } from "./validate-photo";

const validJpeg = () =>
  new File(["photo"], "family.jpg", { type: "image/jpeg" });

describe("validatePhotoFile (MEM-001-R03)", () => {
  it("accepts JPEG and PNG up to 20 MiB", () => {
    expect(validatePhotoFile(validJpeg())).toEqual({ valid: true });
    expect(
      validatePhotoFile(new File(["photo"], "portrait.png", { type: "image/png" })),
    ).toEqual({ valid: true });
  });

  it("rejects unsupported formats, empty files, and files over 20 MiB", () => {
    const unsupported = new File(["photo"], "portrait.webp", {
      type: "image/webp",
    });
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
});
