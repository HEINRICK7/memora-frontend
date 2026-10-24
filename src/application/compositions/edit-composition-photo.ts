import type { PhotoGateway, SavedPhoto } from "../photo-gateway";
import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";
import { assertValidLocalCompositionDraft, removePhotoFromSlot, setPhotoForSlot } from "../../domain/compositions/composition-document";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import type { LocalCompositionDraftStore } from "./local-composition-draft-store";

type EditPhotoDependencies = {
  store: Pick<LocalCompositionDraftStore, "get" | "save">;
  photos?: Pick<PhotoGateway, "listPhotos">;
  knownReadyPhotos?: readonly SavedPhoto[];
  now: () => Date;
  currentDraft?: LocalCompositionDraft;
};

async function loadDraft(
  draftId: string,
  dependencies: EditPhotoDependencies,
): Promise<LocalCompositionDraft> {
  const draft = dependencies.currentDraft ?? (await dependencies.store.get(draftId));
  if (!draft) throw new Error("Este rascunho não está disponível neste navegador.");
  const template = TEMPLATE_CATALOG_V1.find(
    (item) => item.templateId === draft.document.templateId,
  );
  if (!template) throw new Error("A versão deste template não está disponível.");
  assertValidLocalCompositionDraft(draft, template);
  return draft;
}

function withUpdatedDocument(
  draft: LocalCompositionDraft,
  document: LocalCompositionDraft["document"],
  now: () => Date,
): LocalCompositionDraft {
  return {
    ...draft,
    document,
    updatedAt: now().toISOString(),
  };
}

export async function assignCompositionPhoto(
  draftId: string,
  slotId: string,
  assetId: string,
  dependencies: EditPhotoDependencies,
): Promise<LocalCompositionDraft> {
  const draft = await loadDraft(draftId, dependencies);
  const readyPhotos = dependencies.knownReadyPhotos ?? (await dependencies.photos?.listPhotos());
  if (!readyPhotos?.some((photo) => photo.status === "READY" && photo.id === assetId)) {
    throw new Error("Esta fotografia não está disponível para a composição.");
  }

  const updated = withUpdatedDocument(
    draft,
    setPhotoForSlot(draft.document, slotId, assetId),
    dependencies.now,
  );
  return dependencies.store.save(updated);
}

export async function removeCompositionPhoto(
  draftId: string,
  slotId: string,
  dependencies: EditPhotoDependencies,
): Promise<LocalCompositionDraft> {
  const draft = await loadDraft(draftId, dependencies);
  const updated = withUpdatedDocument(
    draft,
    removePhotoFromSlot(draft.document, slotId),
    dependencies.now,
  );
  return dependencies.store.save(updated);
}
