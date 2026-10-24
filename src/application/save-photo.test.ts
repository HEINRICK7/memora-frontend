import { describe, expect, it, vi } from "vitest";
import { savePhoto } from "./save-photo";

describe("savePhoto (MEM-001-AC02)", () => {
  it("requests an intent, uploads to its signed URL, then confirms READY", async () => {
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });
    const photo = {
      id: "photo-1",
      status: "READY" as const,
      contentType: "image/jpeg",
      sizeBytes: file.size,
      previewUrl: "http://localhost:9000/private/photo-1?signature=secret",
      previewExpiresAt: "2026-10-24T15:05:00Z",
    };
    const gateway = {
      createUploadIntent: vi.fn().mockResolvedValue({
        uploadId: "upload-1",
        method: "PUT" as const,
        uploadUrl: "http://localhost:9000/private/key?signature=secret",
        requiredHeaders: { "Content-Type": "image/jpeg" },
        expiresAt: "2026-10-24T15:05:00Z",
      }),
      uploadFile: vi.fn().mockResolvedValue(undefined),
      completeUpload: vi.fn().mockResolvedValue(photo),
    };

    await expect(savePhoto(file, gateway)).resolves.toEqual(photo);
    expect(gateway.createUploadIntent).toHaveBeenCalledWith(file);
    expect(gateway.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ uploadId: "upload-1" }),
      file,
    );
    expect(gateway.completeUpload).toHaveBeenCalledWith("upload-1");
    expect(gateway.createUploadIntent.mock.invocationCallOrder[0]).toBeLessThan(
      gateway.uploadFile.mock.invocationCallOrder[0],
    );
    expect(gateway.uploadFile.mock.invocationCallOrder[0]).toBeLessThan(
      gateway.completeUpload.mock.invocationCallOrder[0],
    );
  });

  it("does not mark a photo saved when the signed PUT fails", async () => {
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });
    const gateway = {
      createUploadIntent: vi.fn().mockResolvedValue({
        uploadId: "upload-1",
        method: "PUT" as const,
        uploadUrl: "http://localhost:9000/private/key?signature=secret",
        requiredHeaders: { "Content-Type": "image/jpeg" },
        expiresAt: "2026-10-24T15:05:00Z",
      }),
      uploadFile: vi.fn().mockRejectedValue(new Error("storage unavailable")),
      completeUpload: vi.fn(),
    };

    await expect(savePhoto(file, gateway)).rejects.toThrow(
      "Não foi possível guardar esta fotografia. Tente novamente.",
    );
    expect(gateway.completeUpload).not.toHaveBeenCalled();
  });
});
