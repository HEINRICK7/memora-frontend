"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent,
} from "react";
import type { MuralAccessGateway, SharedMural } from "../../application/mural-gateway";
import { MuralGatewayError } from "../../application/mural-gateway";
import {
  ACCEPTED_PHOTO_INPUT,
  MAX_BATCH_UPLOAD_COUNT,
  validatePhotoBatch,
} from "../../domain/photos/validate-photo";
import { runUploadQueue } from "../../domain/photos/upload-queue";
import {
  MOMENT_TEMPLATE_OPTIONS,
  chunkPhotosForTemplate,
  findMomentTemplateOption,
  type MomentTemplateOption,
} from "../../domain/templates/moment-template-layout";
import { optimizePhotoForUpload } from "../../infrastructure/client-image-optimizer";
import { muralApiGateway } from "../../infrastructure/mural-api-gateway";
import {
  sharedLinkMessage,
  sharedLinkState,
  type SharedLinkState,
} from "../../domain/sharing/shared-link-state";
import styles from "./shared-mural-view.module.css";

type SharedMuralViewProps = {
  shareToken: string;
  loadShared?: (
    shareToken: string,
    query?: { limit?: number; offset?: number },
    guestToken?: string | null,
  ) => Promise<SharedMural>;
  gateway?: Partial<
    Pick<MuralAccessGateway, "submitContribution" | "deleteGuestPhoto">
  >;
};

type PageProblem = SharedLinkState | "TEMPORARY_FAILURE";

type PendingGuestPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

const HOME_HERO_IMAGE_SRC = "/brand/v2/photos/hero/festival-selfie.webp";
const GUEST_NAME_STORAGE_KEY = "memora:guest-name";
let pendingPhotoSequence = 0;

function defaultLoadShared(
  token: string,
  query?: { limit?: number; offset?: number },
  guestToken?: string | null,
) {
  return muralApiGateway.getSharedMural(token, query, guestToken);
}

function SunDoodle() {
  return (
    <svg className={styles.sunDoodle} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="31" cy="32" r="12" />
      <path d="M31 4v10m0 36v10M3 32h10m36 0h10M11 12l7 7m26 26 7 7m0-40-7 7m-26 26-7 7" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7.5h3l1.4-2h7.2l1.4 2h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-4.5-4.5L7 20" />
    </svg>
  );
}

function TemplateMiniIcon({ option }: { option: MomentTemplateOption }) {
  if (!option.template) {
    return (
      <svg className={styles.templateIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="11" height="11" rx="2" />
        <rect x="15" y="2" width="7" height="6" rx="1.5" />
        <rect x="15" y="10" width="7" height="12" rx="1.5" />
        <rect x="2" y="15" width="11" height="7" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg className={styles.templateIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {option.template.slots.map((slot) => (
        <rect
          key={slot.slotId}
          x={2 + slot.x * 20 + 0.6}
          y={2 + slot.y * 20 + 0.6}
          width={Math.max(2, slot.width * 20 - 1.2)}
          height={Math.max(2, slot.height * 20 - 1.2)}
          rx="1.2"
        />
      ))}
    </svg>
  );
}

function isTemporaryFailure(error: unknown): boolean {
  return !(error instanceof MuralGatewayError) || error.status >= 500;
}

function generateGuestToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing can disable localStorage; session continues in memory.
  }
}

function authorInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "M";
}

function uniqueFrameAuthors(
  slots: readonly { photo: { authorName?: string | null } | null }[],
): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of slots) {
    const raw = item.photo?.authorName?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(raw);
  }
  return names;
}

export function SharedMuralView({
  shareToken,
  loadShared = defaultLoadShared,
  gateway = muralApiGateway,
}: SharedMuralViewProps) {
  const guestStorageKey = `memora:guest-album:${shareToken}`;
  const templateStorageKey = `memora:moment-template:${shareToken}`;
  const [view, setView] = useState<SharedMural | null>(null);
  const [problem, setProblem] = useState<PageProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("mural");
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [pendingPhotos, setPendingPhotos] = useState<PendingGuestPhoto[]>([]);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ text: string; showCameraShortcut?: boolean } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const [sessionOwnedIds, setSessionOwnedIds] = useState<Set<string>>(() => new Set());

  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const previewUrlsRef = useRef(new Set<string>());

  const revokePreview = useCallback((url: string) => {
    if (!previewUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  }, []);

  const clearPendingPhotos = useCallback(() => {
    setPendingPhotos((current) => {
      current.forEach((item) => revokePreview(item.previewUrl));
      return [];
    });
    setSheetError(null);
  }, [revokePreview]);

  useEffect(() => {
    const savedToken = readStoredValue(guestStorageKey);
    const savedName = readStoredValue(GUEST_NAME_STORAGE_KEY);
    const savedTemplate = readStoredValue(templateStorageKey);
    setGuestToken(savedToken);
    setGuestName(savedName ?? "");
    setSelectedTemplateId(findMomentTemplateOption(savedTemplate ?? "mural").id);
    setBanner(null);
    setSheetError(null);
    setSessionOwnedIds(new Set());
  }, [guestStorageKey, templateStorageKey]);

  const load = useCallback(
    async (explicitToken?: string | null) => {
      const tokenForRequest =
        explicitToken !== undefined ? explicitToken : readStoredValue(guestStorageKey);
      try {
        const result = await loadShared(shareToken, undefined, tokenForRequest);
        if (!mountedRef.current) return;
        if (!result.permissions.canView) {
          setView(null);
          setProblem("LINK_INVALID");
          setLoading(false);
          return;
        }
        setView(result);
        setFailedPhotos(new Set());
        setProblem(null);
      } catch (error) {
        if (!mountedRef.current) return;
        setView(null);
        setProblem(
          isTemporaryFailure(error)
            ? "TEMPORARY_FAILURE"
            : sharedLinkState((error as MuralGatewayError).status, (error as MuralGatewayError).code),
        );
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [guestStorageKey, loadShared, shareToken],
  );

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, [load]);

  useEffect(() => {
    function onScroll() {
      setHeaderCompact(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!view) return;
    const soonest = view.mural.photos
      .map((photo) => Date.parse(photo.previewExpiresAt))
      .concat(view.mural.logoExpiresAt ? Date.parse(view.mural.logoExpiresAt) : [])
      .filter(Number.isFinite)
      .sort((left, right) => left - right)[0];
    if (soonest === undefined) return;
    const delay = Math.max(15_000, soonest - Date.now() - 10_000);
    const timer = window.setTimeout(() => {
      void load(guestToken);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [guestToken, load, view]);

  const photos = view?.mural.photos ?? [];
  const activePhoto = openIndex === null ? null : photos[openIndex] ?? null;
  const activeTemplateOption = useMemo(
    () => findMomentTemplateOption(selectedTemplateId),
    [selectedTemplateId],
  );
  const templateFrames = useMemo(
    () =>
      activeTemplateOption.template
        ? chunkPhotosForTemplate(photos, activeTemplateOption.template)
        : [],
    [activeTemplateOption, photos],
  );

  useEffect(() => {
    setConfirmingDeleteId(null);
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) {
      if (openerRef.current?.isConnected) openerRef.current.focus();
      return;
    }

    const dialog = dialogRef.current;
    const closeButton = dialog?.querySelector<HTMLButtonElement>("[data-lightbox-close]");
    closeButton?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setOpenIndex((index) => (index === null || photos.length === 0 ? index : (index + 1) % photos.length));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setOpenIndex((index) =>
          index === null || photos.length === 0 ? index : (index - 1 + photos.length) % photos.length,
        );
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, photos.length]);

  function openLightbox(index: number, event: ReactMouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setOpenIndex(index);
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    writeStoredValue(templateStorageKey, templateId);
  }

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = input.files;
    if (!files || files.length === 0) return;

    const remainingCapacity = Math.max(0, MAX_BATCH_UPLOAD_COUNT - pendingPhotos.length);
    const batch = validatePhotoBatch(Array.from(files), remainingCapacity);
    const nextPending: PendingGuestPhoto[] = batch.accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      pendingPhotoSequence += 1;
      return { id: String(pendingPhotoSequence), file, previewUrl };
    });

    const warnings: string[] = [];
    if (batch.rejected.length > 0) {
      warnings.push("Escolha fotos JPEG, PNG, WebP ou HEIC de até 20 MiB.");
    }
    if (batch.truncatedCount > 0) {
      warnings.push(`Você pode enviar até ${MAX_BATCH_UPLOAD_COUNT} fotos por vez.`);
    }

    if (nextPending.length > 0) {
      setPendingPhotos((current) => [...current, ...nextPending]);
      setSheetError(warnings.length > 0 ? warnings.join(" ") : null);
      setBanner(null);
    } else if (warnings.length > 0) {
      setBanner({ text: warnings.join(" ") });
    }

    input.value = "";
  }

  function removePendingPhoto(photoId: string) {
    setPendingPhotos((current) => {
      const target = current.find((item) => item.id === photoId);
      if (target) revokePreview(target.previewUrl);
      return current.filter((item) => item.id !== photoId);
    });
  }

  function ensureSilentGuestToken(): string {
    const existing = guestToken || readStoredValue(guestStorageKey);
    if (existing) {
      if (existing !== guestToken) setGuestToken(existing);
      return existing;
    }
    const created = generateGuestToken();
    setGuestToken(created);
    writeStoredValue(guestStorageKey, created);
    return created;
  }

  async function publishPendingPhotos() {
    if (!pendingPhotos.length || submittingRef.current || !gateway.submitContribution) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSheetError(null);

    const token = ensureSilentGuestToken();
    const displayName = guestName.trim() || null;
    if (displayName) {
      writeStoredValue(GUEST_NAME_STORAGE_KEY, displayName);
    }

    const itemsToSend = pendingPhotos.slice();
    const succeeded: PendingGuestPhoto[] = [];
    const failed: PendingGuestPhoto[] = [];
    const newOwnedPhotoIds: string[] = [];

    try {
      setUploadProgress(`Enviando 0 de ${itemsToSend.length}…`);
      const results = await runUploadQueue(
        itemsToSend,
        async (item) => {
          const prepared = await optimizePhotoForUpload(item.file);
          return gateway.submitContribution!(shareToken, prepared, displayName, token);
        },
        {
          concurrency: 3,
          maxRetries: 1,
          onProgress: (completed, total) => {
            setUploadProgress(`Enviando ${completed} de ${total}…`);
          },
        },
      );

      for (const entry of results) {
        if (
          entry.status === "fulfilled"
          && (entry.value.status === "PUBLISHED"
            || entry.value.status === "APPROVED"
            || entry.value.status === "READY")
        ) {
          succeeded.push(entry.item);
          if (entry.value.photoId) {
            newOwnedPhotoIds.push(entry.value.photoId);
          }
          revokePreview(entry.item.previewUrl);
        } else {
          failed.push(entry.item);
        }
      }

      if (newOwnedPhotoIds.length > 0) {
        setSessionOwnedIds((current) => {
          const next = new Set(current);
          newOwnedPhotoIds.forEach((id) => next.add(id));
          return next;
        });
      }

      setPendingPhotos(failed);

      if (succeeded.length > 0) {
        await load(token);
      }

      if (failed.length > 0) {
        setSheetError(
          succeeded.length > 0
            ? `${succeeded.length} foto(s) publicada(s). ${failed.length} não entrou — toque em enviar para tentar de novo.`
            : "Não foi possível enviar agora. Toque em enviar para tentar de novo.",
        );
      } else {
        setBanner({
          text:
            succeeded.length === 1
              ? "Foto no álbum da festa!"
              : `${succeeded.length} fotos no álbum da festa!`,
          showCameraShortcut: true,
        });
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  async function handleDeleteOwnPhoto(photoId: string) {
    const token = guestToken || readStoredValue(guestStorageKey);
    if (!token || !gateway.deleteGuestPhoto || isDeleting) return;

    setIsDeleting(true);
    try {
      await gateway.deleteGuestPhoto(shareToken, photoId, token);
      setConfirmingDeleteId(null);
      setOpenIndex(null);
      setView((current) => {
        if (!current) return current;
        const remaining = current.mural.photos.filter((item) => item.photoId !== photoId);
        return {
          ...current,
          mural: {
            ...current.mural,
            photos: remaining,
            totalPhotos:
              current.mural.totalPhotos !== undefined
                ? Math.max(0, current.mural.totalPhotos - 1)
                : remaining.length,
          },
        };
      });
      setBanner({ text: "Sua foto foi removida da festa." });
    } catch {
      setBanner({ text: "Não foi possível apagar essa foto agora. Tente novamente." });
      setConfirmingDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function loadMoreSharedPhotos() {
    const nextOffset = view?.mural.nextOffset;
    if (nextOffset == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const token = guestToken || readStoredValue(guestStorageKey);
      const page = await loadShared(shareToken, { offset: nextOffset }, token);
      if (!mountedRef.current) return;
      setView((current) => {
        if (!current) return page;
        const existingIds = new Set(current.mural.photos.map((item) => item.photoId));
        const appended = page.mural.photos.filter((item) => !existingIds.has(item.photoId));
        return {
          ...page,
          mural: {
            ...page.mural,
            photos: [...current.mural.photos, ...appended],
          },
        };
      });
    } catch {
      setBanner({ text: "Não foi possível carregar mais fotos agora. Tente novamente." });
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }

  function markPreviewUnavailable(photoId: string) {
    setFailedPhotos((current) => new Set(current).add(photoId));
  }

  function movePhoto(delta: number) {
    setOpenIndex((index) =>
      index === null || photos.length === 0 ? index : (index + delta + photos.length) % photos.length,
    );
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined) return;
    const distance = end - start;
    if (Math.abs(distance) < 48) return;
    movePhoto(distance < 0 ? 1 : -1);
  }

  if (problem || loading || !view) {
    const message =
      problem === "TEMPORARY_FAILURE"
        ? "Não foi possível carregar este mural agora. Tente novamente."
        : problem
          ? sharedLinkMessage(problem)
          : "Abrindo mural…";
    return (
      <main className={styles.page}>
        <div className={styles.stateShell}>
          <Link className={styles.stateBrand} href="/" aria-label="memora">
            memora
          </Link>
          <p role={problem ? "alert" : "status"}>{message}</p>
          {problem && (
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => {
                setLoading(true);
                void load();
              }}
            >
              Tentar novamente
            </button>
          )}
        </div>
      </main>
    );
  }

  const totalCount = view.mural.totalPhotos ?? photos.length;
  const coverId = view.mural.coverPhotoId ?? photos[0]?.photoId ?? null;
  const canDeleteActive = Boolean(
    view.permissions.canContribute
      && activePhoto
      && (activePhoto.ownedByGuest || sessionOwnedIds.has(activePhoto.photoId))
      && (guestToken || readStoredValue(guestStorageKey))
      && gateway.deleteGuestPhoto,
  );

  return (
    <main className={`${styles.page} ${view.permissions.canContribute ? styles.withContributions : ""}`}>
      <header className={`${styles.siteHeader} ${headerCompact ? styles.scrolledHeader : ""}`}>
        <Link className={styles.brand} href="/" aria-label="memora">
          memora
        </Link>
        <Link className={styles.scrolledBrand} href="/" aria-label="memora">
          memora
        </Link>
        <span className={styles.scrolledTitle}>{view.mural.title}</span>
        <Link className={styles.mobileBack} href="/" aria-label="Voltar para o início">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <Link className={styles.mobileClose} href="/" aria-label="Fechar mural">
          ×
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.headerBadge}>álbum de aniversário</span>
          <nav className={styles.navigation} aria-label="Navegação Memora">
            <Link href="/templates">templates</Link>
          </nav>
        </div>
      </header>

      <section className={styles.heroBanner} aria-label="Mural compartilhado">
        <img
          className={styles.heroPhoto}
          src={HOME_HERO_IMAGE_SRC}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
        />
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.titleGroup}>
            {view.mural.logoUrl && (
              <img
                className={styles.eventLogo}
                src={view.mural.logoUrl}
                alt={`Logo de ${view.mural.title}`}
              />
            )}
            <p className={styles.heroEyebrow}>MEMORA · ÁLBUM DA FESTA</p>
            <h1>{view.mural.title}</h1>
            {view.mural.description && <p className={styles.description}>{view.mural.description}</p>}
            <div className={styles.heroMetaRow}>
              <span className={styles.photoCount}>
                {totalCount} {totalCount === 1 ? "foto" : "fotos"}
              </span>
              {view.permissions.canContribute && (
                <span className={styles.heroHint}>
                  Envie suas fotos — elas entram ao vivo para todos
                </span>
              )}
            </div>
          </div>
          <SunDoodle />
        </div>
      </section>

      {banner && (
        <div className={styles.toastBanner} role="status" aria-live="polite">
          <span>{banner.text}</span>
          <div className={styles.toastActions}>
            {banner.showCameraShortcut && view.permissions.canContribute && (
              <button
                type="button"
                className={styles.toastActionBtn}
                onClick={() => cameraInputRef.current?.click()}
              >
                Tirar outra
              </button>
            )}
            <button
              type="button"
              className={styles.toastDismiss}
              aria-label="Fechar aviso"
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <section className={styles.gallerySection} aria-label="Momentos deste mural">
        <div className={styles.momentsHeader}>
          <div>
            <p className={styles.momentsEyebrow}>MOMENTOS</p>
            <h2 className={styles.momentsTitle}>Veja a festa no seu estilo</h2>
          </div>
          <span className={styles.momentsBadge}>
            {activeTemplateOption.name}
          </span>
        </div>

        <div
          className={styles.templateStrip}
          role="tablist"
          aria-label="Escolher template dos momentos"
        >
          {MOMENT_TEMPLATE_OPTIONS.map((option) => {
            const active = option.id === activeTemplateOption.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.templatePill} ${active ? styles.templatePillActive : ""}`}
                onClick={() => handleSelectTemplate(option.id)}
              >
                <TemplateMiniIcon option={option} />
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>

        {photos.length === 0 ? (
          <div className={styles.emptyGallery}>
            <span className={styles.emptySpark} aria-hidden="true">✦</span>
            <p>
              {view.permissions.canContribute
                ? "Seja a primeira pessoa a mandar uma foto pra essa festa!"
                : "Este mural ainda não tem fotos."}
            </p>
          </div>
        ) : activeTemplateOption.template === null ? (
          <ul className={styles.gallery} aria-label={`Fotos de ${view.mural.title}`}>
            {photos.map((photo, index) => (
              <li
                className={styles.photoTile}
                data-cover={photo.photoId === coverId ? "true" : undefined}
                key={photo.photoId}
                style={{ "--photo-ratio": `${photo.width} / ${photo.height}` } as CSSProperties}
              >
                {failedPhotos.has(photo.photoId) ? (
                  <div
                    className={styles.photoUnavailable}
                    role="img"
                    aria-label={`Foto ${index + 1} de ${photos.length}: indisponível`}
                  >
                    Esta foto não está disponível agora.
                  </div>
                ) : (
                  <button
                    className={styles.photoButton}
                    type="button"
                    aria-label={
                      photo.authorName
                        ? `Abrir foto ${index + 1} de ${photos.length}, por ${photo.authorName}`
                        : `Abrir foto ${index + 1} de ${photos.length}`
                    }
                    onClick={(event) => openLightbox(index, event)}
                  >
                    <img
                      src={photo.thumbnailUrl ?? photo.previewUrl}
                      alt={`Foto ${index + 1} de ${photos.length}`}
                      width={photo.width}
                      height={photo.height}
                      loading={index < 6 ? "eager" : "lazy"}
                      decoding="async"
                      onError={() => markPreviewUnavailable(photo.photoId)}
                    />
                    {photo.authorName && (
                      <span className={styles.photoCredit}>
                        <span className={styles.creditDot} aria-hidden="true" />
                        <span>por {photo.authorName}</span>
                      </span>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul
            className={styles.templateFramesList}
            aria-label={`Fotos de ${view.mural.title} no template ${activeTemplateOption.name}`}
          >
            {templateFrames.map((frame) => {
              const authors = uniqueFrameAuthors(frame.slots);
              return (
                <li className={styles.templateFrameCard} key={`${frame.template.templateId}-${frame.frameIndex}`}>
                  <div
                    className={styles.templateCanvas}
                    style={{ aspectRatio: String(frame.template.aspectRatio) }}
                  >
                    {frame.slots.map(({ slot, photo, globalIndex }) => {
                      const slotStyle: CSSProperties = {
                        left: `${slot.x * 100}%`,
                        top: `${slot.y * 100}%`,
                        width: `${slot.width * 100}%`,
                        height: `${slot.height * 100}%`,
                        zIndex: slot.layerOrder,
                      };
                      if (!photo || globalIndex === null) {
                        return (
                          <div
                            key={slot.slotId}
                            className={`${styles.templateSlot} ${styles.templateSlotEmpty}`}
                            style={slotStyle}
                            aria-hidden="true"
                          />
                        );
                      }
                      return (
                        <div key={slot.slotId} className={styles.templateSlot} style={slotStyle}>
                          {failedPhotos.has(photo.photoId) ? (
                            <div
                              className={styles.photoUnavailable}
                              role="img"
                              aria-label={`Foto ${globalIndex + 1} de ${photos.length}: indisponível`}
                            >
                              Indisponível
                            </div>
                          ) : (
                            <button
                              className={styles.photoButton}
                              type="button"
                              aria-label={
                                photo.authorName
                                  ? `Abrir foto ${globalIndex + 1} de ${photos.length}, por ${photo.authorName}`
                                  : `Abrir foto ${globalIndex + 1} de ${photos.length}`
                              }
                              onClick={(event) => openLightbox(globalIndex, event)}
                            >
                              <img
                                src={photo.thumbnailUrl ?? photo.previewUrl}
                                alt={`Foto ${globalIndex + 1} de ${photos.length}`}
                                width={photo.width}
                                height={photo.height}
                                loading={globalIndex < 6 ? "eager" : "lazy"}
                                decoding="async"
                                onError={() => markPreviewUnavailable(photo.photoId)}
                              />
                              {photo.authorName && (
                                <span className={styles.templateSlotCredit}>
                                  por {photo.authorName}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.templateFrameFooter}>
                    <div className={styles.templateFrameMeta}>
                      <span className={styles.templateFrameTitle}>{view.mural.title}</span>
                      {authors.length > 0 && (
                        <span className={styles.templateFrameAuthors}>
                          por {authors.join(", ")}
                        </span>
                      )}
                    </div>
                    <span className={styles.templateFrameTag}>
                      {frame.template.name} · #{frame.frameIndex + 1}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {view.mural.nextOffset != null && (
          <div className={styles.loadMoreRow}>
            <button
              type="button"
              className={styles.loadMoreButton}
              disabled={loadingMore}
              onClick={() => void loadMoreSharedPhotos()}
            >
              {loadingMore ? "Carregando…" : "Carregar mais fotos"}
            </button>
          </div>
        )}
      </section>

      {view.permissions.canContribute && (
        <>
          <input
            ref={cameraInputRef}
            className={styles.fileInput}
            type="file"
            accept={ACCEPTED_PHOTO_INPUT}
            capture="environment"
            aria-label="Tirar foto para a festa"
            onChange={handleSelectFiles}
          />
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept={ACCEPTED_PHOTO_INPUT}
            multiple
            aria-label="Escolher fotos da galeria"
            onChange={handleSelectFiles}
          />

          <div className={styles.actionDock} role="region" aria-label="Enviar fotos para a festa">
            <button
              className={styles.dockPrimary}
              type="button"
              disabled={isSubmitting}
              onClick={() => cameraInputRef.current?.click()}
            >
              <CameraIcon />
              <span>Tirar foto</span>
            </button>
            <button
              className={styles.dockSecondary}
              type="button"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
            >
              <GalleryIcon />
              <span>Da galeria</span>
            </button>
          </div>
        </>
      )}

      {pendingPhotos.length > 0 && (
        <div
          className={styles.reviewBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              clearPendingPhotos();
            }
          }}
        >
          <div
            className={styles.reviewSheet}
            role="dialog"
            aria-modal="true"
            aria-label="Enviar para a festa"
          >
            <div className={styles.reviewHeader}>
              <div>
                <h2 className={styles.reviewTitle}>
                  {pendingPhotos.length === 1
                    ? "1 foto pronta"
                    : `${pendingPhotos.length} fotos prontas`}
                </h2>
                <p className={styles.reviewSubtitle}>
                  Revise rápido — elas entram direto no álbum da festa.
                </p>
              </div>
              <button
                type="button"
                className={styles.reviewClose}
                aria-label="Cancelar envio"
                disabled={isSubmitting}
                onClick={clearPendingPhotos}
              >
                ×
              </button>
            </div>

            <ul className={styles.reviewGrid} aria-label="Fotos selecionadas para envio">
              {pendingPhotos.map((photo) => (
                <li className={styles.reviewThumb} key={photo.id}>
                  <img src={photo.previewUrl} alt={photo.file.name} />
                  <button
                    type="button"
                    className={styles.reviewRemove}
                    aria-label={`Remover ${photo.file.name}`}
                    disabled={isSubmitting}
                    onClick={() => removePendingPhoto(photo.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
              {pendingPhotos.length < MAX_BATCH_UPLOAD_COUNT && (
                <li>
                  <button
                    type="button"
                    className={styles.reviewAddTile}
                    disabled={isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span aria-hidden="true">+</span>
                    <span>Mais</span>
                  </button>
                </li>
              )}
            </ul>

            <label className={styles.reviewNameField} htmlFor="guest-direct-name">
              <span>Seu nome (opcional)</span>
              <input
                id="guest-direct-name"
                type="text"
                autoComplete="name"
                maxLength={40}
                placeholder="Ex.: Ana"
                value={guestName}
                disabled={isSubmitting}
                onChange={(event) => setGuestName(event.currentTarget.value)}
              />
            </label>

            {sheetError && (
              <p className={styles.reviewError} role="alert">
                {sheetError}
              </p>
            )}

            <button
              type="button"
              className={styles.reviewSubmit}
              disabled={isSubmitting}
              onClick={() => void publishPendingPhotos()}
            >
              {uploadProgress
                ?? (pendingPhotos.length === 1
                  ? "Enviar para a festa"
                  : `Enviar para a festa (${pendingPhotos.length})`)}
            </button>
          </div>
        </div>
      )}

      {activePhoto && openIndex !== null && (
        <div
          className={styles.lightboxBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenIndex(null);
          }}
        >
          <div
            className={styles.lightbox}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${openIndex + 1} de ${photos.length}`}
            tabIndex={-1}
            onTouchStart={(event) => {
              touchStartRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={handleTouchEnd}
          >
            <header className={styles.lightboxHeader}>
              <div className={styles.lightboxTitleGroup}>
                <span className={styles.lightboxEventName}>{view.mural.title}</span>
                <p className={styles.lightboxPosition}>
                  {openIndex + 1} / {photos.length}
                </p>
              </div>
              <button
                data-lightbox-close
                className={styles.lightboxClose}
                type="button"
                aria-label="Fechar foto"
                onClick={() => setOpenIndex(null)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className={styles.lightboxStage}>
              {photos.length > 1 && (
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxPrevious}`}
                  type="button"
                  aria-label="Foto anterior"
                  onClick={() => movePhoto(-1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}

              {failedPhotos.has(activePhoto.photoId) ? (
                <p
                  className={styles.lightboxUnavailable}
                  role="img"
                  aria-label={`Foto ${openIndex + 1} indisponível`}
                >
                  Esta foto não está disponível agora.
                </p>
              ) : (
                <div className={styles.lightboxFrame}>
                  <img
                    className={styles.lightboxImage}
                    src={activePhoto.previewUrl}
                    alt={`Foto ${openIndex + 1} de ${photos.length}`}
                    onError={() => markPreviewUnavailable(activePhoto.photoId)}
                  />
                </div>
              )}

              {photos.length > 1 && (
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  type="button"
                  aria-label="Próxima foto"
                  onClick={() => movePhoto(1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>

            {photos.length > 1 && (
              <div className={styles.lightboxFilmstrip} aria-label="Navegar pelas fotos">
                {photos.map((item, idx) => (
                  <button
                    key={item.photoId}
                    type="button"
                    className={`${styles.filmstripThumb} ${idx === openIndex ? styles.filmstripThumbActive : ""}`}
                    aria-label={`Ir para foto ${idx + 1}`}
                    aria-current={idx === openIndex ? "true" : undefined}
                    onClick={() => setOpenIndex(idx)}
                  >
                    <img src={item.thumbnailUrl ?? item.previewUrl} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <footer className={styles.lightboxFooter}>
              <div className={styles.lightboxAuthor}>
                {activePhoto.authorName ? (
                  <>
                    <span className={styles.lightboxAvatar} aria-hidden="true">
                      {authorInitial(activePhoto.authorName)}
                    </span>
                    <div className={styles.lightboxCreditBlock}>
                      <span className={styles.lightboxCreditLabel}>registrado</span>
                      <span className={styles.lightboxCreditText}>
                        por <strong>{activePhoto.authorName}</strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className={styles.lightboxCreditBlock}>
                    <span className={styles.lightboxCreditLabel}>álbum da festa</span>
                    <span className={styles.lightboxEventCaption}>{view.mural.title}</span>
                  </div>
                )}
              </div>

              <div className={styles.lightboxFooterActions}>
                {canDeleteActive && (
                  <div className={styles.lightboxDeleteRow}>
                    {confirmingDeleteId === activePhoto.photoId ? (
                      <>
                        <button
                          type="button"
                          className={styles.lightboxConfirmDelete}
                          disabled={isDeleting}
                          onClick={() => void handleDeleteOwnPhoto(activePhoto.photoId)}
                        >
                          {isDeleting ? "Apagando…" : "Confirmar exclusão"}
                        </button>
                        <button
                          type="button"
                          className={styles.lightboxCancelDelete}
                          disabled={isDeleting}
                          onClick={() => setConfirmingDeleteId(null)}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.lightboxDeleteBtn}
                        onClick={() => setConfirmingDeleteId(activePhoto.photoId)}
                      >
                        Apagar minha foto
                      </button>
                    )}
                  </div>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
