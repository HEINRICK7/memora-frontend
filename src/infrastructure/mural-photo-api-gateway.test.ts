import { describe, expect, it, vi } from "vitest";
import { MuralGatewayError } from "../application/mural-gateway";
import { createMuralPhotoApiGateway } from "./mural-photo-api-gateway";

const MURAL_ID = "c0f5f693-7160-4e49-9d76-cfaba4edce1c";
const PHOTO_ID = "a0f5f693-7160-4e49-9d76-cfaba4edce1c";

const PHOTO_PAGE = {
  muralVersion: 1,
  items: [
    {
      photoId: PHOTO_ID,
      position: 0,
      contentType: "image/webp",
      sizeBytes: 12_000,
      previewUrl: "https://minio.test/photo?signature=temporary",
      previewExpiresAt: "2026-10-25T12:05:00.000Z",
    },
  ],
};

describe("MuralPhotoApiGateway", () => {
  it("loads private photo previews without caching the signed response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(PHOTO_PAGE), { status: 200 }),
    );
    const gateway = createMuralPhotoApiGateway("http://api.test/api/v1", fetcher);

    await expect(gateway.listMuralPhotos(MURAL_ID)).resolves.toEqual(PHOTO_PAGE);

    expect(fetcher).toHaveBeenCalledWith(
      `http://api.test/api/v1/murals/${MURAL_ID}/photos`,
      { cache: "no-store", method: "GET" },
    );
  });

  it("rejects a malformed photo response instead of presenting an invented count", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ muralVersion: 1, items: [{ photoId: "invalid" }] }), {
        status: 200,
      }),
    );
    const gateway = createMuralPhotoApiGateway("http://api.test/api/v1", fetcher);

    await expect(gateway.listMuralPhotos(MURAL_ID)).rejects.toMatchObject({
      status: 502,
      code: "invalid_api_response",
    });
  });

  it("preserves access denial while keeping signed URLs out of error messages", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: 401, code: "unauthenticated", detail: "signed-url-secret" }),
        { status: 401 },
      ),
    );
    const gateway = createMuralPhotoApiGateway("http://api.test/api/v1", fetcher);

    const error = await gateway.listMuralPhotos(MURAL_ID).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MuralGatewayError);
    expect(error).toMatchObject({ status: 401, code: "unauthenticated" });
    expect((error as Error).message).not.toContain("signed-url-secret");
  });
});
