"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createMuralDraft, MuralDraftValidationError } from "../../application/create-mural-draft";
import type {
  MuralGateway,
  MuralPage,
  MuralStatus,
  MuralSummary,
} from "../../application/mural-gateway";
import type {
  MuralPhotoGateway,
  MuralPhotoItem,
} from "../../application/mural-photo-gateway";
import { muralApiGateway } from "../../infrastructure/mural-api-gateway";
import { muralPhotoApiGateway } from "../../infrastructure/mural-photo-api-gateway";
import {
  countUnicodeCodePoints,
  normalizeMuralDraftInput,
  validateMuralDraftInput,
} from "../../domain/murals/mural-draft-input";
import type {
  MuralDraftField,
  NormalizedMuralDraftInput,
} from "../../domain/murals/mural-draft-input";
import { BrandHeader } from "./brand-header";
import styles from "./my-murals.module.css";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | MuralStatus;

type MyMuralsProps = {
  gateway?: MuralGateway;
  photoGateway?: MuralPhotoGateway;
};

type CreationAttempt = {
  input: NormalizedMuralDraftInput;
  idempotencyKey: string;
};

type ProblemLike = {
  status?: unknown;
  field?: unknown;
  code?: unknown;
  message?: unknown;
};

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todos", value: "ALL" },
  { label: "Rascunhos", value: "DRAFT" },
  { label: "Publicados", value: "PUBLISHED" },
  { label: "Arquivados", value: "ARCHIVED" },
];

function statusLabel(status: MuralStatus): string {
  switch (status) {
    case "DRAFT":
      return "Rascunho";
    case "PUBLISHED":
      return "Publicado";
    case "ARCHIVED":
      return "Arquivado";
  }
}

function localFieldError(field: MuralDraftField, code: string): string {
  if (field === "title" && code === "required") {
    return "Informe o nome do mural.";
  }
  if (field === "title") {
    return "O nome do mural deve ter até 100 caracteres.";
  }
  return "A descrição deve ter até 500 caracteres.";
}

function serverFieldError(field: MuralDraftField, code: string): string {
  if (field === "title" || code === "invalid_mural_title") {
    return "O nome do mural deve ter entre 1 e 100 caracteres.";
  }
  return "A descrição do mural deve ter até 500 caracteres.";
}

function readProblem(error: unknown): ProblemLike {
  if (typeof error !== "object" || error === null) return {};
  return error as ProblemLike;
}

function isMuralField(value: unknown): value is MuralDraftField {
  return value === "title" || value === "description";
}

function sameNormalizedInput(
  left: NormalizedMuralDraftInput,
  right: NormalizedMuralDraftInput,
): boolean {
  return left.title === right.title && left.description === right.description;
}

function createUuid(): string {
  if (typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

function uniqueMurals(murals: MuralSummary[]): MuralSummary[] {
  const seen = new Set<string>();
  return murals.filter((mural) => {
    if (seen.has(mural.id)) return false;
    seen.add(mural.id);
    return true;
  });
}

function filterPageByStatus(page: MuralPage, status: StatusFilter): MuralPage {
  if (status === "ALL") return page;
  return {
    ...page,
    items: page.items.filter((mural) => mural.status === status),
  };
}

type MuralPhotoCardProps = {
  mural: MuralSummary;
  photoGateway: MuralPhotoGateway | null;
};

function MuralPhotoCard({ mural, photoGateway }: MuralPhotoCardProps) {
  const coverTargetRef = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [photos, setPhotos] = useState<MuralPhotoItem[]>([]);
  const [photoState, setPhotoState] = useState<"loading" | "loaded" | "unavailable">(
    photoGateway ? "loading" : "unavailable",
  );

  useEffect(() => {
    const target = coverTargetRef.current;
    if (!photoGateway || !target) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "220px" },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [mural.id, photoGateway]);

  useEffect(() => {
    if (!photoGateway) {
      setPhotos([]);
      setPhotoState("unavailable");
      return;
    }
    if (!isNearViewport) return;

    let active = true;
    setPhotos([]);
    setPhotoState("loading");

    photoGateway
      .listMuralPhotos(mural.id)
      .then((page) => {
        if (!active) return;
        setPhotos(page.items);
        setPhotoState("loaded");
      })
      .catch(() => {
        if (active) setPhotoState("unavailable");
      });

    return () => {
      active = false;
    };
  }, [isNearViewport, mural.id, photoGateway]);

  const cover =
    photoState === "loaded" && mural.coverPhotoId
      ? photos.find((photo) => photo.photoId === mural.coverPhotoId)
      : undefined;

  return (
    <article className="mural-card">
      <div className="mural-card-cover" ref={coverTargetRef}>
        {cover ? (
          <img
            src={cover.previewUrl}
            alt={`Capa de ${mural.title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="mural-card-cover-empty">
            <span>Capa indisponível</span>
          </div>
        )}
      </div>
      <div className="mural-card-copy">
        <h3>{mural.title}</h3>
        <p className="mural-card-photo-count" aria-live="polite">
          {photoState === "loading"
            ? "Carregando fotos…"
            : photoState === "unavailable"
              ? "Fotos indisponíveis"
              : `${photos.length} ${photos.length === 1 ? "foto" : "fotos"}`}
        </p>
        <p className="mural-card-date">
          Criado em <time dateTime={mural.createdAt}>{formatCreatedAt(mural.createdAt)}</time>
        </p>
      </div>
      <span className={`mural-status mural-status-${mural.status.toLowerCase()}`}>
        {statusLabel(mural.status)}
      </span>
    </article>
  );
}

function MobileNavigation() {
  return (
    <nav className="mobile-bottom-navigation" aria-label="Navegação móvel">
      <a className="mobile-nav-item" href="/" aria-label="Início">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
        </svg>
        <span>Início</span>
      </a>
      <a className="mobile-nav-item is-active" href="/meus-murais" aria-current="page">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
        <span>Murais</span>
      </a>
      <a className="mobile-nav-create" href="/templates" aria-label="Criar mural">
        <span aria-hidden="true">+</span>
      </a>
      <a className="mobile-nav-item" href="/templates" aria-label="Modelos">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>Modelos</span>
      </a>
      <button className="mobile-nav-item" type="button" disabled aria-disabled="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        <span>Perfil</span>
      </button>
    </nav>
  );
}

export function MyMurals({ gateway: providedGateway, photoGateway: providedPhotoGateway }: MyMuralsProps) {
  const gateway = providedGateway ?? muralApiGateway;
  const photoGateway =
    providedPhotoGateway ?? (providedGateway ? null : muralPhotoApiGateway);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [murals, setMurals] = useState<MuralSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [accessUnavailable, setAccessUnavailable] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<MuralDraftField, string>>
  >({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [canRetryCreate, setCanRetryCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const statusFilterRef = useRef<StatusFilter>("ALL");
  const loadingMoreRef = useRef(false);
  const resultsFocusRef = useRef<HTMLElement | null>(null);
  const focusResultsAfterFinalPageRef = useRef(false);
  const setResultsFocusElement = useCallback((node: HTMLElement | null) => {
    resultsFocusRef.current = node;
  }, []);
  const creatingRef = useRef(false);
  const creationAttemptRef = useRef<CreationAttempt | null>(null);
  const newlyCreatedDraftRef = useRef<MuralSummary | null>(null);

  useEffect(() => {
    let active = true;
    const requestId = ++requestSequence.current;
    const currentFilter = statusFilter;
    const query = {
      limit: PAGE_SIZE,
      ...(currentFilter === "ALL" ? {} : { status: currentFilter }),
    };

    setIsLoading(true);
    setLoadError(false);
    setAccessUnavailable(false);
    setLoadMoreError(false);

    gateway
      .listMurals(query)
      .then((result) => {
        if (!active || requestId !== requestSequence.current) return;
        const page = filterPageByStatus(result, currentFilter);
        const createdDraft = newlyCreatedDraftRef.current;
        const items =
          currentFilter === "DRAFT" && createdDraft
            ? uniqueMurals([createdDraft, ...page.items])
            : page.items;
        setMurals(items);
        setNextCursor(page.nextCursor);
        if (createdDraft && currentFilter === "DRAFT") {
          newlyCreatedDraftRef.current = null;
        }
      })
      .catch((error: unknown) => {
        if (!active || requestId !== requestSequence.current) return;
        const problem = readProblem(error);
        if (problem.status === 401) {
          setAccessUnavailable(true);
          setLoadError(false);
          return;
        }
        setLoadError(true);
      })
      .finally(() => {
        if (active && requestId === requestSequence.current) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [gateway, statusFilter, refreshVersion]);

  useEffect(() => {
    if (
      !focusResultsAfterFinalPageRef.current ||
      nextCursor !== null ||
      isLoadingMore
    ) {
      return;
    }

    focusResultsAfterFinalPageRef.current = false;
    resultsFocusRef.current?.focus();
  }, [isLoadingMore, murals, nextCursor]);

  async function loadMore() {
    const cursor = nextCursor;
    const requestedStatus = statusFilter;
    if (!cursor || loadingMoreRef.current || isLoading) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      const query = {
        limit: PAGE_SIZE,
        ...(requestedStatus === "ALL" ? {} : { status: requestedStatus }),
        cursor,
      };
      const result = await gateway.listMurals(query);
      if (statusFilterRef.current !== requestedStatus) return;
      const page = filterPageByStatus(result, requestedStatus);
      if (page.nextCursor === null) {
        focusResultsAfterFinalPageRef.current = true;
      }
      setMurals((current) => uniqueMurals([...current, ...page.items]));
      setNextCursor(page.nextCursor);
    } catch (error: unknown) {
      if (statusFilterRef.current === requestedStatus) {
        const problem = readProblem(error);
        if (problem.status === 401) {
          setAccessUnavailable(true);
          setMurals([]);
          setNextCursor(null);
          setLoadMoreError(false);
        } else {
          setLoadMoreError(true);
        }
      }
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }

  function handleStatusChange(status: StatusFilter) {
    if (status === statusFilter) return;
    statusFilterRef.current = status;
    setStatusFilter(status);
    setMurals([]);
    setNextCursor(null);
    setLoadError(false);
    setLoadMoreError(false);
    setAccessUnavailable(false);
    setNotice(null);
  }

  async function submitDraft() {
    if (creatingRef.current) return;

    const rawInput = { title, description };
    const localErrors = validateMuralDraftInput(rawInput);
    if (Object.keys(localErrors).length > 0) {
      const messages: Partial<Record<MuralDraftField, string>> = {};
      Object.entries(localErrors).forEach(([field, code]) => {
        if (isMuralField(field) && code) {
          messages[field] = localFieldError(field, code);
        }
      });
      setFieldErrors(messages);
      setCreateError(null);
      setCanRetryCreate(false);
      return;
    }

    const normalizedInput = normalizeMuralDraftInput(rawInput);
    let attempt = creationAttemptRef.current;
    if (!attempt || !sameNormalizedInput(attempt.input, normalizedInput)) {
      attempt = {
        input: normalizedInput,
        idempotencyKey: createUuid(),
      };
      creationAttemptRef.current = attempt;
    }

    creatingRef.current = true;
    setIsCreating(true);
    setFieldErrors({});
    setCreateError(null);
    setCanRetryCreate(false);
    setNotice(null);

    try {
      const created = await createMuralDraft(
        rawInput,
        gateway,
        attempt.idempotencyKey,
      );
      creationAttemptRef.current = null;
      newlyCreatedDraftRef.current = created;
      setTitle("");
      setDescription("");
      setFieldErrors({});
      setCreateError(null);
      setCanRetryCreate(false);
      setNotice("Rascunho criado.");
      setMurals([created]);
      setNextCursor(null);

      if (statusFilterRef.current === "DRAFT") {
        setRefreshVersion((version) => version + 1);
      } else {
        statusFilterRef.current = "DRAFT";
        setStatusFilter("DRAFT");
      }
    } catch (error: unknown) {
      if (error instanceof MuralDraftValidationError) {
        const messages: Partial<Record<MuralDraftField, string>> = {};
        Object.entries(error.fields).forEach(([field, code]) => {
          if (isMuralField(field) && code) {
            messages[field] = localFieldError(field, code);
          }
        });
        setFieldErrors(messages);
        return;
      }

      const problem = readProblem(error);
      if (problem.status === 422 && isMuralField(problem.field)) {
        const code = typeof problem.code === "string" ? problem.code : "";
        setFieldErrors({
          [problem.field]: serverFieldError(problem.field, code),
        });
        setCanRetryCreate(false);
        return;
      }

      if (problem.status === 401) {
        setAccessUnavailable(true);
        setMurals([]);
        setNextCursor(null);
        setCanRetryCreate(false);
        return;
      }

      setCreateError(
        "Não foi possível criar o rascunho. Seus dados foram mantidos; tente novamente.",
      );
      setCanRetryCreate(true);
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  }

  const isBusy = isLoading || isLoadingMore || isCreating;
  const normalizedTitleLength = countUnicodeCodePoints(
    normalizeMuralDraftInput({ title, description }).title,
  );
  const normalizedDescription = normalizeMuralDraftInput({
    title,
    description,
  }).description;
  const normalizedDescriptionLength = normalizedDescription
    ? countUnicodeCodePoints(normalizedDescription)
    : 0;

  return (
    <div className={`memora-shell mural-shell ${styles.muralCollection}`}>
      <BrandHeader activePage="murals" />

      <main className="mural-main" aria-busy={isBusy}>
        <section className="mural-intro" aria-labelledby="mural-page-title">
          <p className="eyebrow">Suas lembranças, reunidas</p>
          <h1 id="mural-page-title">
            seus momentos, <span>todos aqui.</span>
          </h1>
          <p>
            Crie rascunhos para organizar suas histórias. A composição e a
            publicação estarão disponíveis em outra etapa.
          </p>
        </section>

        {accessUnavailable ? (
          <section
            className="mural-state mural-access-state"
            aria-labelledby="access-title"
            role="status"
            aria-live="polite"
          >
            <h2 id="access-title">Acesso indisponível</h2>
            <p>Este ambiente não está com uma sessão disponível para seus murais.</p>
          </section>
        ) : (
          <>
            <section className="mural-create-panel" aria-labelledby="create-mural-title">
              <div className="mural-panel-heading">
                <p className="eyebrow">Um novo começo</p>
                <h2 id="create-mural-title">Criar um rascunho</h2>
              </div>

              <form
                className="mural-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitDraft();
                }}
                noValidate
              >
                <div className="mural-field">
                  <label htmlFor="mural-title">Nome do mural</label>
                  <input
                    id="mural-title"
                    name="title"
                    type="text"
                    autoComplete="off"
                    value={title}
                    aria-invalid={Boolean(fieldErrors.title)}
                    aria-describedby={
                      fieldErrors.title
                        ? "mural-title-count mural-title-error"
                        : "mural-title-count"
                    }
                    onChange={(event) => {
                      setTitle(event.currentTarget.value);
                      setFieldErrors((current) => ({
                        ...current,
                        title: undefined,
                      }));
                      setCreateError(null);
                      setCanRetryCreate(false);
                    }}
                  />
                  <p id="mural-title-count" className="mural-field-hint">
                    {normalizedTitleLength}/100 caracteres
                  </p>
                  {fieldErrors.title && (
                    <p id="mural-title-error" className="mural-field-error">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                <div className="mural-field">
                  <label htmlFor="mural-description">Descrição (opcional)</label>
                  <textarea
                    id="mural-description"
                    name="description"
                    rows={3}
                    value={description}
                    aria-invalid={Boolean(fieldErrors.description)}
                    aria-describedby={
                      fieldErrors.description
                        ? "mural-description-count mural-description-error"
                        : "mural-description-count"
                    }
                    onChange={(event) => {
                      setDescription(event.currentTarget.value);
                      setFieldErrors((current) => ({
                        ...current,
                        description: undefined,
                      }));
                      setCreateError(null);
                      setCanRetryCreate(false);
                    }}
                  />
                  <p id="mural-description-count" className="mural-field-hint">
                    {normalizedDescriptionLength}/500 caracteres
                  </p>
                  {fieldErrors.description && (
                    <p
                      id="mural-description-error"
                      className="mural-field-error"
                    >
                      {fieldErrors.description}
                    </p>
                  )}
                </div>

                {createError && (
                  <div className="mural-form-alert">
                    <p role="alert">{createError}</p>
                    {canRetryCreate && (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => void submitDraft()}
                        disabled={isCreating}
                      >
                        Tentar novamente
                      </button>
                    )}
                  </div>
                )}

                <div className="mural-form-actions">
                  <p className="mural-private-note">
                    Este rascunho fica privado neste ambiente.
                  </p>
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={isCreating}
                  >
                    {isCreating ? "Criando…" : "Criar rascunho"}
                  </button>
                </div>
              </form>
              {notice && (
                <p className="mural-notice" role="status" aria-live="polite">
                  {notice}
                </p>
              )}
            </section>

            <section className="mural-list-section" aria-labelledby="mural-list-title">
              <div className="mural-list-heading">
                <div>
                  <p className="eyebrow">Seus projetos</p>
                  <h2 id="mural-list-title">Murais guardados</h2>
                </div>
                <p className="mural-list-description">
                  Seus rascunhos continuam privados até você escolher compartilhá-los.
                </p>
              </div>

              <div
                className="mural-filters"
                role="group"
                aria-label="Filtrar murais por status"
              >
                {STATUS_FILTERS.map((filter) => (
                  <button
                    className="mural-filter-button"
                    type="button"
                    key={filter.value}
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => handleStatusChange(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="mural-state" role="status" aria-live="polite">
                  Carregando seus murais…
                </div>
              ) : loadError && murals.length === 0 ? (
                <div className="mural-state mural-error-state">
                  <p role="alert">Não foi possível carregar seus murais agora.</p>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setRefreshVersion((version) => version + 1)}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  {loadError && (
                    <div className="mural-inline-alert">
                      <span role="alert">Não foi possível atualizar a lista.</span>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setRefreshVersion((version) => version + 1)}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {murals.length === 0 ? (
                    <div
                      className="mural-state mural-empty-state"
                      role="region"
                      aria-labelledby="mural-empty-title"
                      tabIndex={-1}
                      ref={setResultsFocusElement}
                    >
                      <div role="status" aria-live="polite">
                        <h3 id="mural-empty-title">
                          {statusFilter === "ALL"
                            ? "Você ainda não criou nenhum mural."
                            : statusFilter === "DRAFT"
                              ? "Nenhum rascunho por aqui."
                              : statusFilter === "PUBLISHED"
                                ? "Nenhum mural publicado por aqui."
                                : "Nenhum mural arquivado por aqui."}
                        </h3>
                        <p>
                          {statusFilter === "ALL"
                            ? "Dê um nome para a lembrança que você quer reunir."
                            : "Experimente outro status ou volte para todos os murais."}
                        </p>
                      </div>
                      {statusFilter !== "ALL" && (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => handleStatusChange("ALL")}
                        >
                          Voltar a Todos
                        </button>
                      )}
                      {statusFilter === "ALL" && (
                        <a className="button button-primary" href="/templates">
                          Criar um mural
                        </a>
                      )}
                    </div>
                  ) : (
                    <ul
                      className="mural-card-list"
                      aria-label="Lista de murais"
                      tabIndex={-1}
                      ref={setResultsFocusElement}
                    >
                      {murals.map((mural) => (
                        <li key={mural.id}>
                          <MuralPhotoCard mural={mural} photoGateway={photoGateway} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {loadMoreError && (
                    <div className="mural-inline-alert">
                      <span role="alert">Não foi possível carregar a próxima página.</span>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => void loadMore()}
                        disabled={isLoadingMore}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {nextCursor && !loadMoreError && (
                    <div className="mural-load-more-row">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => void loadMore()}
                        disabled={isLoadingMore || isLoading}
                      >
                        {isLoadingMore ? "Carregando…" : "Carregar mais"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="page-footer">
        <span>Memora</span>
        <span>Suas histórias merecem ser guardadas.</span>
      </footer>
      <MobileNavigation />
    </div>
  );
}
