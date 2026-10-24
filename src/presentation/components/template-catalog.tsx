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

const ORIENTATION_LABELS: Record<TemplateOrientation, string> = {
  portrait: "Retrato",
  square: "Quadrado",
  landscape: "Paisagem",
};

function photoCountLabel(photoCount: number): string {
  return `${photoCount} ${photoCount === 1 ? "foto" : "fotos"}`;
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
        {definition.slots.map((slot) => (
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
          />
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [createError, setCreateError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<LocalCompositionDraftListing[]>([]);
  const [draftsState, setDraftsState] = useState<"loading" | "ready" | "error">("loading");
  const visibleTemplates = useMemo(
    () => filterTemplateCatalog(TEMPLATE_CATALOG_V1, filters),
    [filters],
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

    const nextVisibleTemplates = filterTemplateCatalog(TEMPLATE_CATALOG_V1, nextFilters);
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

  function selectTemplate(definition: TemplateDefinition) {
    if (selectedTemplateId === definition.templateId) return;

    setSelectedTemplateId(definition.templateId);
    setAnnouncement(
      `Template selecionado: ${definition.name}, ${photoCountLabel(definition.photoCount)}.`,
    );
  }

  return (
    <div className="memora-shell template-shell">
      <BrandHeader activePage="templates" />

      <main className="template-main">
        <section className="template-intro" aria-labelledby="template-page-title">
          <p className="eyebrow">Arranjos para suas lembranças</p>
          <h1 id="template-page-title">Escolha um template</h1>
          <p>
            Compare os modelos e, quando estiver pronta, inicie um rascunho
            guardado somente neste navegador.
          </p>
        </section>

        <section className="template-catalog-section" aria-labelledby="template-catalog-title">
          <div className="template-section-heading">
            <div>
              <p className="eyebrow">Oito formas de começar</p>
              <h2 id="template-catalog-title">Catálogo de templates</h2>
            </div>
            <p>Você pode explorar os modelos mesmo sem fotografias guardadas.</p>
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
                onClick={() => applyFilters({})}
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
                return (
                  <li key={definition.templateId}>
                    <button
                      className="template-card"
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${definition.name}, ${countLabel}, ${ORIENTATION_LABELS[orientation]}`}
                      onClick={() => selectTemplate(definition)}
                    >
                      <TemplatePreview definition={definition} />
                      <span className="template-card-copy">
                        <span className="template-card-title">{definition.name}</span>
                        <span className="template-card-details">
                          <span>{countLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ORIENTATION_LABELS[orientation]}</span>
                        </span>
                        {selected && <span className="template-selected-label">Selecionado</span>}
                      </span>
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
