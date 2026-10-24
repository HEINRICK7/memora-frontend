import { describe, expect, it, vi } from "vitest";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import { createCompositionDocument } from "../../domain/compositions/composition-document";
import { assignCompositionPhoto, removeCompositionPhoto } from "./edit-composition-photo";

const draft = () => ({
  id: "82f44972-00f0-4b5c-8711-b9ba6d331df3",
  createdAt: "2026-10-24T15:30:00.000Z",
  updatedAt: "2026-10-24T15:30:00.000Z",
  document: createCompositionDocument(
    TEMPLATE_CATALOG_V1.find((item) => item.templateId === "duo-side-by-side")!,
  ),
});

const readyPhoto = (id: string, previewUrl: string) => ({
  id,
  status: "READY" as const,
  contentType: "image/jpeg" as const,
  sizeBytes: 100,
  previewUrl,
  previewExpiresAt: "2026-10-24T16:30:00.000Z",
});

describe("edit composition photo assignment (MEM-005-R03-06)", () => {
  it("assigns only a READY asset and persists only its id, never its signed URL", async () => {
    const current = draft();
    const store = {
      get: vi.fn().mockResolvedValue(current),
      save: vi.fn(async (updated) => updated),
    };
    const photos = {
      listPhotos: vi.fn().mockResolvedValue([
        readyPhoto("asset-a", "https://signed.invalid/current-preview"),
      ]),
    };

    const updated = await assignCompositionPhoto(
      current.id,
      "photo-1",
      "asset-a",
      { store, photos, now: () => new Date("2026-10-24T15:31:00.000Z") },
    );

    expect(photos.listPhotos).toHaveBeenCalledOnce();
    expect(updated.document.slots[0].assetId).toBe("asset-a");
    expect(updated.document.slots[1].assetId).toBeNull();
    expect(JSON.stringify(store.save.mock.calls[0][0])).not.toContain("signed.invalid");
  });

  it("allows the same READY asset in multiple slots", async () => {
    const current = draft();
    const store = {
      get: vi.fn().mockResolvedValue(current),
      save: vi.fn(async (updated) => updated),
    };
    const photos = {
      listPhotos: vi.fn().mockResolvedValue([
        readyPhoto("asset-a", "https://signed.invalid/current-preview"),
      ]),
    };

    const first = await assignCompositionPhoto(current.id, "photo-1", "asset-a", {
      store,
      photos,
      now: () => new Date("2026-10-24T15:31:00.000Z"),
    });
    store.get.mockResolvedValue(first);
    const second = await assignCompositionPhoto(current.id, "photo-2", "asset-a", {
      store,
      photos,
      now: () => new Date("2026-10-24T15:32:00.000Z"),
    });

    expect(second.document.slots.map((slot) => slot.assetId)).toEqual([
      "asset-a",
      "asset-a",
    ]);
  });

  it("rejects assets absent from the READY library without changing the draft", async () => {
    const current = draft();
    const store = {
      get: vi.fn().mockResolvedValue(current),
      save: vi.fn(),
    };
    const photos = { listPhotos: vi.fn().mockResolvedValue([]) };

    await expect(
      assignCompositionPhoto(current.id, "photo-1", "not-ready", {
        store,
        photos,
        now: () => new Date("2026-10-24T15:31:00.000Z"),
      }),
    ).rejects.toThrow();
    expect(store.save).not.toHaveBeenCalled();
    expect(current.document.slots[0].assetId).toBeNull();
  });

  it("removes one association and leaves all other slots unchanged", async () => {
    const current = draft();
    current.document.slots[0].assetId = "asset-a";
    current.document.slots[1].assetId = "asset-b";
    const store = {
      get: vi.fn().mockResolvedValue(current),
      save: vi.fn(async (updated) => updated),
    };

    const updated = await removeCompositionPhoto(current.id, "photo-1", {
      store,
      now: () => new Date("2026-10-24T15:31:00.000Z"),
    });

    expect(updated.document.slots.map((slot) => slot.assetId)).toEqual([
      null,
      "asset-b",
    ]);
  });
});
