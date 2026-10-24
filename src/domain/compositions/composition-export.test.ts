import { describe, expect, it } from "vitest";
import { createCompositionDocument, setPhotoForSlot } from "./composition-document";
import {
  CompositionExportError,
  createCompositionExportPlan,
} from "./composition-export";
import { TEMPLATE_CATALOG_V1 } from "../templates/template-catalog";
import type { TemplateDefinition } from "../templates/template-catalog";

const templateById = (id: string) => {
  const found = TEMPLATE_CATALOG_V1.find((item) => item.templateId === id);
  if (!found) throw new Error(`Missing template fixture: ${id}`);
  return found;
};

function completeDocument(template: TemplateDefinition, assetId = "photo-a") {
  return template.slots.reduce(
    (document, slot) => setPhotoForSlot(document, slot.slotId, assetId),
    createCompositionDocument(template),
  );
}

function sources(assetId = "photo-a", width = 2400, height = 2400) {
  return new Map([[assetId, { width, height }]]);
}

function expectExportError(action: () => unknown, code: string) {
  try {
    action();
    throw new Error(`Expected export error ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(CompositionExportError);
    expect(error).toMatchObject({ code });
  }
}

describe("composition export plan (MEM-007-R02..06)", () => {
  it("plans a complete composition in exact template dimensions and layer order", () => {
    const template = templateById("polaroid-single");
    const plan = createCompositionExportPlan({
      document: completeDocument(template),
      template,
      sources: sources(),
      options: { format: "image/jpeg" },
    });

    expect(plan).toMatchObject({
      width: 1200,
      height: 1500,
      format: "image/jpeg",
      jpegQuality: 0.92,
      backgroundColor: "#F8F5EE",
    });
    expect(plan.layers.map((layer) => [layer.kind, layer.layerOrder])).toEqual([
      ["decoration", 0],
      ["photo", 1],
    ]);
  });

  it("uses the template's declared JPEG quality and accepts a normalized override", () => {
    const template = templateById("single-photo");
    const document = completeDocument(template);

    expect(
      createCompositionExportPlan({
        document,
        template,
        sources: sources(),
        options: { format: "image/jpeg", jpegQuality: 0.74 },
      }).jpegQuality,
    ).toBe(0.74);
    expect(
      createCompositionExportPlan({
        document,
        template,
        sources: sources(),
        options: { format: "image/png" },
      }).jpegQuality,
    ).toBeUndefined();
  });

  it("rejects an empty slot before creating export layers", () => {
    const template = templateById("duo-side-by-side");
    const document = createCompositionDocument(template);
    const filled = setPhotoForSlot(document, "photo-1", "photo-a");

    expectExportError(
      () => createCompositionExportPlan({
        document: filled,
        template,
        sources: sources(),
        options: { format: "image/png" },
      }),
      "INCOMPLETE_COMPOSITION",
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1.01])(
    "rejects invalid JPEG quality %s",
    (jpegQuality) => {
      const template = templateById("single-photo");
      expectExportError(
        () => createCompositionExportPlan({
          document: completeDocument(template),
          template,
          sources: sources(),
          options: { format: "image/jpeg", jpegQuality },
        }),
        "INVALID_QUALITY",
      );
    },
  );

  it("rejects a format not allowed by the selected template", () => {
    const template = {
      ...templateById("single-photo"),
      export: {
        ...templateById("single-photo").export,
        formats: ["image/png"] as const,
      },
    } as TemplateDefinition;

    expectExportError(
      () => createCompositionExportPlan({
        document: completeDocument(template),
        template,
        sources: sources(),
        options: { format: "image/jpeg" },
      }),
      "UNSUPPORTED_FORMAT",
    );
  });

  it("rejects an output canvas above the v1 side or area limits", () => {
    const base = templateById("single-photo");
    const tooLarge = {
      ...base,
      export: { ...base.export, width: 1800, height: 1800 },
    } as TemplateDefinition;

    expectExportError(
      () => createCompositionExportPlan({
        document: completeDocument(tooLarge),
        template: tooLarge,
        sources: sources(),
        options: { format: "image/png" },
      }),
      "UNSUPPORTED_TEMPLATE_DIMENSIONS",
    );
  });

  it("does not allow a cover or contain slot to upscale a low-resolution source", () => {
    const template = templateById("single-photo");
    const document = completeDocument(template);

    expectExportError(
      () => createCompositionExportPlan({
        document,
        template,
        sources: sources("photo-a", 500, 500),
        options: { format: "image/png" },
      }),
      "INSUFFICIENT_SOURCE_RESOLUTION",
    );

    const contain = {
      ...document,
      slots: document.slots.map((slot) => ({ ...slot, cropMode: "contain" as const })),
    };
    expectExportError(
      () => createCompositionExportPlan({
        document: contain,
        template,
        sources: sources("photo-a", 500, 500),
        options: { format: "image/png" },
      }),
      "INSUFFICIENT_SOURCE_RESOLUTION",
    );
  });

  it("reports every unavailable referenced asset instead of silently omitting it", () => {
    const template = templateById("duo-side-by-side");
    const document = setPhotoForSlot(
      setPhotoForSlot(createCompositionDocument(template), "photo-1", "photo-a"),
      "photo-2",
      "photo-b",
    );

    try {
      createCompositionExportPlan({
        document,
        template,
        sources: sources("photo-a"),
        options: { format: "image/png" },
      });
      throw new Error("Expected missing source to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionExportError);
      expect(error).toMatchObject({ code: "PHOTO_UNAVAILABLE", assetIds: ["photo-b"] });
    }
  });
});
