"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MuralAccessGateway, MuralPhotoItem, MuralSummary } from "../../application/mural-gateway";
import { MuralGatewayError } from "../../application/mural-gateway";
import type { SavedPhoto } from "../../application/photo-gateway";
import { savePhoto } from "../../application/save-photo";
import {
  countUnicodeCodePoints,
  normalizeMuralDraftInput,
  validateMuralDraftInput,
} from "../../domain/murals/mural-draft-input";
import {
  ACCEPTED_PHOTO_INPUT,
  MAX_BATCH_UPLOAD_COUNT,
  validatePhotoBatch,
} from "../../domain/photos/validate-photo";
import { runUploadQueue } from "../../domain/photos/upload-queue";
import { optimizePhotoForUpload } from "../../infrastructure/client-image-optimizer";
import { photoApiGateway } from "../../infrastructure/photo-api-gateway";
import { muralApiGateway } from "../../infrastructure/mural-api-gateway";
import { createUuid } from "../../infrastructure/uuid";
import { BrandHeader } from "./brand-header";

const TITLE_LIMIT = 100;
const loadPhotoLibrary = () => photoApiGateway.listPhotos();

type MuralStudioProps = {
  muralId: string;
  gateway?: MuralAccessGateway;
  loadLibrary?: () => Promise<SavedPhoto[]>;
};

export function MuralStudio({
  muralId,
  gateway = muralApiGateway,
  loadLibrary = loadPhotoLibrary,
}: MuralStudioProps) {
  const titleId = useId();
  const descriptionId = useId();
  const titleErrorId = useId();
  const titleCountId = useId();
  const dialogTitleId = useId();
  const publishButtonRef = useRef<HTMLButtonElement>(null);
  const cancelDialogRef = useRef<HTMLButtonElement>(null);
  const [mural, setMural] = useState<MuralSummary | null>(null);
  const [photos, setPhotos] = useState<MuralPhotoItem[]>([]);
  const [library, setLibrary] = useState<SavedPhoto[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [publishKey, setPublishKey] = useState(createUuid);
  const [busy, setBusy] = useState(false);
  const formReady = useRef(false);

  const reload = useCallback(async () => {
    const [nextMural, nextPhotos, nextLibrary] = await Promise.all([
      gateway.getMural(muralId),
      gateway.listMuralPhotos(muralId),
      loadLibrary(),
    ]);
    setMural(nextMural);
    setPhotos(nextPhotos.items);
    setLibrary(nextLibrary);
    if (!formReady.current) {
      setTitle(nextMural.title);
      setDescription(nextMural.description ?? "");
      formReady.current = true;
    }
    return nextMural;
  }, [gateway, loadLibrary, muralId]);

  useEffect(() => {
    let active = true;
    reload().catch(() => {
      if (active) setError("Não foi possível abrir este mural.");
    });
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    if (!confirming) return;
    cancelDialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirming(false);
        publishButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector(".publish-dialog");
      if (!(dialog instanceof HTMLElement)) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirming]);

  async function movePhoto(index: number, delta: number) {
    const target = index + delta;
    if (!mural || target < 0 || target >= photos.length) return;
    const next = photos.slice();
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    await run(async () => {
      const version = await gateway.reorderPhotos(
        muralId,
        next.map((photo) => photo.photoId),
        mural.version,
      );
      setMural({ ...mural, version });
      await reload();
    });
  }

  async function uploadAndAttachPhotos(files: FileList | null) {
    if (!mural || !editable || busy || !files?.length) return;

    const batch = validatePhotoBatch(Array.from(files), MAX_BATCH_UPLOAD_COUNT);
    const rejectedCount = batch.rejected.length + batch.truncatedCount;
    if (!batch.accepted.length) {
      setError(`Escolha até ${MAX_BATCH_UPLOAD_COUNT} fotos JPEG, PNG, WebP ou HEIC com até 20 MiB cada.`);
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    let version = mural.version;
    let attachedCount = 0;
    let failedCount = 0;

    // Upload files concurrently (3 in parallel) with client-side optimization,
    // then attach sequentially so If-Match ETag versions stay strictly ordered.
    const uploaded = await runUploadQueue(
      batch.accepted,
      async (file) => {
        const prepared = await optimizePhotoForUpload(file);
        return savePhoto(prepared, photoApiGateway);
      },
      { concurrency: 3, maxRetries: 0 },
    );

    for (const entry of uploaded) {
      if (entry.status !== "fulfilled") {
        failedCount += 1;
        continue;
      }
      try {
        version = await gateway.attachPhoto(muralId, entry.value.id, version);
        attachedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    await reload().catch(() => {
      setError("As fotos foram enviadas, mas não foi possível atualizar a festa.");
    });
    const notAddedCount = failedCount + rejectedCount;
    if (notAddedCount > 0) {
      setError(
        `${attachedCount} ${attachedCount === 1 ? "foto adicionada" : "fotos adicionadas"}. ${notAddedCount} ${notAddedCount === 1 ? "arquivo não entrou" : "arquivos não entraram"}; confira formato, tamanho e limite de ${MAX_BATCH_UPLOAD_COUNT} por lote.`,
      );
    } else if (attachedCount > 0) {
      setMessage(`${attachedCount} ${attachedCount === 1 ? "foto adicionada" : "fotos adicionadas"} à festa.`);
    }
    setBusy(false);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (caught) {
      if (caught instanceof MuralGatewayError && caught.status === 409) {
        setError("O mural mudou. Atualizei os dados para você decidir de novo.");
        await reload().catch(() => undefined);
      } else {
        setError("Não foi possível concluir esta ação.");
      }
    } finally {
      setBusy(false);
    }
  }

  function closeConfirmation() {
    setConfirming(false);
    publishButtonRef.current?.focus();
  }

  async function saveMetadata() {
    if (!mural) return;
    const errors = validateMuralDraftInput({ title, description });
    if (errors.title || errors.description) {
      setFieldError(
        errors.title === "required"
          ? "Dê um nome ao mural antes de salvar."
          : "O texto passa do limite do contrato.",
      );
      return;
    }
    setFieldError(null);
    const normalized = normalizeMuralDraftInput({ title, description });
    const patch: { title?: string; description?: string | null } = {};
    if (normalized.title !== mural.title) patch.title = normalized.title;
    const currentDescription = mural.description ?? null;
    if (normalized.description !== currentDescription) patch.description = normalized.description;
    if (Object.keys(patch).length === 0) {
      setMessage("Nada mudou nos metadados.");
      return;
    }
    const updated = await gateway.updateMural(muralId, mural.version, patch);
    setMural(updated);
    setTitle(updated.title);
    setDescription(updated.description ?? "");
    setMessage("Metadados salvos.");
  }

  async function confirmPublish() {
    if (!mural) return;
    const errors = validateMuralDraftInput({ title, description });
    if (errors.title || errors.description) return;
    const normalized = normalizeMuralDraftInput({ title, description });
    let version = mural.version;
    const patch: { title?: string; description?: string | null } = {};
    if (normalized.title !== mural.title) patch.title = normalized.title;
    if (normalized.description !== (mural.description ?? null)) patch.description = normalized.description;
    if (Object.keys(patch).length > 0) {
      const updated = await gateway.updateMural(muralId, mural.version, patch);
      version = updated.version;
      setMural(updated);
      setTitle(updated.title);
      setDescription(updated.description ?? "");
    }
    const published = await gateway.publishMural(muralId, version, publishKey);
    setMural(published);
    setPublishKey(createUuid());
    setConfirming(false);
    if (published.status === "PUBLISHED") {
      window.location.assign(`/murais/${muralId}/compartilhar?gerarQr=1`);
    } else {
      setError("A publicação não foi confirmada pelo servidor.");
    }
  }

  if (!mural) {
    return (
      <main className="memora-shell">
        <BrandHeader activePage="murals" />
        <p role="status">{error ?? "Abrindo mural…"}</p>
      </main>
    );
  }

  const editable = mural.status === "DRAFT";
  const attached = new Set(photos.map((photo) => photo.photoId));
  const titleLength = countUnicodeCodePoints(title);
  const cover = photos.find((photo) => photo.photoId === mural.coverPhotoId) ?? photos[0];
  return (
    <main className="memora-shell publish-screen">
      <BrandHeader activePage="murals" />
      <div className="publish-toolbar">
        <a className="button button-secondary" href="/meus-murais">
          Voltar
        </a>
        <a className="button button-secondary" href="/meus-murais">
          Cancelar
        </a>
      </div>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <div className="publish-layout">
        <section className="publish-preview" aria-label="Prévia da capa">
          {cover ? (
            <img src={cover.previewUrl} alt="" />
          ) : (
            <p>Nenhuma fotografia associada.</p>
          )}
          <p className="publish-preview-title">{title.trim() || "sem nome"}</p>
          {photos.length > 1 && (
            <ul className="publish-preview-strip">
              {photos.slice(0, 4).map((photo) => (
                <li key={photo.photoId}>
                  <img src={photo.thumbnailUrl ?? photo.previewUrl} alt="" loading="lazy" decoding="async" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="publish-panel" aria-label="Publicação do mural">
          <p className="eyebrow">
            <span className="publish-kicker-mobile">quase lá</span>
            <span className="publish-kicker-desktop">publicar</span>
          </p>
          <h1>
            <span className="publish-kicker-mobile">bora dar um nome?</span>
            <span className="publish-kicker-desktop">pronto pra compartilhar?</span>
          </h1>

          <form
            className="mural-studio-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editable) return;
              void run(saveMetadata);
            }}
          >
            <label htmlFor={titleId}>nome do mural</label>
            <input
              id={titleId}
              value={title}
              disabled={!editable || busy}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={`${titleCountId} ${titleErrorId}`}
              onChange={(event) => setTitle(event.target.value)}
            />
            <p id={titleCountId} className="publish-count">
              {titleLength}/{TITLE_LIMIT}
            </p>
            <p id={titleErrorId} role={fieldError ? "alert" : undefined}>
              {fieldError ?? ""}
            </p>

            <label htmlFor={descriptionId}>descrição</label>
            <textarea
              id={descriptionId}
              value={description}
              disabled={!editable || busy}
              onChange={(event) => setDescription(event.target.value)}
            />

            <section aria-labelledby="birthday-qr-title">
              <p className="eyebrow">Modo Aniversário</p>
              <h2 id="birthday-qr-title">QR para os convidados</h2>
              <p>
                Depois de publicar, gere o QR para a galera abrir a festa e começar
                um álbum pessoal. Cada convidado escolhe quais fotos compartilhar com todos.
              </p>
              {mural.status === "PUBLISHED" ? (
                <a className="button button-primary" href={`/murais/${muralId}/compartilhar`}>
                  Gerar QR do Modo Niver
                </a>
              ) : editable ? (
                <div>
                  <p>Se quiser, adicione uma foto agora. Você também pode publicar a festa vazia; os convidados criam seus álbuns pelo QR.</p>
                  <input
                    id="birthday-photo-picker"
                    className="visually-hidden"
                    type="file"
                    accept={ACCEPTED_PHOTO_INPUT}
                    multiple
                    disabled={busy}
                    onChange={(event) => {
                      void uploadAndAttachPhotos(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <label className="button button-secondary" htmlFor="birthday-photo-picker">
                    {busy ? "Adicionando fotos…" : "Adicionar fotos do celular"}
                  </label>
                  <p>O QR fica disponível assim que você publicar a festa.</p>
                </div>
              ) : (
                <p>Esta festa está arquivada e não pode receber novas contribuições.</p>
              )}
            </section>

            {editable && (
              <button className="button button-secondary" type="submit" disabled={busy}>
                salvar mudanças
              </button>
            )}
          </form>

          {editable && (
            <button
              ref={publishButtonRef}
              className="button button-primary publish-cta"
              type="button"
              disabled={busy || titleLength === 0 || titleLength > TITLE_LIMIT}
              onClick={() => {
                const errors = validateMuralDraftInput({ title, description });
                if (errors.title || errors.description) {
                  setFieldError(
                    errors.title === "required"
                      ? "Dê um nome ao mural antes de publicar."
                      : "O texto passa do limite do contrato.",
                  );
                  return;
                }
                setFieldError(null);
                setConfirming(true);
              }}
            >
              Publicar festa e gerar QR
            </button>
          )}

        </section>
      </div>

      <section aria-label="Fotografias do mural">
        <h2>Fotografias</h2>
        {photos.length === 0 ? <p>Nenhuma fotografia associada.</p> : null}
        <ul className="mural-photo-grid">
          {photos.map((photo, index) => (
            <li key={photo.photoId}>
              <img src={photo.thumbnailUrl ?? photo.previewUrl} alt="" loading="lazy" decoding="async" />
              {mural.coverPhotoId === photo.photoId && <span>Capa</span>}
              {editable && (
                <>
                  {photos.length > 1 && (
                    <>
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={busy || index === 0}
                        onClick={() => void movePhoto(index, -1)}
                      >
                        Subir
                      </button>
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={busy || index === photos.length - 1}
                        onClick={() => void movePhoto(index, 1)}
                      >
                        Descer
                      </button>
                    </>
                  )}
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const updated = await gateway.updateMural(muralId, mural.version, {
                          coverPhotoId: photo.photoId,
                        });
                        setMural(updated);
                      })
                    }
                  >
                    Usar como capa
                  </button>
                  {mural.coverPhotoId === photo.photoId && (
                    <button
                      className="button button-secondary"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const updated = await gateway.updateMural(muralId, mural.version, {
                            coverPhotoId: null,
                          });
                          setMural(updated);
                        })
                      }
                    >
                      Tirar a capa
                    </button>
                  )}
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const version = await gateway.removePhoto(muralId, photo.photoId, mural.version);
                        setMural({ ...mural, version });
                        await reload();
                      })
                    }
                  >
                    Remover
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      {editable && (
        <section aria-label="Biblioteca privada">
          <h2>Da biblioteca</h2>
          <ul className="mural-photo-grid">
            {library
              .filter((photo) => !attached.has(photo.id))
              .map((photo) => (
                <li key={photo.id}>
                  <img src={photo.thumbnailUrl ?? photo.previewUrl} alt="" loading="lazy" decoding="async" />
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const version = await gateway.attachPhoto(muralId, photo.id, mural.version);
                        setMural({ ...mural, version });
                        await reload();
                      })
                    }
                  >
                    Associar
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}

      {confirming && (
        <div className="publish-dialog-backdrop">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="publish-dialog"
          >
            <h2 id={dialogTitleId}>confirmar publicação</h2>
            <p>
              O nome fica “{normalizeMuralDraftInput({ title, description }).title}”.
            </p>
            <p>
              {photos.length} {photos.length === 1 ? "fotografia" : "fotografias"}.
              {cover ? " A capa mostrada é uma fotografia do mural." : ""} Depois de publicar, o QR do Modo Niver será gerado.
            </p>
            <div className="publish-dialog-actions">
              <button
                ref={cancelDialogRef}
                className="button button-secondary"
                type="button"
                onClick={closeConfirmation}
              >
                Cancelar publicação
              </button>
              <button
                className="button button-primary"
                type="button"
                disabled={busy}
                onClick={() => void run(confirmPublish)}
              >
                Publicar e gerar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
