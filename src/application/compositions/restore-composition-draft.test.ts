import { describe, expect, it, vi } from "vitest";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import { createCompositionDocument } from "../../domain/compositions/composition-document";
import {
  listCompositionDrafts,
  restoreCompositionDraft,
  refreshCompositionPreviews,
} from "./restore-composition-draft";

const makeDraft = () => {
  const definition = TEMPLATE_CATALOG_V1.find(
    (item) => item.templateId === "duo-side-by-side",
  )!;
  const document = createCompositionDocument(definition);
  document.slots[0].assetId = "asset-a";
  document.slots[1].assetId = "asset-deleted";
  return {
    id: "82f44972-00f0-4b5c-8711-b9ba6d331df3",
    createdAt: "2026-10-24T15:30:00.000Z",
    updatedAt: "2026-10-24T15:31:00.000Z",
    document,
  };
};

const photo = (id: string, previewUrl: string) => ({
  id,
  status: "READY" as const,
  contentType: "image/jpeg" as const,
  sizeBytes: 100,
  previewUrl,
  previewExpiresAt: "2026-10-24T16:30:00.000Z",
});

describe("restore local composition draft (MEM-005-R05-09, R13)", () => {
  it("keeps incompatible records recoverable without exposing their fields in the catalog", async () => {
    const valid = makeDraft();
    const incompatible = {
      ...makeDraft(),
      id: "edb46de7-887d-4ac8-a2ca-caa04d3843ec",
      updatedAt: "2026-10-24T16:00:00.000Z",
      document: {
        ...makeDraft().document,
        slots: makeDraft().document.slots.map((slot, index) =>
          index === 0
            ? { ...slot, transform: { ...slot.transform, scale: 2 } }
            : slot,
        ),
      },
      injectedLabel: "<script>unsafe</script>",
    };
    const store = {
      list: vi.fn().mockResolvedValue([valid, incompatible]),
      get: vi.fn(),
      save: vi.fn(),
    };

    const listed = await listCompositionDrafts({ store });

    expect(listed.map((draft) => draft.id)).toEqual([
      incompatible.id,
      valid.id,
    ]);
    expect(listed[0]).toMatchObject({
      compatible: false,
      template: null,
      updatedAt: incompatible.updatedAt,
    });
    expect(JSON.stringify(listed)).not.toContain("unsafe");
    expect(store.save).not.toHaveBeenCalled();
  });

  it("resolves current signed preview URLs after loading document IDs", async () => {
    const stored = makeDraft();
    const store = {
      get: vi.fn().mockResolvedValue(stored),
      save: vi.fn(),
    };
    const photos = {
      listPhotos: vi.fn().mockResolvedValue([
        photo("asset-a", "https://signed.invalid/fresh-url"),
      ]),
    };

    const result = await restoreCompositionDraft(stored.id, {
      store,
      photos,
      catalog: TEMPLATE_CATALOG_V1,
    });

    expect(photos.listPhotos).toHaveBeenCalledOnce();
    expect(result.document.slots[0].assetId).toBe("asset-a");
    expect(result.previewsByAssetId.get("asset-a")).toBe("https://signed.invalid/fresh-url");
    expect(JSON.stringify(store.save.mock.calls)).not.toContain("signed.invalid");
  });

  it("preserves missing asset ids and marks only those slots unavailable", async () => {
    const stored = makeDraft();
    const store = { get: vi.fn().mockResolvedValue(stored), save: vi.fn() };
    const photos = {
      listPhotos: vi.fn().mockResolvedValue([
        photo("asset-a", "https://signed.invalid/fresh-url"),
      ]),
    };

    const result = await restoreCompositionDraft(stored.id, {
      store,
      photos,
      catalog: TEMPLATE_CATALOG_V1,
    });

    expect(result.document.slots.map((slot) => slot.assetId)).toEqual([
      "asset-a",
      "asset-deleted",
    ]);
    expect(result.unavailableSlotIds).toEqual(["photo-2"]);
    expect(store.save).not.toHaveBeenCalled();
  });

  it("keeps the stored composition intact when photo listing fails", async () => {
    const stored = makeDraft();
    const store = { get: vi.fn().mockResolvedValue(stored), save: vi.fn() };
    const photos = { listPhotos: vi.fn().mockRejectedValue(new Error("offline")) };

    await expect(
      restoreCompositionDraft(stored.id, {
        store,
        photos,
        catalog: TEMPLATE_CATALOG_V1,
      }),
    ).rejects.toThrow();
    expect(stored.document.slots.map((slot) => slot.assetId)).toEqual([
      "asset-a",
      "asset-deleted",
    ]);
    expect(store.save).not.toHaveBeenCalled();
  });

  it("refreshes only in-memory previews after signed URLs expire", async () => {
    const stored = makeDraft();
    const store = { get: vi.fn().mockResolvedValue(stored), save: vi.fn() };
    const photos = {
      listPhotos: vi.fn().mockResolvedValue([
        photo("asset-a", "https://signed.invalid/renewed-url"),
      ]),
    };

    const refreshed = await refreshCompositionPreviews(stored.document, {
      photos,
    });

    expect(refreshed.previewsByAssetId.get("asset-a")).toBe("https://signed.invalid/renewed-url");
    expect(refreshed.readyPhotos.map((item) => item.id)).toEqual(["asset-a"]);
    expect(refreshed.document.slots[0].assetId).toBe("asset-a");
    expect(store.save).not.toHaveBeenCalled();
  });
});
