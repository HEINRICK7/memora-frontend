import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import userEvent from "@testing-library/user-event";
import { createCompositionDocument } from "../../domain/compositions/composition-document";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";
import { TemplateCatalog } from "./template-catalog";

const duoTemplate = TEMPLATE_CATALOG_V1.find((template) => template.templateId === "duo-side-by-side")!;
const singleTemplate = TEMPLATE_CATALOG_V1.find((template) => template.templateId === "single-photo")!;
const newerDraftId = "edb46de7-887d-4ac8-a2ca-caa04d3843ec";
const olderDraftId = "82f44972-00f0-4b5c-8711-b9ba6d331df3";

type TemplateCatalogTestProps = {
  draftStore?: {
    create?: (...args: any[]) => Promise<any>;
    list?: (...args: any[]) => Promise<any[]>;
  };
  onNavigate?: (href: string) => void;
  createId?: () => string;
};

const CatalogWithDraftPorts = TemplateCatalog as unknown as ComponentType<TemplateCatalogTestProps>;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("template catalog entry to local composition (MEM-005-AC01, AC09, AC14)", () => {
  it("offers an explicit Usar template action after selection", async () => {
    const user = userEvent.setup();
    render(<TemplateCatalog />);

    expect(screen.queryByRole("button", { name: /usar template/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Single.*1 foto/i }));

    expect(
      screen.getByRole("button", { name: /usar template single/i }),
    ).toBeEnabled();
  });

  it("keeps selection local until the explicit action is used", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<TemplateCatalog />);

    await user.click(screen.getByRole("button", { name: /Single.*1 foto/i }));

    expect(screen.getByText("Selecionado")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates the selected local draft only after explicit confirmation and navigates to it", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const draftStore = {
      create: vi.fn(async (draft: any) => draft),
      list: vi.fn().mockResolvedValue([]),
    };
    const navigate = vi.fn();
    render(<CatalogWithDraftPorts draftStore={draftStore} onNavigate={navigate} createId={() => "82f44972-00f0-4b5c-8711-b9ba6d331df3"} />);

    await user.click(screen.getByRole("button", { name: /Single.*1 foto/i }));
    expect(draftStore.create).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /usar template single/i }));
    await waitFor(() => expect(draftStore.create).toHaveBeenCalledOnce());
    expect(navigate).toHaveBeenCalledWith("/editor/82f44972-00f0-4b5c-8711-b9ba6d331df3");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps the selected template in the catalog and retries when local creation fails", async () => {
    const user = userEvent.setup();
    const draftStore = {
      create: vi
        .fn()
        .mockRejectedValueOnce(new Error("QuotaExceededError"))
        .mockResolvedValueOnce({ id: "82f44972-00f0-4b5c-8711-b9ba6d331df3" }),
      list: vi.fn().mockResolvedValue([]),
    };
    const navigate = vi.fn();
    render(<CatalogWithDraftPorts draftStore={draftStore} onNavigate={navigate} />);

    await user.click(screen.getByRole("button", { name: /Single.*1 foto/i }));
    await user.click(screen.getByRole("button", { name: /usar template single/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível salvar/i);
    expect(screen.getByText("Selecionado")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/editor/82f44972-00f0-4b5c-8711-b9ba6d331df3"));
  });

  it("lists local drafts by newest update and offers Continue", async () => {
    const drafts = {
      list: vi.fn().mockResolvedValue([
        {
          id: newerDraftId,
          createdAt: "2026-10-24T14:00:00.000Z",
          updatedAt: "2026-10-24T15:00:00.000Z",
          document: {
            ...createCompositionDocument(duoTemplate),
          },
        },
        {
          id: olderDraftId,
          createdAt: "2026-10-24T13:00:00.000Z",
          updatedAt: "2026-10-24T14:00:00.000Z",
          document: {
            ...createCompositionDocument(singleTemplate),
          },
        },
      ]),
    };
    const navigate = vi.fn();
    render(<CatalogWithDraftPorts draftStore={drafts} onNavigate={navigate} />);

    const newer = await screen.findByRole("button", { name: /Continuar.*Duo/i });
    const older = screen.getByRole("button", { name: /Continuar.*Single/i });
    expect(newer.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await userEvent.setup().click(newer);
    expect(navigate).toHaveBeenCalledWith(`/editor/${newerDraftId}`);
  });

  it("does not present a storage read failure as an empty list and offers retry", async () => {
    const drafts = {
      list: vi
        .fn()
        .mockRejectedValueOnce(new Error("IndexedDB unavailable"))
        .mockResolvedValueOnce([]),
    };
    render(<CatalogWithDraftPorts draftStore={drafts} />);

    expect(await screen.findByText(/não foi possível carregar seus rascunhos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar carregar rascunhos novamente/i })).toBeInTheDocument();
    expect(screen.queryByText(/nenhum rascunho local/i)).not.toBeInTheDocument();

    await userEvent.setup().click(
      screen.getByRole("button", { name: /tentar carregar rascunhos novamente/i }),
    );
    expect(await screen.findByText(/nenhum rascunho local/i)).toBeInTheDocument();
  });
});
