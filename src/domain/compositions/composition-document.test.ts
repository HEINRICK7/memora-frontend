import { describe, expect, it } from "vitest";
import { TEMPLATE_CATALOG_V1 } from "../templates/template-catalog";
import {
  assertValidCompositionDocument,
  createCompositionDocument,
  removePhotoFromSlot,
  setPhotoForSlot,
} from "./composition-document";

const template = (templateId: string) => {
  const found = TEMPLATE_CATALOG_V1.find((item) => item.templateId === templateId);
  if (!found) throw new Error(`Missing template fixture: ${templateId}`);
  return found;
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
type InvalidCase = readonly [string, (document: any) => void];

describe("composition document v1 (MEM-005-LOCAL-01)", () => {
  it.each(TEMPLATE_CATALOG_V1)(
    "creates $templateId with one empty document slot per declared slot",
    (definition) => {
      const document = createCompositionDocument(definition);

      expect(document).toEqual({
        schemaVersion: 1,
        templateId: definition.templateId,
        templateVersion: definition.version,
        slots: definition.slots.map(({ slotId }) => ({
          slotId,
          assetId: null,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          cropMode: "cover",
        })),
        textLayers: [],
        backgroundColor: "#F8F5EE",
      });
    },
  );

  it("preserves template slot order and validates against its exact version", () => {
    const selectedTemplate = template("duo-side-by-side");
    const document = createCompositionDocument(selectedTemplate);

    expect(document.slots.map((slot) => slot.slotId)).toEqual(
      selectedTemplate.slots.map((slot) => slot.slotId),
    );
    expect(() => assertValidCompositionDocument(document, selectedTemplate)).not.toThrow();
    expect(() =>
      assertValidCompositionDocument(document, template("grid-four")),
    ).toThrow();
  });

  it("assigns, replaces, reuses, and removes assets immutably per slot", () => {
    const selectedTemplate = template("duo-side-by-side");
    const original = createCompositionDocument(selectedTemplate);
    const oneFilled = setPhotoForSlot(original, "photo-1", "asset-a");
    const twoFilled = setPhotoForSlot(oneFilled, "photo-2", "asset-a");
    const replaced = setPhotoForSlot(twoFilled, "photo-1", "asset-b");
    const removed = removePhotoFromSlot(replaced, "photo-2");

    expect(original.slots.every((slot) => slot.assetId === null)).toBe(true);
    expect(twoFilled.slots.map((slot) => slot.assetId)).toEqual([
      "asset-a",
      "asset-a",
    ]);
    expect(replaced.slots.map((slot) => slot.assetId)).toEqual([
      "asset-b",
      "asset-a",
    ]);
    expect(removed.slots.map((slot) => slot.assetId)).toEqual([
      "asset-b",
      null,
    ]);
  });

  const invalidCases: InvalidCase[] = [
    ["schema version", (document: any) => (document.schemaVersion = 2)],
    ["template version", (document: any) => (document.templateVersion = 9)],
    ["missing slot", (document: any) => document.slots.pop()],
    ["extra slot", (document: any) => document.slots.push(clone(document.slots[0]))],
    ["slot order", (document: any) => document.slots.reverse()],
    ["non-default transform", (document: any) => (document.slots[0].transform.scale = 2)],
    ["non-finite transform", (document: any) => (document.slots[0].transform.x = Number.NaN)],
    ["unsupported crop mode", (document: any) => (document.slots[0].cropMode = "stretch")],
    ["background color", (document: any) => (document.backgroundColor = "#000000")],
    ["non-empty text layers", (document: any) => document.textLayers.push({ text: "x" })],
    ["unknown field", (document: any) => (document.previewUrl = "https://signed.invalid")],
  ];

  it.each(invalidCases)("rejects an invalid document with %s", (_caseName, mutate) => {
    const selectedTemplate = template("duo-side-by-side");
    const invalid = clone(createCompositionDocument(selectedTemplate));
    mutate(invalid);

    expect(() => assertValidCompositionDocument(invalid, selectedTemplate)).toThrow();
  });
});
