import { describe, expect, it, vi } from "vitest";
import { createPhotoApiGateway } from "./photo-api-gateway";

describe("createPhotoApiGateway (MEM-001-API-01..05)", () => {
  it("uses the API contract and sends file bytes only to the signed URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          uploadId: "upload-1",
          method: "PUT",
          uploadUrl: "http://localhost:9000/private/key?signature=secret",
          requiredHeaders: { "Content-Type": "image/jpeg" },
          expiresAt: "2026-10-24T15:05:00Z",
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        Response.json({
          id: "photo-1",
          status: "READY",
          contentType: "image/jpeg",
          sizeBytes: 5,
          previewUrl: "http://localhost:9000/private/key?signature=secret",
          previewExpiresAt: "2026-10-24T15:05:00Z",
        }),
      );
    const gateway = createPhotoApiGateway(
      "http://localhost:8080/api/v1",
      fetchMock,
    );
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });

    const intent = await gateway.createUploadIntent(file);
    await gateway.uploadFile(intent, file);
    const saved = await gateway.completeUpload(intent.uploadId);

    expect(fetchMock.mock.calls[0]).toEqual([
      "http://localhost:8080/api/v1/uploads",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "family.jpg",
          contentType: "image/jpeg",
          sizeBytes: file.size,
        }),
      }),
    ]);
    expect(fetchMock.mock.calls[1]).toEqual([
      intent.uploadUrl,
      expect.objectContaining({
        method: "PUT",
        headers: intent.requiredHeaders,
        body: file,
      }),
    ]);
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "http://localhost:8080/api/v1/uploads/upload-1/complete",
    );
    expect(saved.status).toBe("READY");
  });

  it("lists and deletes only through the versioned API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const gateway = createPhotoApiGateway(
      "http://localhost:8080/api/v1",
      fetchMock,
    );

    await expect(gateway.listPhotos()).resolves.toEqual([]);
    await gateway.deletePhoto("photo-1");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8080/api/v1/photos",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://localhost:8080/api/v1/photos/photo-1",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "DELETE" });
  });
});
