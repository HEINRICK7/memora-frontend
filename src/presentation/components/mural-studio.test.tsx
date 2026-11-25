import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MuralAccessGateway, MuralPhotoItem, MuralSummary } from "../../application/mural-gateway";
import { MuralGatewayError } from "../../application/mural-gateway";
import { MuralStudio } from "./mural-studio";

const MURAL: MuralSummary = {
  id: "c0f5f693-7160-4e49-9d76-cfaba4edce1c",
  status: "DRAFT",
  version: 2,
  title: "Festa",
  description: null,
  createdAt: "2026-10-24T12:00:00Z",
  updatedAt: "2026-10-24T12:00:00Z",
};

const PHOTOS: MuralPhotoItem[] = [
  {
    photoId: "11111111-1111-4111-8111-111111111111",
    position: 0,
    contentType: "image/jpeg",
    sizeBytes: 10,
    previewUrl: "http://localhost/a.jpg",
    previewExpiresAt: "2026-10-24T12:05:00Z",
  },
  {
    photoId: "22222222-2222-4222-8222-222222222222",
    position: 1,
    contentType: "image/jpeg",
    sizeBytes: 10,
    previewUrl: "http://localhost/b.jpg",
    previewExpiresAt: "2026-10-24T12:05:00Z",
  },
];

function gateway(): MuralAccessGateway {
  return {
    createDraft: vi.fn(),
    listMurals: vi.fn(),
    getMural: vi.fn().mockResolvedValue(MURAL),
    updateMural: vi.fn(),
    listMuralPhotos: vi.fn().mockResolvedValue({ muralVersion: 2, items: PHOTOS }),
    attachPhoto: vi.fn(),
    reorderPhotos: vi.fn().mockResolvedValue(3),
    removePhoto: vi.fn(),
    publishMural: vi.fn(),
    createViewGrant: vi.fn(),
    listViewGrants: vi.fn(),
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
});

describe("MuralStudio", () => {
  it("sends the confirmed photo order", async () => {
    const access = gateway();
    render(<MuralStudio muralId={MURAL.id} gateway={access} loadLibrary={async () => []} />);
    const user = userEvent.setup();
    const moveUp = await screen.findAllByRole("button", { name: "Subir" });
    const enabled = moveUp.find((button) => !button.hasAttribute("disabled"));
    await user.click(enabled!);

    await waitFor(() => {
      expect(access.reorderPhotos).toHaveBeenCalledWith(
        MURAL.id,
        [PHOTOS[1]!.photoId, PHOTOS[0]!.photoId],
        MURAL.version,
      );
    });
  });

  it("keeps the unsaved title when the version conflicts", async () => {
    const access = gateway();
    access.updateMural = vi.fn().mockRejectedValue(new MuralGatewayError({
      message: "conflito",
      status: 409,
      code: "stale_mural_version",
    }));
    render(<MuralStudio muralId={MURAL.id} gateway={access} loadLibrary={async () => []} />);
    const user = userEvent.setup();
    const name = await screen.findByLabelText("nome do mural");
    await user.clear(name);
    await user.type(name, "Outro nome");
    await user.click(screen.getByRole("button", { name: "salvar mudanças" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("O mural mudou");
    });
    expect(name).toHaveValue("Outro nome");
    expect(access.getMural).toHaveBeenCalledTimes(2);
  });

  it("keeps audience as a local intention and does not publish or create a link", async () => {
    const access = gateway();
    render(<MuralStudio muralId={MURAL.id} gateway={access} loadLibrary={async () => []} />);
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "publicar mural" });
    await user.click(screen.getByRole("radio", { name: /quem tem link/i }));

    expect(access.publishMural).not.toHaveBeenCalled();
    expect(access.createViewGrant).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: /permitir fotos de amigos/i })).toBeDisabled();
  });

  it("does not publish when the confirmation is cancelled", async () => {
    const access = gateway();
    render(<MuralStudio muralId={MURAL.id} gateway={access} loadLibrary={async () => []} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "publicar mural" }));
    expect(screen.getByRole("dialog", { name: "confirmar publicação" })).toHaveTextContent(
      "Publicar não cria um link",
    );
    await user.click(screen.getByRole("button", { name: "Cancelar publicação" }));

    expect(access.publishMural).not.toHaveBeenCalled();
    expect(access.updateMural).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("publishes only after confirmation and shows success from the server status", async () => {
    const access = gateway();
    access.publishMural = vi.fn().mockResolvedValue({ ...MURAL, status: "PUBLISHED", version: 3 });
    render(<MuralStudio muralId={MURAL.id} gateway={access} loadLibrary={async () => []} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "publicar mural" }));
    await user.click(screen.getByRole("button", { name: "Publicar agora" }));

    await waitFor(() => {
      expect(access.publishMural).toHaveBeenCalledWith(MURAL.id, MURAL.version, expect.any(String));
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Mural publicado");
    expect(screen.getByRole("link", { name: "criar link de visualização" })).toHaveAttribute(
      "href",
      `/murais/${MURAL.id}/compartilhar`,
    );
    expect(access.createViewGrant).not.toHaveBeenCalled();
  });

  it("hides draft editing controls when the mural is already published", async () => {
    const access = gateway();
    access.getMural = vi.fn().mockResolvedValue({ ...MURAL, status: "PUBLISHED" });
    render(<MuralStudio muralId={MURAL.id} gateway={access} loadLibrary={async () => []} />);

    expect(await screen.findByLabelText("nome do mural")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "publicar mural" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Subir" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "salvar mudanças" })).not.toBeInTheDocument();
  });
});
