import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MuralAccessGateway, ViewGrant } from "../../application/mural-gateway";
import { ShareGrantsPanel } from "./share-grants-panel";

const MURAL_ID = "c0f5f693-7160-4e49-9d76-cfaba4edce1c";
const SHARE_URL = "http://127.0.0.1:18080/m/secret-token-once";

const LISTED: ViewGrant = {
  grantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  scope: "VIEW",
  status: "ACTIVE",
  createdAt: "2026-10-25T12:00:00.000Z",
  expiresAt: null,
  revokedAt: null,
};

function gateway(): MuralAccessGateway {
  return {
    createDraft: vi.fn(),
    listMurals: vi.fn(),
    getMural: vi.fn().mockResolvedValue({
      id: MURAL_ID,
      status: "PUBLISHED",
      version: 4,
      title: "summer 26",
      description: null,
      coverPhotoId: "11111111-1111-4111-8111-111111111111",
      createdAt: "2026-10-25T12:00:00.000Z",
      updatedAt: "2026-10-25T12:00:00.000Z",
    }),
    updateMural: vi.fn(),
    listMuralPhotos: vi.fn().mockResolvedValue({
      muralVersion: 4,
      items: [
        {
          photoId: "11111111-1111-4111-8111-111111111111",
          position: 0,
          contentType: "image/jpeg",
          sizeBytes: 10,
          previewUrl: "http://localhost/cover.jpg",
          previewExpiresAt: "2026-10-25T12:05:00.000Z",
        },
      ],
    }),
    attachPhoto: vi.fn(),
    reorderPhotos: vi.fn(),
    removePhoto: vi.fn(),
    publishMural: vi.fn(),
    createViewGrant: vi.fn(),
    listViewGrants: vi.fn().mockResolvedValue([LISTED]),
    revokeViewGrant: vi.fn(),
    getSharedMural: vi.fn(),
    submitContribution: vi.fn(),
    listContributions: vi.fn(),
    approveContribution: vi.fn(),
    rejectContribution: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ShareGrantsPanel", () => {
  it("copies the share URL from the first response without rebuilding it", async () => {
    const access = gateway();
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    access.createViewGrant = vi.fn().mockResolvedValue({
      ...LISTED,
      shareUrl: SHARE_URL,
      tokenReturned: true,
      replayed: false,
    });
    render(<ShareGrantsPanel muralId={MURAL_ID} gateway={access} />);
    await user.click(await screen.findByRole("button", { name: "Criar link de visualização" }));

    const field = await screen.findByRole("textbox", { name: "link de visualização" });
    expect(field).toHaveValue(SHARE_URL);
    await user.click(screen.getByRole("button", { name: "copiar link" }));
    expect(writeText).toHaveBeenCalledWith(SHARE_URL);
    expect(screen.getByRole("heading", { name: "tá no ar!" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar link de colaboração" })).not.toBeInTheDocument();
  });

  it("does not show or store the secret from a replay or the grant list", async () => {
    const access = gateway();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    access.listViewGrants = vi.fn().mockResolvedValue([
      { ...LISTED, shareUrl: SHARE_URL, tokenReturned: false },
    ]);
    access.createViewGrant = vi.fn().mockResolvedValue({
      ...LISTED,
      shareUrl: SHARE_URL,
      tokenReturned: false,
      replayed: true,
    });
    render(<ShareGrantsPanel muralId={MURAL_ID} gateway={access} />);
    const user = userEvent.setup();
    expect(await screen.findByText("Visualização")).toBeInTheDocument();
    expect(screen.queryByText(SHARE_URL)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar link de visualização" }));

    expect(await screen.findByRole("status")).toHaveTextContent("não pode ser recuperado");
    expect(screen.queryByRole("textbox", { name: "link de visualização" })).not.toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("keeps the link available when native share is cancelled", async () => {
    const access = gateway();
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    access.createViewGrant = vi.fn().mockResolvedValue({
      ...LISTED,
      shareUrl: SHARE_URL,
      tokenReturned: true,
      replayed: false,
    });
    render(<ShareGrantsPanel muralId={MURAL_ID} gateway={access} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Criar link de visualização" }));
    await user.click(await screen.findByRole("button", { name: "compartilhar" }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({ url: SHARE_URL });
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "link de visualização" })).toHaveValue(SHARE_URL);
  });

  it("explains how to copy when the clipboard is unavailable", async () => {
    const access = gateway();
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    access.createViewGrant = vi.fn().mockResolvedValue({
      ...LISTED,
      shareUrl: SHARE_URL,
      tokenReturned: true,
      replayed: false,
    });
    render(<ShareGrantsPanel muralId={MURAL_ID} gateway={access} />);
    await user.click(await screen.findByRole("button", { name: "Criar link de visualização" }));
    await user.click(await screen.findByRole("button", { name: "copiar link" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Selecione o link no campo");
    expect(screen.getByRole("textbox", { name: "link de visualização" })).toHaveValue(SHARE_URL);
  });
});
