"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  filterTemplateCatalog,
  getTemplateOrientation,
  TEMPLATE_CATALOG_V1,
} from "../../domain/templates/template-catalog";
import type {
  TemplateCatalogFilter,
  TemplateDefinition,
  TemplateOrientation,
} from "../../domain/templates/template-catalog";
import type { LocalCompositionDraftStore } from "../../application/compositions/local-composition-draft-store";
import { createCompositionDraft } from "../../application/compositions/create-composition-draft";
import { listCompositionDrafts } from "../../application/compositions/restore-composition-draft";
import type { LocalCompositionDraftListing } from "../../application/compositions/restore-composition-draft";
import { localCompositionDraftStore } from "../../infrastructure/local-composition-draft-store";
import { BrandHeader } from "./brand-header";

const PHOTO_COUNTS: Array<NonNullable<TemplateCatalogFilter["photoCount"]>> = [
  1,
  2,
  3,
  4,
  6,
];

const ASPECT_RATIOS: Array<NonNullable<TemplateCatalogFilter["aspectRatio"]>> = [
  "1:1",
  "4:3",
  "2:3",
  "4:5",
];

const RATIO_LABELS: ReadonlyArray<{
  label: NonNullable<TemplateCatalogFilter["aspectRatio"]>;
  ratio: number;
}> = [
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "2:3", ratio: 2 / 3 },
  { label: "4:5", ratio: 4 / 5 },
];

const ORIENTATION_LABELS: Record<TemplateOrientation, string> = {
  portrait: "Retrato",
  square: "Quadrado",
  landscape: "Paisagem",
};

const TEMPLATE_PREVIEW_IMAGES: Readonly<Record<string, readonly string[]>> = {
  "single-photo": ["/brand/v2/photos/hero/festival-selfie.webp"],
  "duo-side-by-side": [
    "/brand/v2/photos/murals/summer-beach.webp",
    "/brand/v2/photos/gallery/coastal-roadtrip.webp",
  ],
  "trio-featured": [
    "/brand/v2/photos/murals/friday-party.webp",
    "/brand/v2/photos/gallery/festival-lights.webp",
    "/brand/v2/photos/gallery/campus-friends.webp",
  ],
  "classic-strip": [
    "/brand/v2/photos/murals/skate-action.webp",
    "/brand/v2/photos/murals/roadtrip-van.webp",
    "/brand/v2/photos/gallery/sunset-viewpoint.webp",
    "/brand/v2/photos/gallery/golden-beach.webp",
  ],
  "grid-four": [
    "/brand/v2/photos/birthday/selfie.webp",
    "/brand/v2/photos/birthday/cake.webp",
    "/brand/v2/photos/birthday/wish.webp",
    "/brand/v2/photos/birthday/friends.webp",
  ],
  "polaroid-single": ["/brand/v2/photos/murals/birthday-party.webp"],
  "grid-six": [
    "/brand/v2/photos/gallery/beach-campfire.webp",
    "/brand/v2/photos/gallery/campus-friends.webp",
    "/brand/v2/photos/gallery/concert-friends.webp",
    "/brand/v2/photos/gallery/festival-lights.webp",
    "/brand/v2/photos/gallery/golden-beach.webp",
    "/brand/v2/photos/gallery/sunset-viewpoint.webp",
  ],
  "story-trio": [
    "/brand/v2/photos/murals/friday-party.webp",
    "/brand/v2/photos/gallery/sunset-viewpoint.webp",
    "/brand/v2/photos/gallery/concert-friends.webp",
  ],
};

function matchesSearch(definition: TemplateDefinition, searchQuery: string): boolean {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("pt-BR");
  if (!normalizedQuery) return true;
  return [definition.name, definition.description, definition.templateId]
    .join(" ")
    .toLocaleLowerCase("pt-BR")
    .includes(normalizedQuery);
}

function getVisibleTemplates(
  filters: TemplateCatalogFilter,
  searchQuery: string,
): TemplateDefinition[] {
  return filterTemplateCatalog(TEMPLATE_CATALOG_V1, filters).filter((definition) =>
    matchesSearch(definition, searchQuery),
  );
}

function photoCountLabel(photoCount: number): string {
  return `${photoCount} ${photoCount === 1 ? "foto" : "fotos"}`;
}

function aspectRatioLabel(aspectRatio: number): string {
  const match = RATIO_LABELS.find(
    ({ ratio }) => Math.abs(ratio - aspectRatio) < 0.0001,
  );
  if (!match) throw new Error(`Template aspect ratio is not labeled: ${aspectRatio}.`);
  return match.label;
}

function createDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function matchesFilter(
  current: TemplateCatalogFilter,
  next: TemplateCatalogFilter,
): boolean {
  return current.photoCount === next.photoCount && current.aspectRatio === next.aspectRatio;
}

type TemplatePreviewProps = {
  definition: TemplateDefinition;
};

function TemplatePreview({ definition }: TemplatePreviewProps) {
  const previewImages = TEMPLATE_PREVIEW_IMAGES[definition.templateId];
  if (!previewImages || previewImages.length !== definition.slots.length) {
    throw new Error(`Template preview assets do not match ${definition.templateId}.`);
  }
  const style = {
    "--template-aspect-ratio": definition.aspectRatio,
  } as CSSProperties;

  return (
    <div className="template-preview-area" aria-hidden="true">
      <div
        className={`template-preview-canvas${definition.decorations.length > 0 ? " template-preview-canvas-framed" : ""}`}
        style={style}
      >
        {definition.decorations.map((decoration) => (
          <span
            className={`template-preview-decoration template-preview-decoration-${decoration.decorationId}-v${decoration.styleVersion}`}
            key={decoration.decorationId}
            style={{
              left: `${decoration.x * 100}%`,
              top: `${decoration.y * 100}%`,
              width: `${decoration.width * 100}%`,
              height: `${decoration.height * 100}%`,
              zIndex: decoration.layerOrder,
            }}
          />
        ))}
        {definition.slots.map((slot, index) => (
          <span
            className="template-preview-slot"
            key={slot.slotId}
            style={{
              left: `${slot.x * 100}%`,
              top: `${slot.y * 100}%`,
              width: `${slot.width * 100}%`,
              height: `${slot.height * 100}%`,
              zIndex: slot.layerOrder,
            }}
          >
            <img
              src={previewImages[index]!}
              alt=""
              aria-hidden="true"
              decoding="async"
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export type TemplateCatalogProps = {
  draftStore?: Pick<LocalCompositionDraftStore, "create" | "list">;
  onNavigate?: (href: string) => void;
  createId?: () => string;
};

export function TemplateCatalog({
  draftStore = localCompositionDraftStore,
  onNavigate,
  createId = createDraftId,
}: TemplateCatalogProps) {
  const [filters, setFilters] = useState<TemplateCatalogFilter>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [createError, setCreateError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<LocalCompositionDraftListing[]>([]);
  const [draftsState, setDraftsState] = useState<"loading" | "ready" | "error">("loading");
  const visibleTemplates = useMemo(
    () => getVisibleTemplates(filters, searchQuery),
    [filters, searchQuery],
  );
  const selectedTemplate = TEMPLATE_CATALOG_V1.find(
    (definition) => definition.templateId === selectedTemplateId,
  );

  async function loadDrafts() {
    setDraftsState("loading");
    try {
      const drafts = await listCompositionDrafts({ store: draftStore });
      setLocalDrafts(drafts);
      setDraftsState("ready");
    } catch {
      setDraftsState("error");
    }
  }

  useEffect(() => {
    void loadDrafts();
    // The store is a stable application dependency; avoid refetching on local UI state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStore]);

  async function useSelectedTemplate() {
    if (!selectedTemplate || isCreating) return;
    setIsCreating(true);
    setCreateError(false);
    try {
      const draft = await createCompositionDraft(selectedTemplate.templateId, {
        catalog: TEMPLATE_CATALOG_V1,
        store: draftStore,
        createId,
        now: () => new Date(),
      });
      setAnnouncement(`Rascunho local iniciado com ${selectedTemplate.name}.`);
      if (onNavigate) onNavigate(`/editor/${draft.id}`);
      else window.location.assign(`/editor/${draft.id}`);
    } catch {
      setCreateError(true);
      setAnnouncement("Não foi possível salvar o rascunho neste navegador. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  }

  function continueDraft(draftId: string) {
    if (onNavigate) onNavigate(`/editor/${draftId}`);
    else window.location.assign(`/editor/${draftId}`);
  }

  function applyFilters(nextFilters: TemplateCatalogFilter) {
    if (matchesFilter(filters, nextFilters)) return;

    const nextVisibleTemplates = getVisibleTemplates(nextFilters, searchQuery);
    const selectedTemplate = TEMPLATE_CATALOG_V1.find(
      (definition) => definition.templateId === selectedTemplateId,
    );
    if (
      selectedTemplate &&
      !nextVisibleTemplates.some(
        (definition) => definition.templateId === selectedTemplate.templateId,
      )
    ) {
      setSelectedTemplateId(null);
      setAnnouncement(
        `A seleção de ${selectedTemplate.name} foi removida porque os filtros ocultaram esse template.`,
      );
    }

    setFilters(nextFilters);
  }

  function applySearchQuery(nextSearchQuery: string) {
    const nextVisibleTemplates = getVisibleTemplates(filters, nextSearchQuery);
    const selected = TEMPLATE_CATALOG_V1.find(
      (definition) => definition.templateId === selectedTemplateId,
    );
    if (
      selected &&
      !nextVisibleTemplates.some((definition) => definition.templateId === selected.templateId)
    ) {
      setSelectedTemplateId(null);
      setAnnouncement(
        `A seleção de ${selected.name} foi removida porque a busca ocultou esse template.`,
      );
    }
    setSearchQuery(nextSearchQuery);
  }

  function selectTemplate(definition: TemplateDefinition) {
    if (selectedTemplateId === definition.templateId) return;

    setSelectedTemplateId(definition.templateId);
    setAnnouncement(
      `Template selecionado: ${definition.name}, ${photoCountLabel(definition.photoCount)}.`,
    );
  }

  function clearAllFilters() {
    setSelectedTemplateId(null);
    setFilters({});
    setSearchQuery("");
    setAnnouncement("Filtros e busca limpos. Os oito templates estão visíveis.");
  }

  return (
    <div className="memora-shell template-shell">
      <div className="template-desktop-header">
        <BrandHeader activePage="templates" />
      </div>

      <header className="template-mobile-header">
        <a className="template-back-link" href="/meus-murais" aria-label="Voltar para Meus murais">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </a>
        <a className="template-mobile-wordmark" href="/" aria-label="Memora, início">
          memora
        </a>
        <button
          className="template-search-toggle"
          type="button"
          aria-label={searchOpen ? "Fechar busca de templates" : "Buscar templates"}
          aria-expanded={searchOpen}
          aria-controls={searchOpen ? "template-search-input" : undefined}
          onClick={() => {
            if (searchOpen) applySearchQuery("");
            setSearchOpen(!searchOpen);
          }}
        >
          {searchOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m15.5 15.5 4.2 4.2" />
            </svg>
          )}
        </button>
      </header>

      {searchOpen && (
        <div className="template-mobile-search">
          <input
            id="template-search-input"
            type="search"
            role="searchbox"
            aria-label="Buscar templates"
            autoFocus
            placeholder="buscar pelo nome ou formato"
            value={searchQuery}
            onChange={(event) => applySearchQuery(event.target.value)}
          />
        </div>
      )}

      <main className="template-main">
        <section className="template-intro" aria-labelledby="template-page-title">
          <div className="template-intro-copy">
            <p className="eyebrow template-desktop-eyebrow">04 · Templates</p>
            <h1 id="template-page-title" aria-label="Templates: escolha seu mood">
              <span className="template-title-mobile" aria-hidden="true">
                escolhe<br />o <span className="template-title-accent">mood</span>
                <svg className="template-title-mark" viewBox="0 0 44 42" aria-hidden="true">
                  <path d="M5 16 17 9M15 28l13-2M26 5l2 11" />
                </svg>
              </span>
              <span className="template-title-desktop" aria-hidden="true">
                qual é o <span className="template-title-accent">mood</span>?
              </span>
            </h1>
            <p className="template-desktop-subtitle">o layout certo pro seu photo dump</p>
          </div>

          <div className="template-filter-groups">
            <div className="template-filter-group" role="group" aria-label="Quantidade de fotos">
              <span className="template-filter-label">Quantidade de fotos</span>
              <div className="template-filter-options">
                <button
                  className="template-filter-button"
                  type="button"
                  aria-pressed={filters.photoCount === undefined}
                  onClick={() => {
                    const nextFilters = { ...filters };
                    delete nextFilters.photoCount;
                    applyFilters(nextFilters);
                  }}
                >
                  Todos
                </button>
                {PHOTO_COUNTS.map((photoCount) => (
                  <button
                    className="template-filter-button"
                    type="button"
                    key={photoCount}
                    aria-pressed={filters.photoCount === photoCount}
                    onClick={() => applyFilters({ ...filters, photoCount })}
                  >
                    {photoCountLabel(photoCount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="template-filter-group" role="group" aria-label="Proporção">
              <span className="template-filter-label">Proporção</span>
              <div className="template-filter-options">
                <button
                  className="template-filter-button"
                  type="button"
                  aria-pressed={filters.aspectRatio === undefined}
                  onClick={() => {
                    const nextFilters = { ...filters };
                    delete nextFilters.aspectRatio;
                    applyFilters(nextFilters);
                  }}
                >
                  Todas as proporções
                </button>
                {ASPECT_RATIOS.map((aspectRatio) => (
                  <button
                    className="template-filter-button"
                    type="button"
                    key={aspectRatio}
                    aria-pressed={filters.aspectRatio === aspectRatio}
                    onClick={() => applyFilters({ ...filters, aspectRatio })}
                  >
                    {aspectRatio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="template-catalog-section" aria-label="Catálogo de templates">
          <p className="template-announcement" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>

          {createError && (
            <div className="template-create-error" role="alert">
              <p>Não foi possível salvar o rascunho neste navegador.</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void useSelectedTemplate()}
                disabled={!selectedTemplate || isCreating}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {visibleTemplates.length === 0 ? (
            <div className="template-empty-state">
              <p role="status" aria-live="polite">
                Nenhum template combina com esses filtros.
              </p>
              <button
                className="button button-secondary template-clear-button"
                type="button"
                onClick={clearAllFilters}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <ul className="template-card-grid" aria-label="Catálogo de templates">
              {visibleTemplates.map((definition) => {
                const selected = selectedTemplateId === definition.templateId;
                const countLabel = photoCountLabel(definition.photoCount);
                const orientation = getTemplateOrientation(definition.aspectRatio);
                const ratioLabel = aspectRatioLabel(definition.aspectRatio);
                return (
                  <li key={definition.templateId}>
                    <button
                      className="template-card"
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${definition.name}, ${countLabel}, ${ORIENTATION_LABELS[orientation]}, proporção ${ratioLabel}`}
                      data-template-id={definition.templateId}
                      data-template-version={definition.version}
                      onClick={() => selectTemplate(definition)}
                    >
                      <TemplatePreview definition={definition} />
                      <span className="template-card-copy">
                        <span className="template-card-title">{definition.name}</span>
                        <span className="template-card-details">
                          <span>{countLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ORIENTATION_LABELS[orientation]}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ratioLabel}</span>
                        </span>
                        {selected && <span className="template-selected-label">Selecionado</span>}
                      </span>
                      <span className="template-card-chevron" aria-hidden="true">›</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedTemplate && (
            <div className="template-use-row">
              <p>
                A composição começa vazia. Você escolhe depois quais fotografias
                guardadas deseja usar.
              </p>
              <button
                className="button button-primary"
                type="button"
                onClick={() => void useSelectedTemplate()}
                disabled={isCreating}
              >
                {isCreating ? "Salvando rascunho…" : `Usar template ${selectedTemplate.name}`}
              </button>
            </div>
          )}
        </section>

        <section className="local-drafts-section" aria-labelledby="local-drafts-title">
          <div className="template-section-heading">
            <div>
              <p className="eyebrow">Neste navegador</p>
              <h2 id="local-drafts-title">Rascunhos locais</h2>
            </div>
            <p>Seus rascunhos não são sincronizados nem publicados.</p>
          </div>

          {draftsState === "loading" ? (
            <p className="local-drafts-state" role="status">Carregando rascunhos locais…</p>
          ) : draftsState === "error" ? (
            <div className="local-drafts-state local-drafts-error" role="alert">
              <p>Não foi possível carregar seus rascunhos locais.</p>
              <button className="button button-secondary" type="button" onClick={() => void loadDrafts()}>
                Tentar carregar rascunhos novamente
              </button>
            </div>
          ) : localDrafts.length === 0 ? (
            <p className="local-drafts-state">Nenhum rascunho local neste navegador.</p>
          ) : (
            <ul className="local-draft-list" aria-label="Rascunhos locais">
              {localDrafts.map((draft) => (
                <li key={draft.id} className="local-draft-card">
                  <div>
                    <h3>{draft.compatible ? draft.template?.name : "Rascunho incompatível"}</h3>
                    <p>
                      {draft.compatible
                        ? `Versão ${draft.templateVersion}`
                        : "Este rascunho será aberto no modo de recuperação."} · {" "}
                      {draft.updatedAt
                        ? `Atualizado em ${new Date(draft.updatedAt).toLocaleDateString("pt-BR")}`
                        : "Data indisponível"}
                    </p>
                    <p className="local-only-note">Rascunho salvo neste navegador</p>
                  </div>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => continueDraft(draft.id)}
                    aria-label={`Continuar ${draft.template?.name ?? "rascunho incompatível"}`}
                  >
                    Continuar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="page-footer">
        <span>Memora</span>
        <span>Suas histórias merecem ser guardadas.</span>
      </footer>
    </div>
  );
}
