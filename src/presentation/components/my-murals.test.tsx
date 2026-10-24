import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyMurals } from "./my-murals";

type MuralStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type MuralSummary = {
  id: string;
  status: MuralStatus;
  version: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
type MuralPage = { items: MuralSummary[]; nextCursor: string | null };

const MURALS: MuralSummary[] = [
  {
    id: "c0f5f693-7160-4e49-9d76-cfaba4edce1c",
    status: "DRAFT",
    version: 1,
    title: "Aniversário da Sofia",
    description: null,
    createdAt: "2026-10-24T12:00:00Z",
    updatedAt: "2026-10-24T12:00:00Z",
  },
  {
    id: "d0f5f693-7160-4e49-9d76-cfaba4edce1c",
    status: "PUBLISHED",
    version: 2,
    title: "Viagem em família",
    description: "Lembranças",
    createdAt: "2026-10-23T12:00:00Z",
    updatedAt: "2026-10-23T12:00:00Z",
  },
  {
    id: "e0f5f693-7160-4e49-9d76-cfaba4edce1c",
    status: "ARCHIVED",
    version: 3,
    title: "Férias",
    description: null,
    createdAt: "2026-10-22T12:00:00Z",
    updatedAt: "2026-10-22T12:00:00Z",
  },
];

function createGateway(initialPage: MuralPage = { items: [], nextCursor: null }) {
  return {
    listMurals: vi.fn().mockResolvedValue(initialPage),
    createDraft: vi.fn().mockResolvedValue(MURALS[0]),
    getMural: vi.fn(),
  };
}

afterEach(() => cleanup());

describe("MyMurals (MEM-002-AC11..16)", () => {
  it("announces the empty state and offers draft creation", async () => {
    const gateway = createGateway();
    render(<MyMurals gateway={gateway} />);

    expect(await screen.findByText(/nenhum mural|ainda não criou/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/nenhum mural|ainda não criou/i);
    expect(screen.getByLabelText("Nome do mural")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar rascunho/i })).toBeInTheDocument();
  });

  it("marks the initial list as busy and announces loading", () => {
    const gateway = createGateway();
    gateway.listMurals.mockReturnValue(new Promise(() => undefined));
    render(<MyMurals gateway={gateway} />);

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(/carregando/i);
  });

  it("offers retry after a list failure without showing an empty collection", async () => {
    const gateway = createGateway();
    gateway.listMurals.mockRejectedValueOnce(new Error("service unavailable"));
    render(<MyMurals gateway={gateway} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
    expect(screen.queryByText(/nenhum mural|ainda não criou/i)).not.toBeInTheDocument();
  });

  it("shows an unavailable-access state for 401 without promising login", async () => {
    const gateway = createGateway();
    gateway.listMurals.mockRejectedValueOnce(
      Object.assign(new Error("unauthorized"), { status: 401 }),
    );
    render(<MyMurals gateway={gateway} />);

    expect(await screen.findByText(/acesso indisponível/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/acesso indisponível/i);
    expect(screen.queryByRole("button", { name: /entrar|login/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/nenhum mural|ainda não criou/i)).not.toBeInTheDocument();
  });

  it("associates a 422 title error with its labeled field and preserves entered text", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    gateway.createDraft.mockRejectedValueOnce(
      Object.assign(new Error("Nome inválido"), {
        status: 422,
        field: "title",
        code: "invalid_mural_title",
      }),
    );
    render(<MyMurals gateway={gateway} />);

    const title = screen.getByLabelText("Nome do mural");
    await user.type(title, "Aniversário da Sofia");
    await user.click(screen.getByRole("button", { name: /criar rascunho/i }));

    await waitFor(() => expect(title).toHaveAttribute("aria-invalid", "true"));
    expect(title).toHaveAccessibleDescription(/nome do mural/i);
    expect(title).toHaveValue("Aniversário da Sofia");
  });

  it("maps a 422 description error to the optional description field", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    gateway.createDraft.mockRejectedValueOnce(
      Object.assign(new Error("Descrição inválida"), {
        status: 422,
        field: "description",
        code: "invalid_mural_description",
      }),
    );
    render(<MyMurals gateway={gateway} />);

    await user.type(screen.getByLabelText("Nome do mural"), "Viagem");
    const description = screen.getByLabelText("Descrição (opcional)");
    await user.type(description, "Uma lembrança especial");
    await user.click(screen.getByRole("button", { name: /criar rascunho/i }));

    await waitFor(() => expect(description).toHaveAttribute("aria-invalid", "true"));
    expect(description).toHaveAccessibleDescription(/descrição/i);
    expect(description).toHaveValue("Uma lembrança especial");
  });

  it("retries an ambiguous create with the same key and rotates it when text changes", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    gateway.createDraft
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(MURALS[0]);
    render(<MyMurals gateway={gateway} />);

    const title = screen.getByLabelText("Nome do mural");
    await user.type(title, "  Aniversário  ");
    await user.click(screen.getByRole("button", { name: /criar rascunho/i }));
    await user.click(await screen.findByRole("button", { name: /tentar novamente/i }));

    const firstKey = gateway.createDraft.mock.calls[0]?.[1];
    const retryKey = gateway.createDraft.mock.calls[1]?.[1];
    expect(firstKey).toMatch(/^[0-9a-f-]{36}$/i);
    expect(retryKey).toBe(firstKey);
    expect(gateway.createDraft.mock.calls[0]?.[0]).toEqual({
      title: "Aniversário",
      description: null,
    });

    await user.clear(title);
    await user.type(title, "Viagem");
    await user.click(screen.getByRole("button", { name: /criar rascunho/i }));
    expect(gateway.createDraft.mock.calls[2]?.[1]).not.toBe(firstKey);
  });

  it("adds a successful draft to the top and announces success without fake editor actions", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: [MURALS[1]], nextCursor: null });
    gateway.createDraft.mockResolvedValueOnce(MURALS[0]);
    render(<MyMurals gateway={gateway} />);

    await user.type(screen.getByLabelText("Nome do mural"), "Aniversário da Sofia");
    await user.click(screen.getByRole("button", { name: /criar rascunho/i }));

    expect(await screen.findByText(/rascunho criado/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/rascunho criado/i);
    expect(screen.getAllByText(/aniversário da sofia/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Rascunho", { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar|publicar/i })).not.toBeInTheDocument();
  });

  it("switches from a paginated Published filter to the first Draft page after creation", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: [MURALS[1]], nextCursor: null });
    gateway.listMurals
      .mockResolvedValueOnce({ items: MURALS, nextCursor: null })
      .mockResolvedValueOnce({ items: [MURALS[1]], nextCursor: "published-cursor-1" })
      .mockResolvedValueOnce({ items: [MURALS[1]], nextCursor: "published-cursor-2" })
      .mockResolvedValueOnce({ items: [MURALS[0]], nextCursor: null });
    gateway.createDraft.mockResolvedValueOnce(MURALS[0]);
    render(<MyMurals gateway={gateway} />);

    await user.click(await screen.findByRole("button", { name: "Publicados" }));
    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));
    expect(gateway.listMurals).toHaveBeenLastCalledWith({
      limit: 20,
      status: "PUBLISHED",
      cursor: "published-cursor-1",
    });

    await user.type(screen.getByLabelText("Nome do mural"), "Aniversário da Sofia");
    await user.click(screen.getByRole("button", { name: /criar rascunho/i }));

    expect(await screen.findByText(/rascunho criado/i)).toBeInTheDocument();
    const drafts = screen.getByRole("button", { name: "Rascunhos" });
    expect(drafts).toHaveAttribute("aria-pressed", "true");
    expect(gateway.listMurals).toHaveBeenLastCalledWith({
      limit: 20,
      status: "DRAFT",
    });
    expect(screen.getByText("Aniversário da Sofia")).toBeInTheDocument();
  });

  it("does not send duplicate create calls while the POST is pending", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    let resolveCreate!: (mural: MuralSummary) => void;
    gateway.createDraft.mockImplementation(
      () => new Promise((resolve) => (resolveCreate = resolve)),
    );
    render(<MyMurals gateway={gateway} />);

    await user.type(screen.getByLabelText("Nome do mural"), "Aniversário da Sofia");
    const submit = screen.getByRole("button", { name: /criar rascunho/i });
    await user.click(submit);

    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(gateway.createDraft).toHaveBeenCalledTimes(1);

    resolveCreate(MURALS[0]);
    expect(await screen.findByText(/rascunho criado/i)).toBeInTheDocument();
    expect(gateway.createDraft).toHaveBeenCalledTimes(1);
  });

  it("exposes filters programmatically and renders each status as text", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: MURALS, nextCursor: null });
    render(<MyMurals gateway={gateway} />);

    const all = await screen.findByRole("button", { name: "Todos" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText("Arquivado")).toBeInTheDocument();

    const published = screen.getByRole("button", { name: "Publicados" });
    await user.click(published);

    expect(published).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(gateway.listMurals).toHaveBeenLastCalledWith({ limit: 20, status: "PUBLISHED" });
  });

  it("loads the next page once, appends items, and preserves focus on Load more", async () => {
    const user = userEvent.setup();
    const nextPage: MuralPage = { items: [MURALS[1]], nextCursor: "cursor-next" };
    const gateway = createGateway({ items: [MURALS[0]], nextCursor: "cursor-first" });
    gateway.listMurals.mockResolvedValueOnce({ items: [MURALS[0]], nextCursor: "cursor-first" });
    gateway.listMurals.mockResolvedValueOnce(nextPage);
    render(<MyMurals gateway={gateway} />);

    const loadMore = await screen.findByRole("button", { name: "Carregar mais" });
    await user.click(loadMore);

    expect(await screen.findByText("Viagem em família")).toBeInTheDocument();
    expect(gateway.listMurals).toHaveBeenLastCalledWith({ limit: 20, cursor: "cursor-first" });
    expect(document.activeElement).toBe(loadMore);
    expect(screen.getByText("Aniversário da Sofia")).toBeInTheDocument();
  });

  it("moves focus to the mural results when the final page removes Load more", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: [MURALS[0]], nextCursor: "cursor-first" });
    gateway.listMurals
      .mockResolvedValueOnce({ items: [MURALS[0]], nextCursor: "cursor-first" })
      .mockResolvedValueOnce({ items: [MURALS[1]], nextCursor: null });
    render(<MyMurals gateway={gateway} />);

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Viagem em família")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(
      screen.getByRole("list", { name: "Lista de murais" }),
    );
  });

  it("keeps a focus target in the empty state after an empty final page", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: [], nextCursor: "cursor-first" });
    gateway.listMurals
      .mockResolvedValueOnce({ items: [], nextCursor: "cursor-first" })
      .mockResolvedValueOnce({ items: [], nextCursor: null });
    render(<MyMurals gateway={gateway} />);

    expect(await screen.findByText("Você ainda não criou nenhum mural.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Carregar mais" }));

    const emptyResults = screen.getByRole("region", {
      name: "Você ainda não criou nenhum mural.",
    });
    await waitFor(() => expect(document.activeElement).toBe(emptyResults));
    expect(emptyResults).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("preserves the current page and retries next-page failure with the same cursor", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: [MURALS[0]], nextCursor: "cursor-first" });
    gateway.listMurals
      .mockResolvedValueOnce({ items: [MURALS[0]], nextCursor: "cursor-first" })
      .mockRejectedValueOnce(new Error("service unavailable"))
      .mockResolvedValueOnce({ items: [MURALS[1]], nextCursor: null });
    render(<MyMurals gateway={gateway} />);

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.getByText("Aniversário da Sofia")).toBeInTheDocument();
    expect(screen.queryByText("Viagem em família")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(await screen.findByText("Viagem em família")).toBeInTheDocument();
    expect(gateway.listMurals.mock.calls[1]?.[0]).toEqual({
      limit: 20,
      cursor: "cursor-first",
    });
    expect(gateway.listMurals.mock.calls[2]?.[0]).toEqual({
      limit: 20,
      cursor: "cursor-first",
    });
  });

  it("resets pagination when the selected status changes", async () => {
    const user = userEvent.setup();
    const gateway = createGateway({ items: [MURALS[0]], nextCursor: "cursor-first" });
    render(<MyMurals gateway={gateway} />);

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));
    await user.click(screen.getByRole("button", { name: "Arquivados" }));

    expect(gateway.listMurals).toHaveBeenLastCalledWith({ limit: 20, status: "ARCHIVED" });
  });
});
