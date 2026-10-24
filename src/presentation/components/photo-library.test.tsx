import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoLibrary } from "./photo-library";

function createGateway() {
  return {
    listPhotos: vi.fn().mockResolvedValue([]),
    createUploadIntent: vi.fn().mockResolvedValue({
      uploadId: "upload-1",
      method: "PUT" as const,
      uploadUrl: "http://localhost:9000/private/key?signature=secret",
      requiredHeaders: { "Content-Type": "image/jpeg" },
      expiresAt: "2026-10-24T15:05:00Z",
    }),
    uploadFile: vi.fn().mockResolvedValue(undefined),
    completeUpload: vi.fn().mockResolvedValue({
      id: "photo-1",
      status: "READY" as const,
      contentType: "image/jpeg",
      sizeBytes: 5,
      previewUrl: "https://storage.invalid/preview",
      previewExpiresAt: "2026-10-24T15:05:00Z",
    }),
    deletePhoto: vi.fn().mockResolvedValue(undefined),
  };
}

describe("PhotoLibrary (MEM-001-AC01..06)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => "blob:local-preview"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps selected photos local until the explicit save action", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    render(<PhotoLibrary gateway={gateway} />);
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });

    await waitFor(() => expect(gateway.listPhotos).toHaveBeenCalledTimes(1));

    await user.upload(screen.getByLabelText("Escolher fotografias"), file);

    expect(screen.getByRole("img", { name: "family.jpg" })).toHaveAttribute(
      "src",
      "blob:local-preview",
    );
    expect(gateway.createUploadIntent).not.toHaveBeenCalled();
    expect(gateway.uploadFile).not.toHaveBeenCalled();
    expect(gateway.completeUpload).not.toHaveBeenCalled();
    expect(gateway.listPhotos).toHaveBeenCalledTimes(1);
  });

  it("releases local preview URLs when the library unmounts", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    const { unmount } = render(<PhotoLibrary gateway={gateway} />);
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });

    await user.upload(screen.getByLabelText("Escolher fotografias"), file);
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview");
  });

  it("runs intent, signed PUT, and complete only after confirmation", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    render(<PhotoLibrary gateway={gateway} />);
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });

    await user.upload(screen.getByLabelText("Escolher fotografias"), file);
    await user.click(screen.getByRole("button", { name: "Guardar fotografias" }));

    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Fotografia guardada" })).toHaveAttribute(
        "src",
        "https://storage.invalid/preview",
      ),
    );
    expect(gateway.createUploadIntent).toHaveBeenCalledWith(file);
    expect(gateway.uploadFile).toHaveBeenCalled();
    expect(gateway.completeUpload).toHaveBeenCalledWith("upload-1");
    expect(screen.queryByRole("img", { name: "family.jpg" })).not.toBeInTheDocument();
  });

  it("preserves a selected preview and offers retry when storage fails", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    gateway.uploadFile.mockRejectedValueOnce(new Error("storage unavailable"));
    render(<PhotoLibrary gateway={gateway} />);
    const file = new File(["photo"], "family.jpg", { type: "image/jpeg" });

    await user.upload(screen.getByLabelText("Escolher fotografias"), file);
    await user.click(screen.getByRole("button", { name: "Guardar fotografias" }));

    expect(await screen.findByText(/Tente novamente/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "family.jpg" })).toHaveAttribute(
      "src",
      "blob:local-preview",
    );
    expect(gateway.completeUpload).not.toHaveBeenCalled();
  });
});
