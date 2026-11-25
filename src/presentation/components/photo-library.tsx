"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhotoGateway, SavedPhoto } from "../../application/photo-gateway";
import { savePhoto } from "../../application/save-photo";
import {
  ACCEPTED_PHOTO_INPUT,
  MAX_BATCH_UPLOAD_COUNT,
  MAX_PHOTO_SIZE_BYTES,
  validatePhotoBatch,
  type PhotoValidationFailure,
} from "../../domain/photos/validate-photo";
import { runUploadQueue } from "../../domain/photos/upload-queue";
import { optimizePhotoForUpload } from "../../infrastructure/client-image-optimizer";
import { photoApiGateway } from "../../infrastructure/photo-api-gateway";
import { BrandHeader } from "./brand-header";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type PhotoLibraryProps = {
  gateway?: PhotoGateway;
};

let photoIdSequence = 0;

function validationMessageForReason(reason: PhotoValidationFailure): string {
  if (reason === "too-large") {
    return "Cada fotografia pode ter até 20 MiB.";
  }
  if (reason === "empty") {
    return "Este arquivo está vazio. Escolha outra fotografia.";
  }
  return "Escolha arquivos JPEG, PNG, WebP ou HEIC.";
}

function formatFileSize(sizeBytes: number): string {
  const sizeInMiB = sizeBytes / (1024 * 1024);
  return sizeInMiB.toFixed(sizeBytes >= 1024 * 1024 ? 1 : 2) + " MiB";
}

export function PhotoLibrary({
  gateway = photoApiGateway,
}: PhotoLibraryProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<PendingPhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingPhotoIds, setSavingPhotoIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const previewUrls = useRef(new Set<string>());

  const revokePreview = useCallback((url: string) => {
    if (!previewUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
  }, []);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      if (gateway.listPhotosPage) {
        const page = await gateway.listPhotosPage({ limit: 50 });
        setSavedPhotos(page.items);
        setNextCursor(page.nextCursor);
      } else {
        const photos = await gateway.listPhotos();
        setSavedPhotos(photos);
        setNextCursor(null);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  async function loadMorePhotos() {
    if (!nextCursor || loadingMore || !gateway.listPhotosPage) return;
    setLoadingMore(true);
    try {
      const page = await gateway.listPhotosPage({ limit: 50, cursor: nextCursor });
      setSavedPhotos((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      setNotice("Não foi possível carregar mais fotografias. Tente novamente.");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    };
  }, []);

  function handleFileSelection(files: FileList | null) {
    if (!files?.length) return;

    const remainingCapacity = Math.max(0, MAX_BATCH_UPLOAD_COUNT - selectedPhotos.length);
    const batch = validatePhotoBatch(Array.from(files), remainingCapacity || 0);
    const validPhotos: PendingPhoto[] = [];
    const rejectedMessages = new Set<string>();

    for (const item of batch.rejected) {
      rejectedMessages.add(validationMessageForReason(item.reason));
    }
    if (batch.truncatedCount > 0) {
      rejectedMessages.add(`Envie até ${MAX_BATCH_UPLOAD_COUNT} fotografias por lote.`);
    }

    batch.accepted.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      photoIdSequence += 1;
      validPhotos.push({
        id: String(photoIdSequence),
        file,
        previewUrl,
      });
    });

    if (validPhotos.length) {
      setSelectedPhotos((current) => [...current, ...validPhotos]);
    }

    if (rejectedMessages.size) {
      setNotice(Array.from(rejectedMessages).join(" "));
    } else if (validPhotos.length) {
      setNotice(null);
    }
  }

  function removeSelectedPhoto(photoId: string) {
    setSelectedPhotos((current) => {
      const photo = current.find((item) => item.id === photoId);
      if (photo) revokePreview(photo.previewUrl);
      return current.filter((item) => item.id !== photoId);
    });
  }

  async function saveSelectedPhotos() {
    if (!selectedPhotos.length || isSaving) return;

    setIsSaving(true);
    setNotice(null);
    const failedPhotos: PendingPhoto[] = [];
    const saved: SavedPhoto[] = [];

    const results = await runUploadQueue(
      selectedPhotos,
      async (photo) => {
        setSavingPhotoIds((current) => new Set(current).add(photo.id));
        try {
          const prepared = await optimizePhotoForUpload(photo.file);
          return await savePhoto(prepared, gateway);
        } finally {
          setSavingPhotoIds((current) => {
            const next = new Set(current);
            next.delete(photo.id);
            return next;
          });
        }
      },
      { concurrency: 3, maxRetries: 0 },
    );

    for (const entry of results) {
      if (entry.status === "fulfilled") {
        saved.push(entry.value);
        revokePreview(entry.item.previewUrl);
      } else {
        failedPhotos.push(entry.item);
      }
    }

    setSavedPhotos((current) => [...saved, ...current]);
    setSelectedPhotos(failedPhotos);
    setSavingPhotoIds(new Set());
    setIsSaving(false);

    if (failedPhotos.length) {
      setNotice(
        "Não foi possível guardar uma ou mais fotografias. Tente novamente.",
      );
    } else {
      setNotice("Fotografias guardadas com segurança.");
    }
  }

  async function deleteSavedPhoto(photo: SavedPhoto) {
    const confirmed = window.confirm(
      "Remover esta fotografia guardada? A ação não pode ser desfeita.",
    );
    if (!confirmed) return;

    try {
      await gateway.deletePhoto(photo.id);
      setSavedPhotos((current) => current.filter((item) => item.id !== photo.id));
      setNotice("Fotografia removida.");
    } catch {
      setNotice("Não foi possível remover a fotografia. Tente novamente.");
    }
  }

  return (
    <main className="memora-shell">
      <BrandHeader activePage="home" />

      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow">Memora</p>
          <h1 id="page-title">seu rolê. suas memórias.</h1>
          <p className="intro-signature">
            Suas histórias merecem ser guardadas.
          </p>
          <p className="intro-description">
            Escolha fotografias do seu dispositivo e guarde uma cópia privada
            para continuar criando seu mural.
          </p>
          <a className="button button-primary hero-cta" href="/criar">
            criar aniversário
          </a>
        </div>
        <figure className="hero-photos">
          <img
            src="/brand/v2/photos/hero/festival-selfie.webp"
            alt="Exemplo sintético: amigos em um festival"
          />
          <img
            src="/brand/v2/photos/murals/summer-beach.webp"
            alt="Exemplo sintético: amigos na praia"
          />
          <img
            src="/brand/v2/photos/murals/birthday-party.webp"
            alt="Exemplo sintético: aniversário com bolo"
          />
        </figure>
      </section>

      <section className="demo-scenes" aria-labelledby="demo-scenes-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Exemplos</p>
            <h2 id="demo-scenes-title">Cenas sintéticas</h2>
          </div>
          <p className="privacy-note">
            Estas imagens não são fotos suas e não entram na biblioteca privada.
          </p>
        </div>
        <ul className="demo-scene-grid">
          {[
            ["/brand/v2/photos/murals/friday-party.webp", "Festa entre amigos"],
            ["/brand/v2/photos/murals/roadtrip-van.webp", "Viagem com van"],
            ["/brand/v2/photos/murals/skate-action.webp", "Manobra de skate"],
            ["/brand/v2/photos/birthday/cake.webp", "Bolo de aniversário"],
            ["/brand/v2/photos/birthday/wish.webp", "Pedido de aniversário"],
            ["/brand/v2/photos/gallery/beach-campfire.webp", "Fogueira na praia"],
            ["/brand/v2/photos/gallery/campus-friends.webp", "Amigos no campus"],
            ["/brand/v2/templates/meu-niver-cover.webp", "Capa de demonstração Meu Niver"],
          ].map(([src, label]) => (
            <li key={src}>
              <img src={src} alt={`Exemplo sintético: ${label}`} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="import-section" aria-labelledby="import-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Comece por aqui</p>
            <h2 id="import-title">Escolha suas fotografias</h2>
          </div>
          <p className="privacy-note">
            Suas imagens ficam neste dispositivo até você escolher guardá-las.
          </p>
        </div>

        <div className="import-panel">
          <div className="import-invitation">
            <span className="upload-ornament" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <div>
              <h3>Traga suas lembranças para perto</h3>
              <p>
                Selecione imagens JPEG ou PNG. Nada será enviado sem sua
                confirmação.
              </p>
            </div>
          </div>
          <div className="import-actions">
            <input
              id="photo-picker"
              className="visually-hidden"
              type="file"
              accept={ACCEPTED_PHOTO_INPUT}
              multiple
              disabled={isSaving}
              onChange={(event) => {
                handleFileSelection(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
            <label className="button button-secondary" htmlFor="photo-picker">
              Escolher fotografias
            </label>
            <span className="format-note">
              JPEG, PNG, WebP ou HEIC · até {formatFileSize(MAX_PHOTO_SIZE_BYTES)} por foto · até {MAX_BATCH_UPLOAD_COUNT} por lote
            </span>
          </div>
        </div>

        {selectedPhotos.length > 0 && (
          <div className="selected-section" aria-labelledby="selected-title">
            <div className="selected-heading">
              <h3 id="selected-title">
                Prévias selecionadas ({selectedPhotos.length})
              </h3>
              <p>Revise antes de guardar.</p>
            </div>
            <div className="photo-grid">
              {selectedPhotos.map((photo) => (
                <article className="photo-card selected-photo" key={photo.id}>
                  <div className="photo-frame">
                    <img src={photo.previewUrl} alt={photo.file.name} />
                    <button
                      className="remove-photo"
                      type="button"
                      aria-label={
                        "Remover " + photo.file.name + " da seleção"
                      }
                      onClick={() => removeSelectedPhoto(photo.id)}
                      disabled={isSaving}
                    >
                      ×
                    </button>
                  </div>
                  <div className="photo-caption">
                    <span className="photo-name">{photo.file.name}</span>
                    <span className="photo-detail">
                      {savingPhotoIds.has(photo.id)
                        ? "Guardando…"
                        : formatFileSize(photo.file.size)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="save-row">
              <p className="save-explanation">
                Você decide quando cada fotografia sai do seu dispositivo.
              </p>
              <button
                className="button button-primary"
                type="button"
                onClick={saveSelectedPhotos}
                disabled={isSaving}
              >
                {isSaving ? "Guardando…" : "Guardar fotografias"}
              </button>
            </div>
          </div>
        )}

        {notice && (
          <p className="notice" role="status" aria-live="polite">
            {notice}
          </p>
        )}
      </section>

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading library-heading">
          <div>
            <p className="eyebrow">Sua coleção privada</p>
            <h2 id="library-title">Fotografias guardadas</h2>
          </div>
          <p className="privacy-note">Visíveis somente neste ambiente local.</p>
        </div>

        {loading ? (
          <p className="library-state" role="status">
            Carregando suas fotografias…
          </p>
        ) : loadError ? (
          <div className="library-state library-error">
            <p>Não conseguimos carregar suas fotografias agora.</p>
            <button
              className="text-button"
              type="button"
              onClick={() => void loadPhotos()}
            >
              Tentar carregar novamente
            </button>
          </div>
        ) : savedPhotos.length === 0 ? (
          <div className="empty-library">
            <p className="empty-title">Seu mural começa com uma fotografia.</p>
            <p>
              As imagens que você guardar aparecerão aqui, prontas para a próxima
              etapa.
            </p>
          </div>
        ) : (
          <>
            <div className="photo-grid saved-grid">
              {savedPhotos.map((photo) => (
                <article className="photo-card" key={photo.id}>
                  <div className="photo-frame">
                    <img
                      src={photo.thumbnailUrl ?? photo.previewUrl}
                      alt="Fotografia guardada"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      className="remove-photo"
                      type="button"
                      aria-label="Remover fotografia guardada"
                      onClick={() => void deleteSavedPhoto(photo)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="photo-caption">
                    <span className="photo-name">Uma lembrança</span>
                    <span className="photo-detail">
                      {formatFileSize(photo.sizeBytes)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {nextCursor && (
              <div className="save-row">
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void loadMorePhotos()}
                >
                  {loadingMore ? "Carregando…" : "Carregar mais fotos"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="page-footer">
        <span>Memora</span>
        <span>Suas histórias merecem ser guardadas.</span>
      </footer>
    </main>
  );
}
