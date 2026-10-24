"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, KeyboardEvent } from "react";
import { assertValidLocalCompositionDraft, removePhotoFromSlot, setPhotoForSlot } from "../../domain/compositions/composition-document";
import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import type { TemplateDefinition } from "../../domain/templates/template-catalog";
import type { PhotoGateway, SavedPhoto } from "../../application/photo-gateway";
import type { LocalCompositionDraftStore } from "../../application/compositions/local-composition-draft-store";
import { assignCompositionPhoto, removeCompositionPhoto } from "../../application/compositions/edit-composition-photo";
import { refreshCompositionPreviews } from "../../application/compositions/restore-composition-draft";
import { localCompositionDraftStore } from "../../infrastructure/local-composition-draft-store";
import { photoApiGateway } from "../../infrastructure/photo-api-gateway";
import { BrandHeader } from "./brand-header";

type EditorLoadState = "loading" | "ready" | "recovery" | "error";
type PhotoLoadState = "idle" | "loading" | "ready" | "error";

export type CompositionEditorProps = {
  draftId: string;
  draftStore?: Pick<LocalCompositionDraftStore, "get" | "save">;
  photoGateway?: Pick<PhotoGateway, "listPhotos">;
  onNavigate?: (href: string) => void;
};

function formatRatio(value: number): string {
  for (const [label, ratio] of [["1:1", 1], ["4:3", 4 / 3], ["2:3", 2 / 3], ["4:5", 4 / 5]] as const) {
    if (Math.abs(value - ratio) <= 1e-9) return label;
  }
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") + ":1";
}

function readyOnly(photos: readonly SavedPhoto[]): SavedPhoto[] {
  return photos.filter((photo) => photo.status === "READY");
}

function previewMapForDraft(
  draft: LocalCompositionDraft,
  photos: readonly SavedPhoto[],
): { previews: Map<string, string>; unavailableSlotIds: string[] } {
  const byId = new Map(readyOnly(photos).map((photo) => [photo.id, photo]));
  const previews = new Map<string, string>();
  const unavailableSlotIds: string[] = [];
  for (const slot of draft.document.slots) {
    if (!slot.assetId) continue;
    const photo = byId.get(slot.assetId);
    if (photo) previews.set(photo.id, photo.previewUrl);
    else unavailableSlotIds.push(slot.slotId);
  }
  return { previews, unavailableSlotIds };
}

export function CompositionEditor({
  draftId,
  draftStore = localCompositionDraftStore,
  photoGateway = photoApiGateway,
  onNavigate,
}: CompositionEditorProps) {
  const [loadState, setLoadState] = useState<EditorLoadState>("loading");
  const [draft, setDraft] = useState<LocalCompositionDraft | null>(null);
  const [template, setTemplate] = useState<TemplateDefinition | null>(null);
  const [previewsByAssetId, setPreviewsByAssetId] = useState<Map<string, string>>(new Map());
  const [unavailableSlotIds, setUnavailableSlotIds] = useState<string[]>([]);
  const [readyPhotos, setReadyPhotos] = useState<SavedPhoto[]>([]);
  const [photoLoadState, setPhotoLoadState] = useState<PhotoLoadState>("idle");
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [expiredAssetIds, setExpiredAssetIds] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");
  const [refreshingPreviews, setRefreshingPreviews] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const firstDialogControl = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const slotButtons = useRef(new Map<string, HTMLButtonElement>());

  const loadDraft = useCallback(async () => {
    setLoadState("loading");
    setStorageError(false);
    try {
      const stored = await draftStore.get(draftId);
      if (!stored) {
        setLoadState("recovery");
        return;
      }
      const definition = TEMPLATE_CATALOG_V1.find(
        (item) =>
          item.templateId === stored.document?.templateId &&
          item.version === stored.document?.templateVersion,
      );
      if (!definition) {
        setLoadState("recovery");
        return;
      }
      try {
        assertValidLocalCompositionDraft(stored, definition);
      } catch {
        setLoadState("recovery");
        return;
      }
      setDraft(stored);
      setTemplate(definition);
      setLoadState("ready");
      setAnnouncement("Rascunho local carregado neste navegador.");

      if (stored.document.slots.some((slot) => slot.assetId)) {
        setPhotoLoadState("loading");
        try {
          const photos = readyOnly(await photoGateway.listPhotos());
          const resolved = previewMapForDraft(stored, photos);
          setReadyPhotos(photos);
          setPreviewsByAssetId(resolved.previews);
          setUnavailableSlotIds(resolved.unavailableSlotIds);
          setPhotoLoadState("ready");
        } catch {
          setPhotoLoadState("error");
          setPhotoError(true);
          setAnnouncement("Não foi possível carregar as fotografias. O rascunho foi mantido.");
        }
      } else {
        setPhotoLoadState("idle");
        setReadyPhotos([]);
        setPhotoError(false);
      }
    } catch {
      setLoadState("error");
    }
  }, [draftId, draftStore, photoGateway]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (!isChooserOpen) {
      restoreFocus.current?.focus();
      restoreFocus.current = null;
      return;
    }
    restoreFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    firstDialogControl.current?.focus();
  }, [isChooserOpen]);

  useEffect(() => {
    if (!isChooserOpen) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsChooserOpen(false);
        setActiveSlotId(null);
      }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>("[data-composition-photo-dialog]");
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], [tabindex='0']",
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isChooserOpen]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasUnsavedChanges]);

  async function loadPhotosForChooser() {
    setPhotoLoadState("loading");
    setPhotoError(false);
    try {
      const photos = readyOnly(await photoGateway.listPhotos());
      setReadyPhotos(photos);
      if (draft) {
        const resolved = previewMapForDraft(draft, photos);
        setPreviewsByAssetId(resolved.previews);
        setUnavailableSlotIds(resolved.unavailableSlotIds);
      }
      setPhotoLoadState("ready");
      setAnnouncement(
        photos.length === 0
          ? "Nenhuma fotografia guardada está disponível."
          : `${photos.length} fotografias guardadas disponíveis.`,
      );
    } catch {
      setPhotoLoadState("error");
      setPhotoError(true);
      setAnnouncement("Não foi possível carregar as fotografias. Tente novamente.");
    }
  }

  function openChooser(slotId: string, trigger: HTMLElement) {
    restoreFocus.current = trigger;
    setActiveSlotId(slotId);
    setIsChooserOpen(true);
    void loadPhotosForChooser();
  }

  async function choosePhoto(photo: SavedPhoto) {
    if (!draft || !activeSlotId || isSaving) return;
    const nextDraft: LocalCompositionDraft = {
      ...draft,
      document: setPhotoForSlot(draft.document, activeSlotId, photo.id),
      updatedAt: new Date().toISOString(),
    };
    setDraft(nextDraft);
    setPreviewsByAssetId((current) => new Map(current).set(photo.id, photo.previewUrl));
    setUnavailableSlotIds((current) => current.filter((slotId) => slotId !== activeSlotId));
    setHasUnsavedChanges(true);
    setIsSaving(true);
    setStorageError(false);
    setIsChooserOpen(false);

    try {
      const saved = await assignCompositionPhoto(draft.id, activeSlotId, photo.id, {
        store: draftStore,
        photos: photoGateway,
        knownReadyPhotos: readyPhotos,
        now: () => new Date(),
        currentDraft: draft,
      });
      setDraft(saved);
      setHasUnsavedChanges(false);
      setAnnouncement("Fotografia adicionada. Rascunho salvo neste navegador.");
    } catch {
      setStorageError(true);
      setAnnouncement("A fotografia foi escolhida, mas a edição não foi salva neste dispositivo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removePhoto(slotId: string) {
    if (!draft || isSaving) return;
    const nextDraft: LocalCompositionDraft = {
      ...draft,
      document: removePhotoFromSlot(draft.document, slotId),
      updatedAt: new Date().toISOString(),
    };
    setDraft(nextDraft);
    setUnavailableSlotIds((current) => current.filter((item) => item !== slotId));
    setHasUnsavedChanges(true);
    setIsSaving(true);
    setStorageError(false);

    try {
      const saved = await removeCompositionPhoto(draft.id, slotId, {
        store: draftStore,
        now: () => new Date(),
        currentDraft: draft,
      });
      setDraft(saved);
      setHasUnsavedChanges(false);
      setAnnouncement("Fotografia removida. Rascunho salvo neste navegador.");
    } catch {
      setStorageError(true);
      setAnnouncement("A fotografia foi removida da prévia, mas a edição não foi salva neste dispositivo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function retrySave() {
    if (!draft || isSaving) return;
    setIsSaving(true);
    setStorageError(false);
    try {
      const saved = await draftStore.save(draft);
      setDraft(saved);
      setHasUnsavedChanges(false);
      setAnnouncement("Rascunho salvo neste navegador.");
    } catch {
      setStorageError(true);
      setAnnouncement("Não foi possível salvar o rascunho neste dispositivo. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateExpiredPreviews() {
    if (!draft || refreshingPreviews) return;
    setRefreshingPreviews(true);
    setRefreshError(false);
    try {
      const refreshed = await refreshCompositionPreviews(draft.document, {
        photos: photoGateway,
      });
      setReadyPhotos(refreshed.readyPhotos);
      setPreviewsByAssetId(refreshed.previewsByAssetId);
      setUnavailableSlotIds(refreshed.unavailableSlotIds);
      setExpiredAssetIds(new Set());
      setPhotoLoadState("ready");
      setAnnouncement("Prévia das fotografias atualizada.");
    } catch {
      setRefreshError(true);
      setAnnouncement("Não foi possível atualizar as prévias. O rascunho continua preservado.");
    } finally {
      setRefreshingPreviews(false);
    }
  }

  function handleInternalNavigation(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;

    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    if (hasUnsavedChanges) {
      const discard = window.confirm(
        "Há alterações que ainda não foram salvas neste navegador. Sair e descartá-las?",
      );
      if (!discard) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (onNavigate) {
      event.preventDefault();
      onNavigate(`${destination.pathname}${destination.search}${destination.hash}`);
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsChooserOpen(false);
      setActiveSlotId(null);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="memora-shell editor-shell" onClickCapture={handleInternalNavigation}>
        <BrandHeader activePage="templates" />
        <main className="composition-state" aria-busy="true">
          <p role="status">Carregando seu rascunho local…</p>
        </main>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="memora-shell editor-shell" onClickCapture={handleInternalNavigation}>
        <BrandHeader activePage="templates" />
        <main className="composition-state">
          <h1>Não foi possível abrir o rascunho</h1>
          <p>O armazenamento local deste navegador não respondeu.</p>
          <button className="button button-secondary" type="button" onClick={() => void loadDraft()}>
            Tentar carregar rascunho novamente
          </button>
          <a className="button button-primary" href="/templates">Voltar aos templates</a>
        </main>
      </div>
    );
  }

  if (loadState === "recovery" || !draft || !template) {
    return (
      <div className="memora-shell editor-shell" onClickCapture={handleInternalNavigation}>
        <BrandHeader activePage="templates" />
        <main className="composition-state" role="alert">
          <p className="eyebrow">Rascunho local</p>
          <h1>Rascunho incompatível</h1>
          <p>
            Este rascunho não pode ser aberto com a versão atual do template. Ele
            continua guardado neste navegador.
          </p>
          <a className="button button-primary" href="/templates">Escolher outro template</a>
        </main>
      </div>
    );
  }

  const canvasStyle = { "--composition-aspect-ratio": template.aspectRatio } as CSSProperties;
  const assetIds = new Set(draft.document.slots.flatMap((slot) => slot.assetId ? [slot.assetId] : []));
  const hasExpiredPreview = [...expiredAssetIds].some((assetId) => assetIds.has(assetId));

  return (
    <div className="memora-shell editor-shell" onClickCapture={handleInternalNavigation}>
      <BrandHeader activePage="templates" />
      <main className="composition-main">
        <div className="composition-topline">
          <a
            className="button button-tertiary"
            href="/templates"
          >
            Voltar aos templates
          </a>
          <p className="local-only-note">Rascunho salvo somente neste navegador</p>
        </div>

        <header className="composition-heading">
          <p className="eyebrow">Composição local</p>
          <h1>{template.name}</h1>
          <p>{template.description}</p>
          <p className="composition-ratio">Proporção {formatRatio(template.aspectRatio)}</p>
        </header>

        <section className="composition-workspace" aria-label="Editor de composição">
          <div className="composition-canvas-wrap">
            <div className="composition-canvas" style={canvasStyle} aria-label={`Prévia ${template.name}`}>
              {template.decorations.map((decoration) => (
                <span
                  key={decoration.decorationId}
                  className={`composition-decoration composition-decoration-${decoration.decorationId}-v${decoration.styleVersion}`}
                  style={{
                    left: `${decoration.x * 100}%`,
                    top: `${decoration.y * 100}%`,
                    width: `${decoration.width * 100}%`,
                    height: `${decoration.height * 100}%`,
                    zIndex: decoration.layerOrder,
                  }}
                  aria-hidden="true"
                />
              ))}
              {template.slots.map((definition, index) => {
                const slot = draft.document.slots[index]!;
                const previewUrl = slot.assetId ? previewsByAssetId.get(slot.assetId) : undefined;
                const unavailable = unavailableSlotIds.includes(slot.slotId);
                return (
                  <div
                    className={`composition-slot${slot.assetId ? " composition-slot-filled" : " composition-slot-empty"}${unavailable ? " composition-slot-unavailable" : ""}`}
                    key={definition.slotId}
                    style={{
                      left: `${definition.x * 100}%`,
                      top: `${definition.y * 100}%`,
                      width: `${definition.width * 100}%`,
                      height: `${definition.height * 100}%`,
                      zIndex: definition.layerOrder,
                    }}
                  >
                    {previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt={`Fotografia no espaço ${index + 1}`}
                          onError={() => {
                            if (slot.assetId) setExpiredAssetIds((current) => new Set(current).add(slot.assetId!));
                          }}
                        />
                        <div className="composition-slot-actions">
                          <button
                            className="composition-slot-action"
                            type="button"
                            aria-label={`Substituir foto no espaço ${index + 1}`}
                            ref={(element) => {
                              if (element) slotButtons.current.set(slot.slotId, element);
                              else slotButtons.current.delete(slot.slotId);
                            }}
                            onClick={(event) => openChooser(slot.slotId, event.currentTarget)}
                          >
                            Substituir
                          </button>
                          <button
                            className="composition-slot-action"
                            type="button"
                            aria-label={`Remover foto do espaço ${index + 1}`}
                            onClick={() => void removePhoto(slot.slotId)}
                            disabled={isSaving}
                          >
                            Remover
                          </button>
                        </div>
                      </>
                    ) : unavailable ? (
                      <div className="composition-slot-copy">
                        <span className="composition-slot-status">Foto indisponível</span>
                        <button
                          className="composition-slot-action"
                          type="button"
                          aria-label={`Substituir foto no espaço ${index + 1}`}
                          onClick={(event) => openChooser(slot.slotId, event.currentTarget)}
                        >
                          Substituir
                        </button>
                        <button
                          className="composition-slot-action"
                          type="button"
                          aria-label={`Remover foto do espaço ${index + 1}`}
                          onClick={() => void removePhoto(slot.slotId)}
                          disabled={isSaving}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        className="composition-slot-placeholder"
                        type="button"
                        aria-label={`Escolher foto para espaço ${index + 1}`}
                        ref={(element) => {
                          if (element) slotButtons.current.set(slot.slotId, element);
                          else slotButtons.current.delete(slot.slotId);
                        }}
                        onClick={(event) => openChooser(slot.slotId, event.currentTarget)}
                      >
                        <span aria-hidden="true" className="composition-slot-plus">+</span>
                        <span>Espaço disponível</span>
                        <span className="composition-slot-choose">Escolher fotografia</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {(hasExpiredPreview || refreshError) && (
              <div className="composition-inline-alert" role={refreshError ? "alert" : undefined}>
                {refreshError && <p>Não foi possível atualizar a prévia.</p>}
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void updateExpiredPreviews()}
                  disabled={refreshingPreviews}
                >
                  {refreshingPreviews ? "Atualizando…" : "Atualizar fotografias"}
                </button>
              </div>
            )}
          </div>

          <aside className="composition-side-panel" aria-label="Estado do rascunho">
            <h2>Seu arranjo</h2>
            <p>{draft.document.slots.filter((slot) => slot.assetId).length} de {draft.document.slots.length} espaços preenchidos</p>
            <p className="composition-private-copy">
              As fotografias continuam privadas na sua biblioteca. Este arranjo
              fica neste navegador e ainda não pode ser exportado ou publicado.
            </p>
            <p className="composition-save-state" role="status" aria-live="polite" aria-atomic="true">
              {isSaving
                ? "Salvando neste navegador…"
                : hasUnsavedChanges
                  ? "Esta alteração ainda não foi salva neste navegador."
                  : announcement || "Rascunho salvo neste navegador."}
            </p>
            {storageError && (
              <div className="composition-inline-alert" role="alert">
                <p>Esta edição não foi salva neste dispositivo.</p>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void retrySave()}
                  disabled={isSaving}
                >
                  Tentar salvar novamente
                </button>
              </div>
            )}
          </aside>
        </section>
      </main>

      <footer className="page-footer">
        <span>Memora</span>
        <span>Suas histórias merecem ser guardadas.</span>
      </footer>

      {isChooserOpen && (
        <div className="composition-dialog-backdrop">
          <div
            className="composition-photo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-dialog-title"
            data-composition-photo-dialog
            onKeyDown={handleDialogKeyDown}
          >
            <div className="composition-dialog-heading">
              <div>
                <p className="eyebrow">Espaço {draft.document.slots.findIndex((slot) => slot.slotId === activeSlotId) + 1}</p>
                <h2 id="photo-dialog-title">Escolher fotografia</h2>
              </div>
              <button
                ref={firstDialogControl}
                className="composition-dialog-close"
                type="button"
                aria-label="Fechar seletor de fotografias"
                onClick={() => {
                  setIsChooserOpen(false);
                  setActiveSlotId(null);
                }}
              >
                ×
              </button>
            </div>

            {photoLoadState === "loading" ? (
              <p role="status" className="composition-selector-state">Carregando fotografias guardadas…</p>
            ) : photoLoadState === "error" || photoError ? (
              <div className="composition-selector-state" role="alert">
                <p>Não foi possível carregar as fotografias guardadas.</p>
                <button className="button button-secondary" type="button" onClick={() => void loadPhotosForChooser()}>
                  Tentar carregar fotografias novamente
                </button>
              </div>
            ) : readyPhotos.length === 0 ? (
              <div className="composition-selector-state composition-selector-empty">
                <p>Nenhuma fotografia guardada.</p>
                <p>Volte à galeria e guarde fotografias para preencher este espaço.</p>
                <a className="button button-secondary" href="/">
                  Voltar à galeria
                </a>
              </div>
            ) : (
              <ul className="composition-photo-choices" aria-label="Fotografias prontas para usar">
                {readyPhotos.map((photo, index) => (
                  <li key={photo.id}>
                    <button
                      className="composition-photo-choice"
                      type="button"
                      aria-label={`Usar fotografia ${index + 1}`}
                      onClick={() => void choosePhoto(photo)}
                      disabled={isSaving}
                    >
                      <img src={photo.previewUrl} alt={`Prévia da fotografia ${index + 1}`} />
                      <span>Usar fotografia {index + 1}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
