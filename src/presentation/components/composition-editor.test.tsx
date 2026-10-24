import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompositionEditor } from "./composition-editor";

const DRAFT_ID = "82f44972-00f0-4b5c-8711-b9ba6d331df3";
const timestamp = "2026-10-24T15:30:00.000Z";

function makeDraft(templateId = "duo-side-by-side") {
  const slotIds = templateId === "single-photo" ? ["photo-1"] : ["photo-1", "photo-2"];
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
  };
}

function readyPhoto(id: string, previewUrl: string) {
  return {
    id,
    status: "READY" as const,
    contentType: "image/jpeg" as const,
    sizeBytes: 100,
    previewUrl,
    previewExpiresAt: "2026-10-24T16:30:00.000Z",
  };
}

function renderEditor({
  stored = makeDraft(),
  photoPages = [[
    readyPhoto("asset-a", "https://signed.invalid/preview-a"),
    readyPhoto("asset-b", "https://signed.invalid/preview-b"),
  ]],
  save = vi.fn(async (draft) => draft),
  navigate = vi.fn(),
} = {}) {
  const store = {
    get: vi.fn().mockResolvedValue(stored),
    save,
    list: vi.fn().mockResolvedValue([stored]),
  };
  const photos = {
    listPhotos: vi.fn().mockImplementation(async () => photoPages.shift() ?? []),
  };
  const view = render(
    <CompositionEditor
      draftId={DRAFT_ID}
      draftStore={store}
      photoGateway={photos}
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
  it("restores the local document and shows template geometry and empty slots", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { store } = renderEditor();

    expect(await screen.findByRole("heading", { name: /duo/i })).toBeInTheDocument();
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
    const stored = makeDraft("single-photo");
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
    const { store } = renderEditor({ save, navigate });

    await user.click(await screen.findByRole("button", { name: /escolher foto para espaço 1/i }));
    const chooser = await screen.findByRole("dialog", { name: /escolher fotografia/i });
    await user.click(within(chooser).getByRole("button", { name: /usar fotografia 1/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/alteração ainda não foi salva/i);
    expect(screen.getByRole("button", { name: /tentar salvar novamente/i })).toBeInTheDocument();
    const backToCatalog = screen.getByRole("link", { name: /voltar aos templates/i });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(backToCatalog);
    expect(confirm).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: /^Início$/ }));
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
