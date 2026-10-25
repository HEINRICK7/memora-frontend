import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MyMurals } from "./my-murals";

const MURAL_ID = "c0f5f693-7160-4e49-9d76-cfaba4edce1c";
const COVER_ID = "a0f5f693-7160-4e49-9d76-cfaba4edce1c";
const OTHER_PHOTO_ID = "b0f5f693-7160-4e49-9d76-cfaba4edce1c";

function createGateway() {
  return {
    listMurals: vi.fn().mockResolvedValue({
      items: [
        {
          id: MURAL_ID,
          status: "PUBLISHED",
          version: 1,
          title: "Summer 26",
          description: null,
          coverPhotoId: COVER_ID,
          createdAt: "2026-10-24T12:00:00Z",
          updatedAt: "2026-10-24T12:00:00Z",
        },
      ],
      nextCursor: null,
    }),
    createDraft: vi.fn(),
    getMural: vi.fn(),
  };
}

afterEach(() => cleanup());

describe("MyMurals M02 mobile presentation", () => {
  it("shows the M02 heading and only implemented destinations in the bottom navigation", async () => {
    const gateway = createGateway();
    gateway.listMurals.mockResolvedValue({ items: [], nextCursor: null });
    render(<MyMurals gateway={gateway} />);

    expect(
      await screen.findByRole("heading", { name: /seus momentos, todos aqui/i }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", {
      name: "Navegação móvel",
    });
    expect(navigation.querySelector('a[href="/"]')).toHaveTextContent("Início");
    expect(navigation.querySelector('a[href="/meus-murais"]')).toHaveTextContent("Murais");
    expect(navigation.querySelector('a[aria-label="Modelos"]')).toHaveAttribute(
      "href",
      "/templates",
    );
    expect(navigation.querySelector('a[href="/perfil"]')).toBeNull();
    expect(screen.getByRole("link", { name: /criar mural/i })).toHaveAttribute(
      "href",
      "/templates",
    );
    expect(screen.getByRole("link", { name: "Criar um mural" })).toHaveAttribute(
      "href",
      "/templates",
    );
  });

  it("uses the API cover and derives the photo count from the mural photos response", async () => {
    const gateway = createGateway();
    const photoGateway = {
      listMuralPhotos: vi.fn().mockResolvedValue({
        muralVersion: 1,
        items: [
          {
            photoId: OTHER_PHOTO_ID,
            position: 0,
            contentType: "image/webp",
            sizeBytes: 12_000,
            previewUrl: "https://minio.test/other-photo?signature=temporary",
            previewExpiresAt: "2026-10-24T12:05:00Z",
          },
          {
            photoId: COVER_ID,
            position: 1,
            contentType: "image/webp",
            sizeBytes: 14_000,
            previewUrl: "https://minio.test/cover-photo?signature=temporary",
            previewExpiresAt: "2026-10-24T12:05:00Z",
          },
        ],
      }),
    };

    render(<MyMurals gateway={gateway} photoGateway={photoGateway} />);

    expect(await screen.findByText("2 fotos")).toBeInTheDocument();
    expect(
      await screen.findByRole("img", { name: "Capa de Summer 26" }),
    ).toHaveAttribute("src", "https://minio.test/cover-photo?signature=temporary");
    expect(photoGateway.listMuralPhotos).toHaveBeenCalledWith(MURAL_ID);
    expect(screen.getByText("Publicado")).toBeInTheDocument();
  });

  it("does not show a demo brand photo when a mural has no matching cover", async () => {
    const gateway = createGateway();
    const photoGateway = {
      listMuralPhotos: vi.fn().mockResolvedValue({
        muralVersion: 1,
        items: [
          {
            photoId: OTHER_PHOTO_ID,
            position: 0,
            contentType: "image/webp",
            sizeBytes: 12_000,
            previewUrl: "https://minio.test/photo?signature=temporary",
            previewExpiresAt: "2026-10-24T12:05:00Z",
          },
        ],
      }),
    };

    render(<MyMurals gateway={gateway} photoGateway={photoGateway} />);

    expect(await screen.findByText("1 foto")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Capa indisponível")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("img", { name: "Capa de Summer 26" })).toBeNull();
  });

  it("does not turn a photos endpoint failure into a zero count", async () => {
    const photoGateway = {
      listMuralPhotos: vi.fn().mockRejectedValue(new Error("preview unavailable")),
    };

    render(<MyMurals gateway={createGateway()} photoGateway={photoGateway} />);

    expect(await screen.findByText("Fotos indisponíveis")).toBeInTheDocument();
    expect(screen.queryByText("0 fotos")).toBeNull();
    expect(screen.queryByRole("img", { name: "Capa de Summer 26" })).toBeNull();
  });
});
