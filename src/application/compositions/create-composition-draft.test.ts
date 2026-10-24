import { describe, expect, it, vi } from "vitest";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import { createCompositionDraft } from "./create-composition-draft";

const FIXED_ID = "82f44972-00f0-4b5c-8711-b9ba6d331df3";
const FIXED_TIME = "2026-10-24T15:30:00.000Z";

describe("create local composition draft (MEM-005-R01, R04, AC01-02)", () => {
  it("persists a versioned empty composition and returns its local route id", async () => {
    const store = { create: vi.fn(async (draft) => draft) };
    const result = await createCompositionDraft("duo-side-by-side", {
      catalog: TEMPLATE_CATALOG_V1,
      store,
      createId: () => FIXED_ID,
      now: () => new Date(FIXED_TIME),
    });

    expect(store.create).toHaveBeenCalledOnce();
    expect(store.create).toHaveBeenCalledWith({
      id: FIXED_ID,
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      document: {
        schemaVersion: 1,
        templateId: "duo-side-by-side",
        templateVersion: 1,
        slots: ["photo-1", "photo-2"].map((slotId) => ({
          slotId,
          assetId: null,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          cropMode: "cover",
        })),
        textLayers: [],
        backgroundColor: "#F8F5EE",
      },
    });
    expect(result.id).toBe(FIXED_ID);
  });

  it("does not create a partial draft when the template is unknown", async () => {
    const store = { create: vi.fn() };

    await expect(
      createCompositionDraft("missing-template", {
        catalog: TEMPLATE_CATALOG_V1,
        store,
        createId: () => FIXED_ID,
        now: () => new Date(FIXED_TIME),
      }),
    ).rejects.toThrow();
    expect(store.create).not.toHaveBeenCalled();
  });

  it("does not report creation success when IndexedDB create fails", async () => {
    const storageError = new Error("QuotaExceededError");
    const store = { create: vi.fn().mockRejectedValue(storageError) };

    await expect(
      createCompositionDraft("single-photo", {
        catalog: TEMPLATE_CATALOG_V1,
        store,
        createId: () => FIXED_ID,
        now: () => new Date(FIXED_TIME),
      }),
    ).rejects.toBe(storageError);
  });
});
