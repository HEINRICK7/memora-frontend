import {
  CompositionExportError,
  type CompositionExportOptions,
} from "../../domain/compositions/composition-export";
import { assertValidLocalCompositionDraft } from "../../domain/compositions/composition-document";
import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import type { PhotoGateway } from "../photo-gateway";
import type {
  CompositionExportProgress,
  CompositionExportRenderer,
} from "./composition-export-renderer";

type ExportCompositionDependencies = Readonly<{
  photoGateway: Pick<PhotoGateway, "listPhotos">;
  renderer: CompositionExportRenderer;
  now?: () => Date;
}>;

function cancelled(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new CompositionExportError("CANCELLED", "Exportação cancelada.");
  }
}

export async function exportComposition(
  draft: LocalCompositionDraft,
  options: CompositionExportOptions,
  dependencies: ExportCompositionDependencies,
  signal: AbortSignal,
  onProgress?: (progress: CompositionExportProgress) => void,
) {
  cancelled(signal);
  onProgress?.({ phase: "PREPARING" });

  const template = TEMPLATE_CATALOG_V1.find(
    (candidate) =>
      candidate.templateId === draft.document?.templateId &&
      candidate.version === draft.document?.templateVersion,
  );
  if (!template) {
    throw new CompositionExportError(
      "INVALID_DRAFT",
      "O rascunho não corresponde a um template disponível.",
    );
  }
  try {
    assertValidLocalCompositionDraft(draft, template);
  } catch {
    throw new CompositionExportError(
      "INVALID_DRAFT",
      "O rascunho local não pode ser exportado nesta versão.",
    );
  }
  if (!template.export.formats.includes(options.format)) {
    throw new CompositionExportError(
      "UNSUPPORTED_FORMAT",
      "Este template não permite o formato selecionado.",
    );
  }
  if (
    options.format === "image/jpeg" && options.jpegQuality !== undefined &&
    (!Number.isFinite(options.jpegQuality) || options.jpegQuality < 0 || options.jpegQuality > 1)
  ) {
    throw new CompositionExportError(
      "INVALID_QUALITY",
      "A qualidade JPEG precisa estar entre 0 e 1.",
    );
  }

  const emptySlotIds = draft.document.slots.filter((slot) => !slot.assetId).map((slot) => slot.slotId);
  if (emptySlotIds.length) {
    throw new CompositionExportError(
      "INCOMPLETE_COMPOSITION",
      "Preencha todos os espaços do template antes de exportar.",
      { slotIds: emptySlotIds },
    );
  }
  cancelled(signal);
  onProgress?.({ phase: "LOADING_PHOTOS" });
  const slotAssetIds = draft.document.slots.map((slot) => slot.assetId);

  let readyPhotos;
  try {
    readyPhotos = await dependencies.photoGateway.listPhotos();
  } catch {
    throw new CompositionExportError(
      "PHOTO_UNAVAILABLE",
      "Não foi possível atualizar as fotografias para exportação.",
      {
        slotIds: draft.document.slots.filter((slot) => slot.assetId).map((slot) => slot.slotId),
        assetIds: [...new Set(slotAssetIds.filter((id): id is string => Boolean(id)))],
      },
    );
  }
  cancelled(signal);

  const now = (dependencies.now ?? (() => new Date()))().getTime();
  const photosById = new Map(readyPhotos.map((photo) => [photo.id, photo]));
  const photoSources = new Map<string, {
    assetId: string;
    previewUrl: string;
    previewExpiresAt: string;
  }>();
  for (const slot of draft.document.slots) {
    const assetId = slot.assetId!;
    const photo = photosById.get(assetId);
    const expiry = photo ? Date.parse(photo.previewExpiresAt) : Number.NaN;
    const slotIds = draft.document.slots
      .filter((candidate) => candidate.assetId === assetId)
      .map((candidate) => candidate.slotId);
    if (!photo || photo.status !== "READY" || !Number.isFinite(expiry) || !photo.previewUrl) {
      throw new CompositionExportError(
        "PHOTO_UNAVAILABLE",
        "Uma fotografia não está mais disponível.",
        { slotIds, assetIds: [assetId] },
      );
    }
    if (expiry <= now) {
      throw new CompositionExportError(
        "PHOTO_PREVIEW_EXPIRED",
        "O link temporário de uma fotografia expirou.",
        { slotIds, assetIds: [assetId] },
      );
    }
    photoSources.set(assetId, {
      assetId,
      previewUrl: photo.previewUrl,
      previewExpiresAt: photo.previewExpiresAt,
    });
  }

  cancelled(signal);
  const result = await dependencies.renderer.render({
    document: draft.document,
    template,
    photos: photoSources,
    options,
    signal,
    onProgress,
  });
  cancelled(signal);
  return result;
}
