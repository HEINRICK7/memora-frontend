import { assertValidCompositionDocument } from "./composition-document";
import type { CompositionDocument } from "./composition-document";
import type {
  PhotoSlotDefinition,
  TemplateDefinition,
  TemplateDecorationDefinition,
} from "../templates/template-catalog";
import { validateTemplateDefinition } from "../templates/template-catalog";

export type CompositionExportFormat = "image/png" | "image/jpeg";

export type CompositionExportOptions = {
  format: CompositionExportFormat;
  jpegQuality?: number;
};

export type CompositionExportErrorCode =
  | "INVALID_DRAFT"
  | "INVALID_TEMPLATE"
  | "INCOMPLETE_COMPOSITION"
  | "PHOTO_UNAVAILABLE"
  | "PHOTO_PREVIEW_EXPIRED"
  | "PHOTO_DECODE_FAILED"
  | "INSUFFICIENT_SOURCE_RESOLUTION"
  | "UNSUPPORTED_FORMAT"
  | "INVALID_QUALITY"
  | "UNSUPPORTED_TEMPLATE_DIMENSIONS"
  | "CANVAS_CORS"
  | "ENCODING_FAILED"
  | "CANCELLED";

export class CompositionExportError extends Error {
  readonly code: CompositionExportErrorCode;
  readonly slotIds: readonly string[];
  readonly assetIds: readonly string[];

  constructor(
    code: CompositionExportErrorCode,
    message: string,
    details: { slotIds?: readonly string[]; assetIds?: readonly string[] } = {},
  ) {
    super(message);
    this.name = "CompositionExportError";
    this.code = code;
    this.slotIds = details.slotIds ?? [];
    this.assetIds = details.assetIds ?? [];
  }
}

export type SourceDimensions = Readonly<{ width: number; height: number }>;

export type CompositionExportLayer =
  | Readonly<{
      kind: "decoration";
      layerOrder: number;
      definition: TemplateDecorationDefinition;
    }>
  | Readonly<{
      kind: "photo";
      layerOrder: number;
      slotId: string;
      assetId: string;
      cropMode: "cover" | "contain";
      definition: PhotoSlotDefinition;
      source: SourceDimensions;
    }>;

export type CompositionExportPlan = Readonly<{
  width: number;
  height: number;
  format: CompositionExportFormat;
  jpegQuality?: number;
  backgroundColor: CompositionDocument["backgroundColor"];
  layers: readonly CompositionExportLayer[];
}>;

export type CreateCompositionExportPlanInput = Readonly<{
  document: CompositionDocument;
  template: TemplateDefinition;
  sources: ReadonlyMap<string, SourceDimensions>;
  options: CompositionExportOptions;
}>;

const MAX_EXPORT_SIDE = 1800;
const MAX_EXPORT_PIXELS = 2_560_000;

function invalid(code: CompositionExportErrorCode, message: string): never {
  throw new CompositionExportError(code, message);
}

function hasEnoughPixels(
  width: number,
  height: number,
  source: SourceDimensions,
  cropMode: "cover" | "contain",
): boolean {
  const widthScale = width / source.width;
  const heightScale = height / source.height;
  const requiredScale = cropMode === "cover"
    ? Math.max(widthScale, heightScale)
    : Math.min(widthScale, heightScale);
  return requiredScale <= 1;
}

export function createCompositionExportPlan(
  input: CreateCompositionExportPlanInput,
): CompositionExportPlan {
  const { document, template, sources, options } = input;

  if (
    document.templateId !== template.templateId ||
    document.templateVersion !== template.version
  ) {
    invalid("INVALID_DRAFT", "A composição não corresponde à versão do template.");
  }
  try {
    assertValidCompositionDocument(document, template);
  } catch {
    invalid("INVALID_DRAFT", "A composição local não pode ser exportada nesta versão.");
  }

  const { width, height } = template.export;
  if (
    !Number.isInteger(width) || !Number.isInteger(height) ||
    width < 1 || height < 1 ||
    width > MAX_EXPORT_SIDE || height > MAX_EXPORT_SIDE ||
    width * height > MAX_EXPORT_PIXELS
  ) {
    invalid(
      "UNSUPPORTED_TEMPLATE_DIMENSIONS",
      "A resolução deste template excede o limite de exportação disponível.",
    );
  }

  try {
    validateTemplateDefinition(template);
  } catch {
    invalid("INVALID_TEMPLATE", "A definição do template não é válida para exportação.");
  }

  if (!template.export.formats.includes(options.format)) {
    invalid("UNSUPPORTED_FORMAT", "Este template não permite o formato selecionado.");
  }
  if (
    options.format === "image/jpeg" && options.jpegQuality !== undefined &&
    (!Number.isFinite(options.jpegQuality) || options.jpegQuality < 0 || options.jpegQuality > 1)
  ) {
    invalid("INVALID_QUALITY", "A qualidade JPEG precisa estar entre 0 e 1.");
  }

  const emptySlots = document.slots.filter((slot) => slot.assetId === null).map((slot) => slot.slotId);
  if (emptySlots.length) {
    throw new CompositionExportError(
      "INCOMPLETE_COMPOSITION",
      "Preencha todos os espaços do template antes de exportar.",
      { slotIds: emptySlots },
    );
  }

  const unavailableAssetIds = [...new Set(
    document.slots.flatMap((slot) => slot.assetId && !sources.has(slot.assetId) ? [slot.assetId] : []),
  )];
  if (unavailableAssetIds.length) {
    throw new CompositionExportError(
      "PHOTO_UNAVAILABLE",
      "Uma ou mais fotografias não estão disponíveis para exportação.",
      { assetIds: unavailableAssetIds },
    );
  }

  const layers: CompositionExportLayer[] = template.decorations.map((definition) => ({
    kind: "decoration",
    layerOrder: definition.layerOrder,
    definition,
  }));
  const unavailableSlots: string[] = [];
  const lowResolutionSlots: string[] = [];

  for (const slot of document.slots) {
    const definition = template.slots.find((candidate) => candidate.slotId === slot.slotId);
    const source = slot.assetId ? sources.get(slot.assetId) : undefined;
    if (!definition || !slot.assetId || !source) {
      unavailableSlots.push(slot.slotId);
      continue;
    }
    if (
      !Number.isInteger(source.width) || !Number.isInteger(source.height) ||
      source.width < 1 || source.height < 1
    ) {
      throw new CompositionExportError(
        "PHOTO_DECODE_FAILED",
        "Uma fotografia não pôde ser lida em resolução válida.",
        { slotIds: [slot.slotId] },
      );
    }
    const targetWidth = width * definition.width;
    const targetHeight = height * definition.height;
    if (!hasEnoughPixels(targetWidth, targetHeight, source, slot.cropMode)) {
      lowResolutionSlots.push(slot.slotId);
    }
    layers.push({
      kind: "photo",
      layerOrder: definition.layerOrder,
      slotId: slot.slotId,
      assetId: slot.assetId,
      cropMode: slot.cropMode,
      definition,
      source,
    });
  }

  if (unavailableSlots.length) {
    throw new CompositionExportError(
      "PHOTO_UNAVAILABLE",
      "Uma ou mais fotografias não estão disponíveis para exportação.",
      { slotIds: unavailableSlots },
    );
  }
  if (lowResolutionSlots.length) {
    throw new CompositionExportError(
      "INSUFFICIENT_SOURCE_RESOLUTION",
      "Escolha uma fotografia com resolução suficiente para o tamanho deste espaço.",
      { slotIds: lowResolutionSlots },
    );
  }

  layers.sort((left, right) => left.layerOrder - right.layerOrder);
  return {
    width,
    height,
    format: options.format,
    ...(options.format === "image/jpeg"
      ? { jpegQuality: options.jpegQuality ?? template.export.jpegQuality }
      : {}),
    backgroundColor: document.backgroundColor,
    layers,
  };
}
