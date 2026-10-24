import { describe, expect, it, vi } from "vitest";
import { createCompositionDocument, setPhotoForSlot } from "../../domain/compositions/composition-document";
import { exportComposition } from "./export-composition";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";
import type { CompositionExportRenderer } from "./composition-export-renderer";
import type { PhotoGateway, SavedPhoto } from "../photo-gateway";

const NOW = new Date("2026-10-24T17:00:00.000Z");
const template = TEMPLATE_CATALOG_V1.find((item) => item.templateId === "polaroid-single")!;
const photo: SavedPhoto = {
  id: "asset-ready",
  status: "READY",
  contentType: "image/png",
  sizeBytes: 4096,
  previewUrl: "http://localhost:9000/private/signed-current",
  previewExpiresAt: "2026-10-24T17:15:00.000Z",
};

function makeDraft(): LocalCompositionDraft {
  const document = setPhotoForSlot(
    createCompositionDocument(template),
    "photo-1",
    photo.id,
  );
  return {
    id: "82f44972-00f0-4b5c-8711-b9ba6d331df3",
    document,
    createdAt: "2026-10-24T16:00:00.000Z",
    updatedAt: "2026-10-24T16:00:00.000Z",
  };
}

function dependencies(photos: SavedPhoto[] = [photo]) {
  const photoGateway: Pick<PhotoGateway, "listPhotos"> = {
    listPhotos: vi.fn().mockResolvedValue(photos),
  };
  const renderer: CompositionExportRenderer = {
    render: vi.fn().mockResolvedValue({
      blob: new Blob(["image-content"], { type: "image/png" }),
      mimeType: "image/png",
      width: 1200,
      height: 1500,
      fileName: "memora-polaroid-single.png",
    }),
  };
  return { photoGateway, renderer };
}

describe("exportComposition (MEM-007-R01..10)", () => {
  it("refreshes READY photos and delegates one complete local export", async () => {
    const draft = makeDraft();
    const original = JSON.stringify(draft);
    const deps = dependencies();
    const controller = new AbortController();

    const result = await exportComposition(
      draft,
      { format: "image/png" },
      { ...deps, now: () => NOW },
      controller.signal,
    );

    expect(deps.photoGateway.listPhotos).toHaveBeenCalledOnce();
    expect(deps.renderer.render).toHaveBeenCalledWith(
      expect.objectContaining({
        document: draft.document,
        template,
        options: { format: "image/png" },
        signal: controller.signal,
      }),
    );
    const request = vi.mocked(deps.renderer.render).mock.calls[0]![0];
    expect(request.photos.get(photo.id)?.previewUrl).toBe(photo.previewUrl);
    expect(result.fileName).toBe("memora-polaroid-single.png");
    expect(JSON.stringify(draft)).toBe(original);
  });

  it("fails before renderer when a referenced asset disappeared", async () => {
    const draft = makeDraft();
    const deps = dependencies([]);

    await expect(
      exportComposition(
        draft,
        { format: "image/png" },
        { ...deps, now: () => NOW },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "PHOTO_UNAVAILABLE", slotIds: ["photo-1"] });
    expect(deps.renderer.render).not.toHaveBeenCalled();
  });

  it("fails before renderer when the signed preview has expired", async () => {
    const deps = dependencies([
      { ...photo, previewExpiresAt: "2026-10-24T16:59:59.000Z" },
    ]);

    await expect(
      exportComposition(
        makeDraft(),
        { format: "image/png" },
        { ...deps, now: () => NOW },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "PHOTO_PREVIEW_EXPIRED", slotIds: ["photo-1"] });
    expect(deps.renderer.render).not.toHaveBeenCalled();
  });

  it("rejects an incomplete local composition without making a photo request", async () => {
    const draft = makeDraft();
    draft.document = createCompositionDocument(template);
    const deps = dependencies();

    await expect(
      exportComposition(
        draft,
        { format: "image/png" },
        { ...deps, now: () => NOW },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "INCOMPLETE_COMPOSITION" });
    expect(deps.photoGateway.listPhotos).not.toHaveBeenCalled();
    expect(deps.renderer.render).not.toHaveBeenCalled();
  });

  it("does not delegate a request already cancelled by the caller", async () => {
    const deps = dependencies();
    const controller = new AbortController();
    controller.abort();

    await expect(
      exportComposition(
        makeDraft(),
        { format: "image/png" },
        { ...deps, now: () => NOW },
        controller.signal,
      ),
    ).rejects.toMatchObject({ code: "CANCELLED" });
    expect(deps.photoGateway.listPhotos).not.toHaveBeenCalled();
    expect(deps.renderer.render).not.toHaveBeenCalled();
  });

  it("discards a renderer result when cancellation arrives before it resolves", async () => {
    const deps = dependencies();
    let finishRender: ((value: Awaited<ReturnType<CompositionExportRenderer["render"]>>) => void) | undefined;
    vi.mocked(deps.renderer.render).mockImplementationOnce(
      () => new Promise((resolve) => { finishRender = resolve; }),
    );
    const controller = new AbortController();
    const pending = exportComposition(
      makeDraft(),
      { format: "image/png" },
      { ...deps, now: () => NOW },
      controller.signal,
    );
    await vi.waitFor(() => expect(finishRender).toBeDefined());
    controller.abort();
    finishRender?.({
      blob: new Blob(["image-content"], { type: "image/png" }),
      mimeType: "image/png",
      width: 1200,
      height: 1500,
      fileName: "memora-polaroid-single.png",
    });

    await expect(pending).rejects.toMatchObject({ code: "CANCELLED" });
  });
});
