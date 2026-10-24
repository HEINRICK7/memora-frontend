import { describe, expect, it } from "vitest";
import {
  TEMPLATE_CATALOG_V1,
  filterTemplateCatalog,
  getTemplateOrientation,
  validateTemplateDefinition,
} from "./template-catalog";
import type { MutableTemplateDefinition } from "./template-catalog";
import type { TemplateDefinition } from "./template-catalog";

const EXPECTED_TEMPLATES = [
  {
    id: "single-photo",
    name: "Single",
    photoCount: 1,
    aspectRatio: 1,
    exportSize: [1600, 1600],
    slots: [["photo-1", 0, 0, 1, 1, 0]],
    decorations: [],
  },
  {
    id: "duo-side-by-side",
    name: "Duo",
    photoCount: 2,
    aspectRatio: 4 / 3,
    exportSize: [1600, 1200],
    slots: [
      ["photo-1", 0, 0, 0.5, 1, 0],
      ["photo-2", 0.5, 0, 0.5, 1, 1],
    ],
    decorations: [],
  },
  {
    id: "trio-featured",
    name: "Trio",
    photoCount: 3,
    aspectRatio: 4 / 3,
    exportSize: [1600, 1200],
    slots: [
      ["photo-1", 0, 0, 0.62, 1, 0],
      ["photo-2", 0.62, 0, 0.38, 0.5, 1],
      ["photo-3", 0.62, 0.5, 0.38, 0.5, 2],
    ],
    decorations: [],
  },
  {
    id: "classic-strip",
    name: "Classic strip",
    photoCount: 4,
    aspectRatio: 2 / 3,
    exportSize: [1200, 1800],
    slots: [
      ["photo-1", 0, 0, 1, 0.25, 0],
      ["photo-2", 0, 0.25, 1, 0.25, 1],
      ["photo-3", 0, 0.5, 1, 0.25, 2],
      ["photo-4", 0, 0.75, 1, 0.25, 3],
    ],
    decorations: [],
  },
  {
    id: "grid-four",
    name: "Grid",
    photoCount: 4,
    aspectRatio: 1,
    exportSize: [1600, 1600],
    slots: [
      ["photo-1", 0, 0, 0.5, 0.5, 0],
      ["photo-2", 0.5, 0, 0.5, 0.5, 1],
      ["photo-3", 0, 0.5, 0.5, 0.5, 2],
      ["photo-4", 0.5, 0.5, 0.5, 0.5, 3],
    ],
    decorations: [],
  },
  {
    id: "polaroid-single",
    name: "Polaroid",
    photoCount: 1,
    aspectRatio: 4 / 5,
    exportSize: [1200, 1500],
    slots: [["photo-1", 0.08, 0.06, 0.84, 0.72, 1]],
    decorations: [["polaroid-paper", 1, 0, 0, 1, 1, 0]],
  },
  {
    id: "grid-six",
    name: "Grid 6",
    photoCount: 6,
    aspectRatio: 4 / 3,
    exportSize: [1800, 1350],
    slots: [
      ["photo-1", 0, 0, 1 / 3, 0.5, 0],
      ["photo-2", 1 / 3, 0, 1 / 3, 0.5, 1],
      ["photo-3", 2 / 3, 0, 1 / 3, 0.5, 2],
      ["photo-4", 0, 0.5, 1 / 3, 0.5, 3],
      ["photo-5", 1 / 3, 0.5, 1 / 3, 0.5, 4],
      ["photo-6", 2 / 3, 0.5, 1 / 3, 0.5, 5],
    ],
    decorations: [],
  },
  {
    id: "story-trio",
    name: "Story trio",
    photoCount: 3,
    aspectRatio: 2 / 3,
    exportSize: [1200, 1800],
    slots: [
      ["photo-1", 0, 0, 1, 0.62, 0],
      ["photo-2", 0, 0.62, 0.5, 0.38, 1],
      ["photo-3", 0.5, 0.62, 0.5, 0.38, 2],
    ],
    decorations: [],
  },
];

function template(templateId: string): MutableTemplateDefinition {
  const found = TEMPLATE_CATALOG_V1.find((item) => item.templateId === templateId);
  if (!found) throw new Error(`Template fixture not found: ${templateId}`);
  return JSON.parse(JSON.stringify(found)) as MutableTemplateDefinition;
}

function slotGeometry(definition: TemplateDefinition) {
  return definition.slots.map((slot) => [
    slot.slotId,
    slot.x,
    slot.y,
    slot.width,
    slot.height,
    slot.layerOrder,
  ]);
}

describe("template catalog data (MEM-003-DOM-02)", () => {
  it("contains the eight stable version-one definitions with their declared geometry", () => {
    expect(TEMPLATE_CATALOG_V1).toHaveLength(8);

    expect(
      TEMPLATE_CATALOG_V1.map((definition) => ({
        id: definition.templateId,
        name: definition.name,
        version: definition.version,
        photoCount: definition.photoCount,
        aspectRatio: definition.aspectRatio,
        exportSize: [definition.export.width, definition.export.height],
        slots: slotGeometry(definition),
        decorations: definition.decorations.map((decoration) => [
          decoration.decorationId,
          decoration.styleVersion,
          decoration.x,
          decoration.y,
          decoration.width,
          decoration.height,
          decoration.layerOrder,
        ]),
      })),
    ).toEqual(
      EXPECTED_TEMPLATES.map((expected) => ({
        ...expected,
        version: 1,
      })),
    );
  });

  it("keeps photo count, export ratio, formats, quality, and derived orientation coherent", () => {
    for (const definition of TEMPLATE_CATALOG_V1) {
      expect(definition.photoCount).toBe(definition.slots.length);
      expect(
        Math.abs(
          definition.aspectRatio -
            definition.export.width / definition.export.height,
        ),
      ).toBeLessThanOrEqual(1e-9);
      expect(definition.export.formats).toEqual(["image/png", "image/jpeg"]);
      expect(definition.export.jpegQuality).toBe(0.92);
    }

    expect(getTemplateOrientation(1)).toBe("square");
    expect(getTemplateOrientation(4 / 3)).toBe("landscape");
    expect(getTemplateOrientation(2 / 3)).toBe("portrait");
  });

  it("freezes catalog entries and nested geometry/export data", () => {
    const polaroid = TEMPLATE_CATALOG_V1.find(
      (definition) => definition.templateId === "polaroid-single",
    );
    expect(Object.isFrozen(TEMPLATE_CATALOG_V1)).toBe(true);
    expect(polaroid).toBeDefined();
    expect(Object.isFrozen(polaroid)).toBe(true);
    expect(Object.isFrozen(polaroid?.slots)).toBe(true);
    expect(Object.isFrozen(polaroid?.slots[0])).toBe(true);
    expect(Object.isFrozen(polaroid?.decorations)).toBe(true);
    expect(Object.isFrozen(polaroid?.decorations[0])).toBe(true);
    expect(Object.isFrozen(polaroid?.export)).toBe(true);
    expect(Object.isFrozen(polaroid?.export.formats)).toBe(true);
  });
});

describe("validateTemplateDefinition (MEM-003-AC02)", () => {
  it("accepts all eight catalog definitions and adjacent slots", () => {
    for (const definition of TEMPLATE_CATALOG_V1) {
      expect(() => validateTemplateDefinition(definition)).not.toThrow();
    }
    expect(() => validateTemplateDefinition(template("duo-side-by-side"))).not.toThrow();
  });

  it("rejects duplicate slot identifiers and duplicate layer orders", () => {
    const duplicateSlotId = template("duo-side-by-side");
    duplicateSlotId.slots[1]!.slotId = duplicateSlotId.slots[0]!.slotId;
    expect(() => validateTemplateDefinition(duplicateSlotId)).toThrow();

    const duplicateLayerOrder = template("duo-side-by-side");
    duplicateLayerOrder.slots[1]!.layerOrder = duplicateLayerOrder.slots[0]!.layerOrder;
    expect(() => validateTemplateDefinition(duplicateLayerOrder)).toThrow();
  });

  it("rejects photo counts that differ from the slot count", () => {
    const definition = template("single-photo");
    definition.photoCount = 2;
    expect(() => validateTemplateDefinition(definition)).toThrow();
  });

  it.each([
    ["zero width", { width: 0 }],
    ["negative height", { height: -0.1 }],
  ])("rejects a slot with %s", (_label, invalidArea) => {
    const definition = template("single-photo");
    Object.assign(definition.slots[0], invalidArea);
    expect(() => validateTemplateDefinition(definition)).toThrow();
  });

  it("rejects out-of-bounds and positively overlapping slots", () => {
    const outOfBounds = template("single-photo");
    outOfBounds.slots[0]!.x = 0.2;
    expect(() => validateTemplateDefinition(outOfBounds)).toThrow();

    const overlapping = template("duo-side-by-side");
    overlapping.slots[1]!.x = 0.49;
    expect(() => validateTemplateDefinition(overlapping)).toThrow();
  });

  it.each(
    [
      ["below the supported range", 0.49, 49, 100],
      ["above the supported range", 2.01, 201, 100],
      ["NaN", Number.NaN, 1600, 1600],
      ["infinity", Number.POSITIVE_INFINITY, 1600, 1600],
    ] as Array<[string, number, number, number]>,
  )(
    "rejects an aspect ratio that is %s",
    (_label: string, aspectRatio: number, exportWidth: number, exportHeight: number) => {
      const definition = template("single-photo");
      definition.aspectRatio = aspectRatio;
      definition.export.width = exportWidth;
      definition.export.height = exportHeight;
      expect(() => validateTemplateDefinition(definition)).toThrow();
    },
  );

  it.each([
    ["zero width", { width: 0 }],
    ["negative height", { height: -1 }],
  ])("rejects export dimensions with %s", (_label, invalidDimensions) => {
    const definition = template("single-photo");
    Object.assign(definition.export, invalidDimensions);
    expect(() => validateTemplateDefinition(definition)).toThrow();
  });

  it("rejects export dimensions whose ratio differs beyond the declared tolerance", () => {
    const definition = template("single-photo");
    definition.export.width = 1599;
    expect(() => validateTemplateDefinition(definition)).toThrow();
  });

  it("accepts export ratio differences within the declared tolerance", () => {
    const definition = template("single-photo");
    definition.aspectRatio = 1 + 1e-10;
    expect(() => validateTemplateDefinition(definition)).not.toThrow();
  });

  it("rejects unsupported export formats and quality outside the normalized range", () => {
    const unsupportedFormat = template("single-photo");
    unsupportedFormat.export.formats = ["image/webp"] as unknown as MutableTemplateDefinition["export"]["formats"];
    expect(() => validateTemplateDefinition(unsupportedFormat)).toThrow();

    for (const quality of [-0.01, 1.01]) {
      const invalidQuality = template("single-photo");
      invalidQuality.export.jpegQuality = quality;
      expect(() => validateTemplateDefinition(invalidQuality)).toThrow();
    }
  });

  it("rejects decorations outside the canvas and duplicate slot/decoration layer order", () => {
    const outOfBoundsDecoration = template("polaroid-single");
    outOfBoundsDecoration.decorations[0]!.x = 0.01;
    expect(() => validateTemplateDefinition(outOfBoundsDecoration)).toThrow();

    const duplicateLayerOrder = template("polaroid-single");
    duplicateLayerOrder.decorations[0]!.layerOrder =
      duplicateLayerOrder.slots[0]!.layerOrder;
    expect(() => validateTemplateDefinition(duplicateLayerOrder)).toThrow();
  });
});

describe("filterTemplateCatalog (MEM-003-DOM-03)", () => {
  it("combines exact photo count and aspect ratio filters while retaining catalog order", () => {
    expect(
      filterTemplateCatalog(TEMPLATE_CATALOG_V1, {
        photoCount: 4,
        aspectRatio: "1:1",
      }).map((definition) => definition.templateId),
    ).toEqual(["grid-four"]);

    expect(
      filterTemplateCatalog(TEMPLATE_CATALOG_V1, {
        photoCount: 3,
        aspectRatio: "2:3",
      }).map((definition) => definition.templateId),
    ).toEqual(["story-trio"]);

    expect(
      filterTemplateCatalog(TEMPLATE_CATALOG_V1, {
        aspectRatio: "4:3",
      }).map((definition) => definition.templateId),
    ).toEqual(["duo-side-by-side", "trio-featured", "grid-six"]);
  });

  it("returns no results for an impossible combination and preserves order without filters", () => {
    expect(
      filterTemplateCatalog(TEMPLATE_CATALOG_V1, {
        photoCount: 6,
        aspectRatio: "1:1",
      }),
    ).toEqual([]);
    expect(filterTemplateCatalog(TEMPLATE_CATALOG_V1, {}).map((item) => item.templateId)).toEqual(
      EXPECTED_TEMPLATES.map((item) => item.id),
    );
  });
});
