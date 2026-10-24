import type { PhotoGateway, SavedPhoto } from "../photo-gateway";
import type { CompositionDocument, LocalCompositionDraft } from "../../domain/compositions/composition-document";
import {
  assertValidLocalCompositionDraft,
  isValidLocalCompositionDraftId,
} from "../../domain/compositions/composition-document";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import type { TemplateDefinition } from "../../domain/templates/template-catalog";
import type { LocalCompositionDraftStore } from "./local-composition-draft-store";

export type RestoredCompositionDraft = LocalCompositionDraft & {
  template: TemplateDefinition;
  previewsByAssetId: Map<string, string>;
  unavailableSlotIds: string[];
};

export type LocalCompositionDraftListing = {
  id: string;
  updatedAt: string | null;
  template: TemplateDefinition | null;
  compatible: boolean;
  templateVersion: number | null;
};

type PhotoListPort = Pick<PhotoGateway, "listPhotos">;

function resolvePhotoPreviews(
  document: CompositionDocument,
  photos: readonly SavedPhoto[],
): Pick<RestoredCompositionDraft, "previewsByAssetId" | "unavailableSlotIds"> {
  const readyPhotos = photos.filter((photo) => photo.status === "READY");
  const photoById = new Map(readyPhotos.map((photo) => [photo.id, photo]));
  const previewsByAssetId = new Map<string, string>();
  const unavailableSlotIds: string[] = [];

  for (const slot of document.slots) {
    if (!slot.assetId) continue;
    const photo = photoById.get(slot.assetId);
    if (photo) previewsByAssetId.set(photo.id, photo.previewUrl);
    else unavailableSlotIds.push(slot.slotId);
  }

  return { previewsByAssetId, unavailableSlotIds };
}

export async function restoreCompositionDraft(
  draftId: string,
  dependencies: {
    store: Pick<LocalCompositionDraftStore, "get">;
    photos: PhotoListPort;
    catalog?: readonly TemplateDefinition[];
  },
): Promise<RestoredCompositionDraft> {
  const draft = await dependencies.store.get(draftId);
  if (!draft) throw new Error("Este rascunho não está disponível neste navegador.");

  const catalog = dependencies.catalog ?? TEMPLATE_CATALOG_V1;
  const template = catalog.find((item) => item.templateId === draft.document.templateId);
  if (!template) throw new Error("O template deste rascunho não está mais disponível.");
  assertValidLocalCompositionDraft(draft, template);

  const photos = draft.document.slots.some((slot) => slot.assetId)
    ? await dependencies.photos.listPhotos()
    : [];
  return {
    ...draft,
    template,
    ...resolvePhotoPreviews(draft.document, photos),
  };
}

export async function refreshCompositionPreviews(
  document: CompositionDocument,
  dependencies: {
    photos: PhotoListPort;
  },
): Promise<{
  document: CompositionDocument;
  previewsByAssetId: Map<string, string>;
  unavailableSlotIds: string[];
  readyPhotos: SavedPhoto[];
}> {
  const readyPhotos = (await dependencies.photos.listPhotos()).filter(
    (photo) => photo.status === "READY",
  );
  return {
    document,
    ...resolvePhotoPreviews(document, readyPhotos),
    readyPhotos,
  };
}

export async function listCompositionDrafts(
  dependencies: {
    store: Pick<LocalCompositionDraftStore, "list">;
    catalog?: readonly TemplateDefinition[];
  },
): Promise<LocalCompositionDraftListing[]> {
  const drafts: unknown[] = await dependencies.store.list();
  const catalog = dependencies.catalog ?? TEMPLATE_CATALOG_V1;
  return drafts
    .flatMap((candidate): LocalCompositionDraftListing[] => {
      if (
        typeof candidate !== "object" ||
        candidate === null ||
        Array.isArray(candidate) ||
        !isValidLocalCompositionDraftId((candidate as { id?: unknown }).id)
      ) {
        return [];
      }

      const record = candidate as Record<string, unknown>;
      const updatedAt =
        typeof record.updatedAt === "string" && Number.isFinite(Date.parse(record.updatedAt))
          ? record.updatedAt
          : null;
      const document =
        typeof record.document === "object" && record.document !== null && !Array.isArray(record.document)
          ? (record.document as Record<string, unknown>)
          : null;
      const templateId = typeof document?.templateId === "string" ? document.templateId : null;
      const templateVersion =
        typeof document?.templateVersion === "number" && Number.isInteger(document.templateVersion)
          ? document.templateVersion
          : null;
      const knownTemplate = catalog.find(
        (item) => item.templateId === templateId && item.version === templateVersion,
      );

      let compatible = false;
      if (knownTemplate) {
        try {
          assertValidLocalCompositionDraft(candidate, knownTemplate);
          compatible = true;
        } catch {
          // Keep the local record discoverable so the editor can show its recovery state.
        }
      }

      return [{
        id: record.id as string,
        updatedAt,
        template: compatible ? knownTemplate! : null,
        compatible,
        templateVersion: compatible ? knownTemplate!.version : templateVersion,
      }];
    })
    .sort((left, right) => {
      const leftDate = left.updatedAt ? Date.parse(left.updatedAt) : Number.NEGATIVE_INFINITY;
      const rightDate = right.updatedAt ? Date.parse(right.updatedAt) : Number.NEGATIVE_INFINITY;
      const updated = rightDate - leftDate;
      return updated || left.id.localeCompare(right.id);
    });
}
