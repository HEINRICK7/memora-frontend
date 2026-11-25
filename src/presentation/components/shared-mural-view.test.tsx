import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SharedMural } from "../../application/mural-gateway";
import { MuralGatewayError } from "../../application/mural-gateway";
import { SharedMuralView } from "./shared-mural-view";

const SHARED: SharedMural = {
  mural: {
    title: "summer 26",
    description: "dias bons, gente querida",
    coverPhotoId: null,
    photos: Array.from({ length: 8 }, (_, index) => ({
      photoId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      position: index,
      contentType: "image/jpeg",
      sizeBytes: 1200,
      width: index % 2 === 0 ? 1600 : 900,
      height: index % 2 === 0 ? 900 : 1600,
      previewUrl: `https://media.example.test/${index + 1}.jpg`,
      thumbnailUrl: `https://media.example.test/thumb-${index + 1}.jpg`,
      previewExpiresAt: "2026-10-25T20:00:00.000Z",
      ownedByGuest: index === 0,
      authorName: index === 0 ? "Henrique" : null,
    })),
    totalPhotos: 8,
    nextOffset: null,
  },
  permissions: { canView: true, canContribute: false, moderationRequired: false },
};

describe("SharedMuralView direct guest flow (MEM-012-AC01..05)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    let seq = 0;
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:guest-preview-${++seq}`),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens directly into the live party mural with the Home hero photo and template selector", async () => {
    const user = userEvent.setup();
    render(
      <SharedMuralView
        shareToken="opaque-token"
        loadShared={async () => ({
          ...SHARED,
          permissions: { canView: true, canContribute: true, moderationRequired: false },
        })}
      />,
    );

    expect(await screen.findByRole("heading", { name: "summer 26" })).toBeTruthy();
    // Hero must always use the Home brand image, never a user photo
    const heroSection = screen.getByRole("region", { name: "Mural compartilhado" });
    const heroImg = heroSection.querySelector("img");
    expect(heroImg).toHaveAttribute("src", "/brand/v2/photos/hero/festival-selfie.webp");

    expect(screen.getByRole("list", { name: "Fotos de summer 26" }).children).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /^começar$/i })).toBeNull();
    expect(screen.getByRole("button", { name: /tirar foto/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /da galeria/i })).toBeTruthy();
    // Grid uses lightweight thumbnailUrl and displays author credit ("por Henrique")
    expect(screen.getByAltText("Foto 1 de 8")).toHaveAttribute(
      "src",
      "https://media.example.test/thumb-1.jpg",
    );
    expect(screen.getByText("por Henrique")).toBeTruthy();

    // Template switcher exposes mural livre + catalog templates and re-layouts moments
    const tablist = screen.getByRole("tablist", { name: /escolher template dos momentos/i });
    expect(within(tablist).getByRole("tab", { name: "mural livre" })).toHaveAttribute("aria-selected", "true");
    const fourFramesTab = within(tablist).getByRole("tab", { name: "4 frames" });
    await user.click(fourFramesTab);
    expect(fourFramesTab).toHaveAttribute("aria-selected", "true");

    // 8 photos in 4-frames template -> 2 composed frames, preserving author credit
    const templateList = screen.getByRole("list", { name: "Fotos de summer 26 no template 4 frames" });
    expect(templateList.children).toHaveLength(2);
    expect(within(templateList).getAllByText("por Henrique").length).toBeGreaterThanOrEqual(1);
    // Clicking photo 1 inside template opens lightbox showing "por Henrique"
    await user.click(screen.getByRole("button", { name: /Abrir foto 1 de 8/ }));
    const dialog = screen.getByRole("dialog", { name: "Foto 1 de 8" });
    expect(within(dialog).getByText(/por/i)).toHaveTextContent("por Henrique");
  });

  it("compacts the mobile header after 40 CSS pixels of gallery scrolling", async () => {
    render(<SharedMuralView shareToken="opaque-token" loadShared={async () => SHARED} />);

    expect(await screen.findByRole("heading", { name: "summer 26" })).toBeTruthy();
    const header = screen.getByRole("banner");
    Object.defineProperty(window, "scrollY", { configurable: true, value: 41 });
    fireEvent.scroll(window);

    await waitFor(() => expect(header.className).toContain("scrolledHeader"));
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);
  });

  it("does not show write or delete actions for a VIEW link", async () => {
    const user = userEvent.setup();
    render(<SharedMuralView shareToken="opaque-token" loadShared={async () => SHARED} />);

    await screen.findByRole("heading", { name: "summer 26" });
    expect(screen.queryByRole("button", { name: /tirar foto/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /da galeria/i })).toBeNull();

    // Even when opening a photo in lightbox on a VIEW link, no delete button is shown
    await user.click(screen.getByRole("button", { name: /Abrir foto 1 de 8/ }));
    expect(screen.queryByRole("button", { name: /apagar minha foto/i })).toBeNull();
  });

  it("opens local review bottom sheet, allows removing before upload, and publishes directly", async () => {
    const user = userEvent.setup();
    const submitContribution = vi.fn().mockResolvedValue({
      contributionId: "00000000-0000-4000-8000-000000000099",
      photoId: "00000000-0000-4000-8000-000000000099",
      status: "PUBLISHED",
    });
    const loadShared = vi.fn().mockResolvedValue({
      ...SHARED,
      permissions: { canView: true, canContribute: true, moderationRequired: false },
    });

    render(
      <SharedMuralView
        shareToken="opaque-token"
        loadShared={loadShared}
        gateway={{ submitContribution }}
      />,
    );

    const galleryInput = await screen.findByLabelText("Escolher fotos da galeria");
    const good = new File([new Uint8Array([1, 2, 3])], "boa.jpg", { type: "image/jpeg" });
    const blurry = new File([new Uint8Array([4, 5, 6])], "tremida.jpg", { type: "image/jpeg" });
    await user.upload(galleryInput, [good, blurry]);

    // Review sheet is open locally; upload has NOT started yet
    const sheet = screen.getByRole("dialog", { name: /enviar para a festa/i });
    expect(within(sheet).getByRole("img", { name: "boa.jpg" })).toBeTruthy();
    expect(within(sheet).getByRole("img", { name: "tremida.jpg" })).toBeTruthy();
    expect(submitContribution).not.toHaveBeenCalled();

    // Remove blurry photo before upload -> revokes object URL
    await user.click(within(sheet).getByRole("button", { name: /remover tremida\.jpg/i }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:guest-preview-2");
    expect(within(sheet).queryByRole("img", { name: "tremida.jpg" })).toBeNull();

    // Enter optional guest name and send directly to the party
    await user.type(within(sheet).getByLabelText(/seu nome/i), "Lia");
    await user.click(within(sheet).getByRole("button", { name: /enviar para a festa/i }));

    await waitFor(() => expect(submitContribution).toHaveBeenCalledTimes(1));
    expect(submitContribution).toHaveBeenCalledWith(
      "opaque-token",
      good,
      "Lia",
      expect.any(String),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/no álbum da festa/i);
    // Refreshes mural after publish
    expect(loadShared).toHaveBeenCalledTimes(2);
    // Remembers guest name locally
    expect(window.localStorage.getItem("memora:guest-name")).toBe("Lia");
  });

  it("keeps failed photos in the bottom sheet for retry while reporting accepted ones", async () => {
    const user = userEvent.setup();
    const submitContribution = vi.fn()
      .mockResolvedValueOnce({
        contributionId: "00000000-0000-4000-8000-000000000091",
        photoId: "00000000-0000-4000-8000-000000000091",
        status: "PUBLISHED",
      })
      .mockRejectedValue(new Error("4G caiu"));

    render(
      <SharedMuralView
        shareToken="opaque-token"
        loadShared={async () => ({
          ...SHARED,
          permissions: { canView: true, canContribute: true, moderationRequired: false },
        })}
        gateway={{ submitContribution }}
      />,
    );

    const galleryInput = await screen.findByLabelText("Escolher fotos da galeria");
    const good = new File([new Uint8Array([1])], "boa.jpg", { type: "image/jpeg" });
    const failed = new File([new Uint8Array([2])], "ruim.jpg", { type: "image/jpeg" });
    await user.upload(galleryInput, [good, failed]);

    const sheet = screen.getByRole("dialog", { name: /enviar para a festa/i });
    await user.click(within(sheet).getByRole("button", { name: /enviar para a festa/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/1 foto\(s\) publicada\(s\)/i);
    const updatedSheet = screen.getByRole("dialog", { name: /enviar para a festa/i });
    expect(within(updatedSheet).queryByRole("img", { name: "boa.jpg" })).toBeNull();
    expect(within(updatedSheet).getByRole("img", { name: "ruim.jpg" })).toBeTruthy();
  });

  it("allows deleting only photos owned by this guest in the lightbox with 2-step confirmation", async () => {
    const user = userEvent.setup();
    const deleteGuestPhoto = vi.fn().mockResolvedValue(undefined);
    window.localStorage.setItem("memora:guest-album:opaque-token", "guest-token-1234567890abcdef");

    render(
      <SharedMuralView
        shareToken="opaque-token"
        loadShared={async () => ({
          ...SHARED,
          permissions: { canView: true, canContribute: true, moderationRequired: false },
        })}
        gateway={{ submitContribution: vi.fn(), deleteGuestPhoto }}
      />,
    );

    // Photo 2 is NOT owned by this guest -> no delete button
    await user.click(await screen.findByRole("button", { name: "Abrir foto 2 de 8" }));
    expect(screen.queryByRole("button", { name: /apagar minha foto/i })).toBeNull();

    // Navigate to Photo 1 (ownedByGuest: true) -> shows delete button
    await user.keyboard("{ArrowLeft}");
    const deleteBtn = screen.getByRole("button", { name: /apagar minha foto/i });
    await user.click(deleteBtn);
    expect(deleteGuestPhoto).not.toHaveBeenCalled();

    // Confirm deletion
    await user.click(screen.getByRole("button", { name: /confirmar exclusão/i }));
    await waitFor(() =>
      expect(deleteGuestPhoto).toHaveBeenCalledWith(
        "opaque-token",
        SHARED.mural.photos[0]!.photoId,
        "guest-token-1234567890abcdef",
      ),
    );
  });

  it("opens an accessible lightbox, navigates with keyboard and touch, and restores focus", async () => {
    const user = userEvent.setup();
    render(<SharedMuralView shareToken="opaque-token" loadShared={async () => SHARED} />);

    const firstPhoto = await screen.findByRole("button", { name: /Abrir foto 1 de 8/ });
    await user.click(firstPhoto);
    const dialog = screen.getByRole("dialog", { name: "Foto 1 de 8" });
    expect(screen.getByRole("button", { name: "Fechar foto" })).toHaveFocus();
    // Lightbox uses full previewUrl (not thumbnail)
    expect(within(dialog).getByAltText("Foto 1 de 8")).toHaveAttribute(
      "src",
      "https://media.example.test/1.jpg",
    );

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Foto 2 de 8" })).toBeTruthy();

    fireEvent.touchStart(dialog, { touches: [{ clientX: 220, clientY: 40 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 140, clientY: 40 }] });
    expect(await screen.findByRole("dialog", { name: "Foto 3 de 8" })).toBeTruthy();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(firstPhoto).toHaveFocus());
  });

  it("does not replace a failed authorized preview with another asset", async () => {
    render(<SharedMuralView shareToken="opaque-token" loadShared={async () => SHARED} />);

    const preview = await screen.findByAltText("Foto 1 de 8");
    fireEvent.error(preview);
    expect(await screen.findByText("Esta foto não está disponível agora.")).toBeTruthy();
    expect(screen.queryByAltText(/foto de demonstração/i)).toBeNull();
  });

  it("shows a generic retry state when a dependency fails", async () => {
    render(
      <SharedMuralView
        shareToken="opaque-token"
        loadShared={async () => {
          throw new MuralGatewayError({ status: 503, code: "dependency_unavailable", message: "Título privado" });
        }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar este mural agora");
    expect(screen.queryByText("Título privado")).toBeNull();
  });
});
