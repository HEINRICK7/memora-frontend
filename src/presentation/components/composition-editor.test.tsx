import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompositionEditor } from "./composition-editor";
import type { CompositionExportRenderer } from "../../application/compositions/composition-export-renderer";
import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";
import { CompositionExportError } from "../../domain/compositions/composition-export";
import { TEMPLATE_CATALOG_V1 } from "../../domain/templates/template-catalog";

const DRAFT_ID = "82f44972-00f0-4b5c-8711-b9ba6d331df3";
const timestamp = "2026-10-24T15:30:00.000Z";

function makeDraft(templateId = "vibes"): LocalCompositionDraft {
  const template = TEMPLATE_CATALOG_V1.find((item) => item.templateId === templateId);
  const slotIds = template?.slots.map(({ slotId }) => slotId) ?? ["photo-1", "photo-2"];
  return {
    id: DRAFT_ID,
    createdAt: timestamp,
    updatedAt: timestamp,
    document: {
      schemaVersion: 1,
      templateId,
      templateVersion: 1,
      slots: slotIds.map((slotId) => ({
        slotId,
        assetId: null as string | null,
        transform: { x: 0, y: 0, scale: 1, rotation: 0 },
        cropMode: "cover" as const,
      })),
      textLayers: [],
      backgroundColor: "#F8F5EE",
    },
  } as LocalCompositionDraft;
}

function readyPhoto(id: string, previewUrl: string) {
  return {
    id,
    status: "READY" as const,
    contentType: "image/jpeg" as const,
    sizeBytes: 100,
    previewUrl,
    previewExpiresAt: "2099-10-24T16:30:00.000Z",
  };
}

function renderEditor({
  stored = makeDraft(),
  photoPages = [[
    readyPhoto("asset-a", "https://signed.invalid/preview-a"),
    readyPhoto("asset-b", "https://signed.invalid/preview-b"),
  ]],
  exportRenderer,
  save = vi.fn(async (draft: LocalCompositionDraft) => draft),
  navigate = vi.fn(),
}: {
  stored?: ReturnType<typeof makeDraft>;
  photoPages?: Array<ReturnType<typeof readyPhoto>[]>;
  exportRenderer?: CompositionExportRenderer;
  save?: Mock<(draft: LocalCompositionDraft) => Promise<LocalCompositionDraft>>;
  navigate?: Mock<(href: string) => void>;
} = {}) {
  const store = {
    get: vi.fn().mockResolvedValue(stored),
    save,
    list: vi.fn().mockResolvedValue([stored]),
  };
  const photos = {
    listPhotos: vi.fn().mockImplementation(async () => {
      if (photoPages.length > 1) return photoPages.shift() ?? [];
      return photoPages[0] ?? [];
    }),
  };
  const view = render(
    <CompositionEditor
      draftId={DRAFT_ID}
      draftStore={store}
      photoGateway={photos}
      compositionExportRenderer={exportRenderer}
      onNavigate={navigate}
    />,
  );
  return { ...view, store, photos, navigate, stored };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("local composition editor (MEM-005-AC02..16)", () => {
  it("FE-ED-AC01 keeps one compact mobile bar and preserves the selected template canvas ratio", async () => {
    renderEditor({ stored: makeDraft("trip") });

    const mobileBar = await screen.findByRole("group", { name: "Barra do editor" });
    expect(within(mobileBar).getByRole("link", { name: /voltar aos templates/i })).toHaveAttribute(
      "href",
      "/templates",
    );
    expect(within(mobileBar).getByRole("link", { name: /memora/i })).toBeInTheDocument();
    expect(within(mobileBar).getByRole("heading", { name: /trip/i })).toBeInTheDocument();
    expect(mobileBar.querySelector("svg")).not.toBeInTheDocument();
    expect(within(mobileBar).getByText(/salvo/i)).toHaveAttribute("aria-live", "polite");
    const canvas = await screen.findByRole("region", { name: /canvas da composição/i });
    expect(canvas.querySelector(".composition-canvas")?.getAttribute("style")).toContain(
      `--composition-aspect-ratio: ${2 / 3}`,
    );
  });

  it("labels the mobile primary action as the local export it performs", async () => {
    renderEditor();

    await screen.findByRole("button", { name: "Exportar composição" });
    expect(document.querySelector(".composition-export-mobile-label")).toHaveTextContent(
      /^Exportar composição$/,
    );
  });

  it("FE-ED-AC01/02 presents the library, canvas and state in one responsive workspace", async () => {
    renderEditor();

    const workspace = await screen.findByRole("region", { name: "Editor de composição" });
    expect(within(workspace).getByRole("complementary", { name: "Biblioteca de fotografias" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: /canvas da composição/i })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Estado do rascunho" })).toBeInTheDocument();
    expect(Array.from(workspace.children).map((child) => child.className)).toEqual([
      "composition-library",
      "composition-canvas-wrap",
      "composition-side-panel",
      "composition-toolbar",
    ]);
    expect(within(workspace).getByRole("button", { name: /usar fotografia 1 no espaço 1/i })).toBeEnabled();
  });

  it("FE-ED-AC05/06 shows real navigation and explains tools unavailable in document v1", async () => {
    const user = userEvent.setup();
    const { navigate } = renderEditor();

    const tools = await screen.findByRole("navigation", { name: "Ferramentas de composição" });
    const photos = within(tools).getByRole("button", { name: "Fotos" });
    await waitFor(() => expect(photos).toBeEnabled());
    expect(photos).toBeEnabled();
    const layouts = within(tools).getByRole("link", { name: "Layout" });
    expect(layouts).toHaveAttribute("href", "/templates");

    const unavailableTools = ["Texto", "Sticker", "Filtro"];
    for (const name of unavailableTools) {
      const control = within(tools).getByRole("button", { name });
      expect(control).toBeDisabled();
      expect(control).toHaveAccessibleDescription(/ainda não está disponível nesta versão/i);
    }
    const adjustments = screen.getByRole("tablist", { name: "Estilo e ajustes" });
    expect(within(adjustments).getByRole("tab", { name: "Posição" })).toBeDisabled();
    expect(within(adjustments).getByRole("tab", { name: "Posição" })).toHaveAccessibleDescription(
      /ainda não está disponível nesta versão/i,
    );
    const history = screen.getByRole("group", { name: "Histórico da composição" });
    for (const name of ["Desfazer", "Refazer"]) {
      const control = within(history).getByRole("button", { name });
      expect(control).toBeDisabled();
      expect(control).toHaveAccessibleDescription(/ainda não está disponível nesta versão/i);
    }

    await user.click(layouts);
    expect(navigate).toHaveBeenCalledWith("/templates");
    await user.click(photos);
    expect(await screen.findByRole("dialog", { name: /escolher fotografia/i })).toBeInTheDocument();
  });

  it("uses only a READY library photo and persists its asset id in the targeted slot", async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();
    const library = await screen.findByRole("complementary", { name: "Biblioteca de fotografias" });
    await user.click(within(library).getByRole("button", { name: /usar fotografia 1 no espaço 1/i }));

    await waitFor(() => expect(store.save).toHaveBeenCalledOnce());
    expect(store.save.mock.calls[0][0].document.slots[0].assetId).toBe("asset-a");
    expect(screen.getByRole("img", { name: /fotografia no espaço 1/i })).toHaveAttribute(
      "src",
      "https://signed.invalid/preview-a",
    );
  });

  it("FE-ED-AC08 gives keyboard access to compact slot actions with accessible names", async () => {
    const stored = makeDraft("poster");
    stored.document.slots[0].assetId = "asset-a";
    renderEditor({ stored });

    const slot = await screen.findByRole("group", { name: "Foto no espaço 1" });
    expect(slot).toHaveAttribute("tabindex", "0");
    expect(slot).not.toHaveClass("composition-slot-active");
    fireEvent.focus(slot);
    expect(slot).toHaveClass("composition-slot-active");
    const replace = within(slot).getByRole("button", { name: "Substituir foto no espaço 1" });
    const remove = within(slot).getByRole("button", { name: "Remover foto do espaço 1" });
    expect(replace.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    expect(remove.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("reveals controls only after a photo slot is tapped and keeps one slot active", async () => {
    const stored = makeDraft("trip");
    stored.document.slots[0]!.assetId = "asset-a";
    stored.document.slots[1]!.assetId = "asset-b";
    renderEditor({ stored });

    const firstSlot = await screen.findByRole("group", { name: "Foto no espaço 1" });
    const secondSlot = await screen.findByRole("group", { name: "Foto no espaço 2" });
    expect(firstSlot).not.toHaveClass("composition-slot-active");
    expect(secondSlot).not.toHaveClass("composition-slot-active");

    fireEvent.click(firstSlot);
    expect(firstSlot).toHaveClass("composition-slot-active");
    expect(secondSlot).not.toHaveClass("composition-slot-active");

    fireEvent.click(secondSlot);
    expect(firstSlot).not.toHaveClass("composition-slot-active");
    expect(secondSlot).toHaveClass("composition-slot-active");
  });

  it("opens a stored grid-six draft as grid and rewrites the saved id", async () => {
    const stored = makeDraft("grid");
    stored.document.templateId = "grid-six";
    const save = vi.fn(async (draft: LocalCompositionDraft) => draft);
    renderEditor({ stored, save });

    expect(await screen.findByRole("heading", { name: /^grid$/i })).toBeInTheDocument();
    expect(screen.queryByText(/grid 6/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/composição local/i)).not.toBeInTheDocument();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]?.[0].document.templateId).toBe("grid");
  });

  it("restores the local document and shows template geometry and empty slots", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { store } = renderEditor();

    expect(await screen.findByRole("heading", { name: /vibes/i })).toBeInTheDocument();
    expect(screen.getByText(/proporção 4:3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /escolher foto para espaço 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /escolher foto para espaço 2/i })).toBeInTheDocument();
    expect(store.get).toHaveBeenCalledWith(DRAFT_ID);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lists READY photos, assigns one to a slot, and persists only the asset id", async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();

    await user.click(await screen.findByRole("button", { name: /escolher foto para espaço 1/i }));
    const chooser = await screen.findByRole("dialog", { name: /escolher fotografia/i });
    expect(within(chooser).getByRole("img", { name: /prévia da fotografia 1/i })).toHaveAttribute(
      "src",
      "https://signed.invalid/preview-a",
    );

    await user.click(within(chooser).getByRole("button", { name: /usar fotografia 1/i }));

    await waitFor(() => expect(store.save).toHaveBeenCalledOnce());
    const saved = store.save.mock.calls[0][0];
    expect(saved.document.slots[0].assetId).toBe("asset-a");
    expect(JSON.stringify(saved)).not.toContain("signed.invalid");
    expect(screen.getByRole("img", { name: /fotografia no espaço 1/i })).toHaveAttribute(
      "src",
      "https://signed.invalid/preview-a",
    );
  });

  it("shows a real empty-library state with a path back to the photo gallery", async () => {
    renderEditor({ photoPages: [[]] });

    await userEvent.setup().click(
      await screen.findByRole("button", { name: /escolher foto para espaço 1/i }),
    );
    const chooser = await screen.findByRole("dialog", { name: /escolher fotografia/i });
    expect(within(chooser).getByText(/nenhuma fotografia guardada/i)).toBeInTheDocument();
    expect(within(chooser).getByRole("link", { name: /voltar à galeria/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(chooser).queryByRole("img")).not.toBeInTheDocument();
    expect(within(chooser).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("separates a photo API failure from an empty library and retries without losing the draft", async () => {
    const user = userEvent.setup();
    const pages: Array<unknown> = [new Error("offline"), [readyPhoto("asset-a", "https://signed.invalid/retry")]];
    const store = {
      get: vi.fn().mockResolvedValue(makeDraft()),
      save: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
    };
    const photos = {
      listPhotos: vi.fn().mockImplementation(async () => {
        const page = pages.shift();
        if (page instanceof Error) throw page;
        return page;
      }),
    };
    render(
      <CompositionEditor draftId={DRAFT_ID} draftStore={store} photoGateway={photos} onNavigate={vi.fn()} />,
    );

    await user.click(await screen.findByRole("button", { name: /escolher foto para espaço 1/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.queryByText(/nenhuma fotografia guardada/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /tentar carregar fotografias novamente/i }));
    expect(await screen.findByRole("img", { name: /prévia da fotografia 1/i })).toBeInTheDocument();
    expect(store.save).not.toHaveBeenCalled();
  });

  it("keeps deleted asset ids and marks only unavailable slots for recovery", async () => {
    const stored = makeDraft();
    stored.document.slots[0].assetId = "asset-deleted";
    stored.document.slots[1].assetId = "asset-a";
    const { store } = renderEditor({ stored });

    expect(await screen.findByText(/foto indisponível/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remover foto do espaço 1/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /fotografia no espaço 2/i })).toHaveAttribute(
      "src",
      "https://signed.invalid/preview-a",
    );
    expect(stored.document.slots.map((slot) => slot.assetId)).toEqual([
      "asset-deleted",
      "asset-a",
    ]);
    expect(store.save).not.toHaveBeenCalled();
  });

  it("refreshes an expired preview without changing asset association", async () => {
    const stored = makeDraft("poster");
    stored.document.slots[0].assetId = "asset-a";
    const { photos, store } = renderEditor({
      stored,
      photoPages: [
        [readyPhoto("asset-a", "https://signed.invalid/expired")],
        [readyPhoto("asset-a", "https://signed.invalid/renewed")],
      ],
    });

    expect(await screen.findByRole("img", { name: /fotografia no espaço 1/i })).toHaveAttribute(
      "src",
      "https://signed.invalid/expired",
    );
    fireEvent.error(screen.getByRole("img", { name: /fotografia no espaço 1/i }));
    await userEvent.setup().click(
      await screen.findByRole("button", { name: /atualizar fotografias/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole("img", { name: /fotografia no espaço 1/i })).toHaveAttribute(
        "src",
        "https://signed.invalid/renewed",
      ),
    );
    expect(stored.document.slots[0].assetId).toBe("asset-a");
    expect(store.save).not.toHaveBeenCalled();
    expect(photos.listPhotos).toHaveBeenCalledTimes(2);
  });

  it("preserves failed edits in memory, retries storage, and confirms internal navigation", async () => {
    const user = userEvent.setup();
    const failure = new Error("QuotaExceededError");
    const save = vi.fn().mockRejectedValueOnce(failure).mockImplementation(async (draft) => draft);
    const navigate = vi.fn();
    const { store, container } = renderEditor({ save, navigate });

    await user.click(await screen.findByRole("button", { name: /escolher foto para espaço 1/i }));
    const chooser = await screen.findByRole("dialog", { name: /escolher fotografia/i });
    await user.click(within(chooser).getByRole("button", { name: /usar fotografia 1/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/alteração ainda não foi salva/i);
    expect(screen.getByRole("button", { name: /tentar salvar novamente/i })).toBeInTheDocument();
    const backToCatalog = within(container.querySelector(".composition-editor-bar")!).getByRole("link", {
      name: /voltar aos templates/i,
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(backToCatalog);
    expect(confirm).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: /Memora, início/i }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(navigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /tentar salvar novamente/i }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(store.save).toHaveBeenCalledTimes(2);
  });

  it("warns before unload when an edit is still not persisted", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockRejectedValue(new Error("IndexedDB unavailable"));
    renderEditor({ save });
    await user.click(await screen.findByRole("button", { name: /escolher foto para espaço 1/i }));
    await user.click(
      within(await screen.findByRole("dialog", { name: /escolher fotografia/i })).getByRole(
        "button",
        { name: /usar fotografia 1/i },
      ),
    );
    await screen.findByText(/não foi salva neste navegador/i);

    const event = new Event("beforeunload", { cancelable: true });
    const prevented = !window.dispatchEvent(event);
    expect(prevented || event.defaultPrevented).toBe(true);
  });

  it("shows recovery for an incompatible stored document without rendering or overwriting it", async () => {
    const stored = makeDraft();
    stored.document.slots[0].transform.scale = 2;
    const { store } = renderEditor({ stored });

    expect(await screen.findByRole("heading", { name: /rascunho incompatível/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /escolher outro template/i })).toHaveAttribute(
      "href",
      "/templates",
    );
    expect(screen.queryByRole("img", { name: /fotografia no espaço/i })).not.toBeInTheDocument();
    expect(store.save).not.toHaveBeenCalled();
    expect(stored.document.slots[0].transform.scale).toBe(2);
  });
});

describe("composition export controls (MEM-007-AC03, AC11, AC13, AC15)", () => {
  it("keeps export disabled until every photo slot is ready", async () => {
    renderEditor({ stored: makeDraft("poster") });

    const exportButton = await screen.findByRole("button", { name: /exportar composição/i });
    expect(exportButton).toBeDisabled();
    expect(screen.getByText(/preencha todos os espaços/i)).toBeInTheDocument();
  });

  it("exports locally, downloads the selected format, and leaves the local draft unchanged", async () => {
    const user = userEvent.setup();
    const stored = makeDraft("poster");
    stored.document.slots[0]!.assetId = "asset-a";
    const renderer: CompositionExportRenderer = {
      render: vi.fn().mockResolvedValue({
        blob: new Blob(["local-image"], { type: "image/png" }),
        mimeType: "image/png",
        width: 1600,
        height: 1600,
        fileName: "memora-poster.png",
      }),
    };
    const original = JSON.stringify(stored);
    const { photos, store } = renderEditor({
      stored,
      photoPages: [
        [readyPhoto("asset-a", "https://signed.invalid/preview-a")],
        [readyPhoto("asset-a", "https://signed.invalid/preview-current")],
      ],
      exportRenderer: renderer,
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:memora-export"),
      revokeObjectURL: vi.fn(),
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await user.selectOptions(await screen.findByLabelText(/formato da imagem/i), "image/png");
    await user.click(screen.getByRole("button", { name: /exportar composição/i }));

    await waitFor(() => expect(renderer.render).toHaveBeenCalledOnce());
    expect(photos.listPhotos).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(/exportação concluída/i);
    expect(JSON.stringify(stored)).toBe(original);
    expect(store.save).not.toHaveBeenCalled();
  });

  it("aborts the render and never starts a download after cancellation", async () => {
    const user = userEvent.setup();
    const stored = makeDraft("poster");
    stored.document.slots[0]!.assetId = "asset-a";
    let renderSignal: AbortSignal | undefined;
    const renderer: CompositionExportRenderer = {
      render: vi.fn(({ signal }: { signal: AbortSignal }) => {
        renderSignal = signal;
        return new Promise<never>(() => {});
      }),
    };
    const { store } = renderEditor({
      stored,
      photoPages: [
        [readyPhoto("asset-a", "https://signed.invalid/preview-a")],
        [readyPhoto("asset-a", "https://signed.invalid/preview-current")],
      ],
      exportRenderer: renderer,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await user.click(await screen.findByRole("button", { name: /exportar composição/i }));
    const cancel = await screen.findByRole("button", { name: /cancelar exportação/i });
    await user.click(cancel);

    expect(renderSignal?.aborted).toBe(true);
    expect(await screen.findByRole("status")).toHaveTextContent(/exportação cancelada/i);
    expect(click).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
  });

  it("shows a recoverable error and retains the export action when Canvas fails", async () => {
    const user = userEvent.setup();
    const stored = makeDraft("poster");
    stored.document.slots[0]!.assetId = "asset-a";
    const renderer: CompositionExportRenderer = {
      render: vi.fn().mockRejectedValue(Object.assign(new Error("tainted"), { code: "CANVAS_CORS" })),
    };
    renderEditor({
      stored,
      photoPages: [
        [readyPhoto("asset-a", "https://signed.invalid/preview-a")],
        [readyPhoto("asset-a", "https://signed.invalid/preview-current")],
      ],
      exportRenderer: renderer,
    });

    await user.click(await screen.findByRole("button", { name: /exportar composição/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível exportar/i);
    expect(screen.getByRole("button", { name: /exportar composição/i })).toBeEnabled();
  });

  it("identifies low-resolution slots and opens the photo chooser for a higher-resolution replacement", async () => {
    const user = userEvent.setup();
    const stored = makeDraft("poster");
    stored.document.slots[0]!.assetId = "asset-a";
    const renderer: CompositionExportRenderer = {
      render: vi.fn().mockRejectedValue(new CompositionExportError(
        "INSUFFICIENT_SOURCE_RESOLUTION",
        "Fonte pequena.",
        { slotIds: ["photo-1"], assetIds: ["asset-a"] },
      )),
    };
    renderEditor({
      stored,
      photoPages: [
        [readyPhoto("asset-a", "https://signed.invalid/preview-a")],
        [readyPhoto("asset-a", "https://signed.invalid/current-a")],
        [readyPhoto("asset-b", "https://signed.invalid/larger-b")],
      ],
      exportRenderer: renderer,
    });

    await user.click(await screen.findByRole("button", { name: /exportar composição/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/fotografia no espaço 1 precisa ter resolução maior/i);
    await user.click(within(alert).getByRole("button", {
      name: /escolher foto com maior resolução no espaço 1/i,
    }));
    expect(await screen.findByRole("dialog", { name: /escolher fotografia/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /prévia da fotografia 1/i })).toHaveAttribute(
      "src",
      "https://signed.invalid/larger-b",
    );
  });
});
