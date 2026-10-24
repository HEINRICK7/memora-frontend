import type { TemplateDefinition } from "../templates/template-catalog";

export type CompositionTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type CompositionPhotoSlot = {
  slotId: string;
  assetId: string | null;
  transform: CompositionTransform;
  cropMode: "cover" | "contain";
};

export type CompositionDocument = {
  schemaVersion: 1;
  templateId: string;
  templateVersion: number;
  slots: CompositionPhotoSlot[];
  textLayers: [];
  backgroundColor: "#F8F5EE";
};

export type LocalCompositionDraft = {
  id: string;
  document: CompositionDocument;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_TRANSFORM: CompositionTransform = Object.freeze({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
});

const DOCUMENT_FIELDS = [
  "schemaVersion",
  "templateId",
  "templateVersion",
  "slots",
  "textLayers",
  "backgroundColor",
];

const SLOT_FIELDS = ["slotId", "assetId", "transform", "cropMode"];
const TRANSFORM_FIELDS = ["x", "y", "scale", "rotation"];
const DRAFT_FIELDS = ["id", "document", "createdAt", "updatedAt"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidLocalCompositionDraftId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((field, index) => field === [...expected].sort()[index]);
}

function fail(message: string): never {
  throw new Error(`Invalid composition document: ${message}`);
}

export function createCompositionDocument(
  template: TemplateDefinition,
): CompositionDocument {
  return {
    schemaVersion: 1,
    templateId: template.templateId,
    templateVersion: template.version,
    slots: template.slots.map(({ slotId }) => ({
      slotId,
      assetId: null,
      transform: { ...DEFAULT_TRANSFORM },
      cropMode: "cover",
    })),
    textLayers: [],
    backgroundColor: "#F8F5EE",
  };
}

export function assertValidCompositionDocument(
  candidate: unknown,
  template: TemplateDefinition,
): asserts candidate is CompositionDocument {
  if (!isRecord(candidate) || !hasExactFields(candidate, DOCUMENT_FIELDS)) {
    fail("document fields are invalid");
  }
  if (
    candidate.schemaVersion !== 1 ||
    candidate.templateId !== template.templateId ||
    candidate.templateVersion !== template.version
  ) {
    fail("schema or template version does not match");
  }
  if (!Array.isArray(candidate.slots) || candidate.slots.length !== template.slots.length) {
    fail("slot count does not match the template");
  }
  if (!Array.isArray(candidate.textLayers) || candidate.textLayers.length !== 0) {
    fail("text layers are not supported by schema v1");
  }
  if (candidate.backgroundColor !== "#F8F5EE") {
    fail("background color is not supported");
  }

  for (let index = 0; index < template.slots.length; index += 1) {
    const expectedSlot = template.slots[index]!;
    const slot = candidate.slots[index];
    if (!isRecord(slot) || !hasExactFields(slot, SLOT_FIELDS)) {
      fail(`slot ${index + 1} fields are invalid`);
    }
    if (slot.slotId !== expectedSlot.slotId) {
      fail(`slot ${index + 1} does not match template order`);
    }
    if (slot.assetId !== null && (typeof slot.assetId !== "string" || slot.assetId.length === 0)) {
      fail(`slot ${slot.slotId} assetId is invalid`);
    }
    if (slot.cropMode !== "cover" && slot.cropMode !== "contain") {
      fail(`slot ${slot.slotId} cropMode is unsupported`);
    }
    if (!isRecord(slot.transform) || !hasExactFields(slot.transform, TRANSFORM_FIELDS)) {
      fail(`slot ${slot.slotId} transform fields are invalid`);
    }
    for (const field of TRANSFORM_FIELDS) {
      if (typeof slot.transform[field] !== "number" || !Number.isFinite(slot.transform[field])) {
        fail(`slot ${slot.slotId} transform must be finite`);
      }
      if (slot.transform[field] !== DEFAULT_TRANSFORM[field as keyof CompositionTransform]) {
        fail(`slot ${slot.slotId} transform must use the v1 default`);
      }
    }
  }
}

export function assertValidLocalCompositionDraft(
  candidate: unknown,
  template: TemplateDefinition,
): asserts candidate is LocalCompositionDraft {
  if (!isRecord(candidate) || !hasExactFields(candidate, DRAFT_FIELDS)) {
    fail("draft fields are invalid");
  }
  if (!isValidLocalCompositionDraftId(candidate.id)) {
    fail("draft id must be a UUID");
  }
  if (
    typeof candidate.createdAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.createdAt)) ||
    typeof candidate.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.updatedAt))
  ) {
    fail("draft timestamps must be valid dates");
  }
  assertValidCompositionDocument(candidate.document, template);
}

export function setPhotoForSlot(
  document: CompositionDocument,
  slotId: string,
  assetId: string,
): CompositionDocument {
  if (!assetId) fail("assetId must not be empty");
  const slotExists = document.slots.some((slot) => slot.slotId === slotId);
  if (!slotExists) fail(`slot ${slotId} does not exist`);
  return {
    ...document,
    slots: document.slots.map((slot) =>
      slot.slotId === slotId ? { ...slot, assetId } : slot,
    ),
  };
}

export function removePhotoFromSlot(
  document: CompositionDocument,
  slotId: string,
): CompositionDocument {
  const slotExists = document.slots.some((slot) => slot.slotId === slotId);
  if (!slotExists) fail(`slot ${slotId} does not exist`);
  return {
    ...document,
    slots: document.slots.map((slot) =>
      slot.slotId === slotId ? { ...slot, assetId: null } : slot,
    ),
  };
}
