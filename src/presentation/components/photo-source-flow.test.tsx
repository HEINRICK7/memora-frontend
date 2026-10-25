import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PhotoGateway } from "../../application/photo-gateway";
import { PhotoSourceFlow } from "./photo-source-flow";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

function createGateway(): PhotoGateway {
  return {
    listPhotos: vi.fn().mockResolvedValue([]),
    createUploadIntent: vi.fn().mockResolvedValue({
      uploadId: "upload-1",
      method: "PUT",
      uploadUrl: "https://storage.invalid/private?signature=secret",
      requiredHeaders: { "Content-Type": "image/jpeg" },
      expiresAt: "2026-10-24T15:05:00Z",
    }),
    uploadFile: vi.fn().mockResolvedValue(undefined),
    completeUpload: vi.fn().mockResolvedValue({
      id: "photo-1",
      status: "READY",
      contentType: "image/jpeg",
      sizeBytes: 5,
      previewUrl: "https://storage.invalid/preview",
      previewExpiresAt: "2026-10-24T15:05:00Z",
    }),
    deletePhoto: vi.fn().mockResolvedValue(undefined),
  };
}

describe("PhotoSourceFlow (FE-PS-AC01..12)", () => {
  beforeEach(() => {
    routerPush.mockReset();
    let previewNumber = 0;
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => `blob:local-preview-${++previewNumber}`),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the three sources, with Gallery selected and Google Photos unavailable", () => {
    render(<PhotoSourceFlow gateway={createGateway()} />);

    const sources = screen.getByRole("radiogroup", { name: "Origem das fotos" });
    expect(within(sources).getByRole("radio", { name: /minha galeria/i })).toBeChecked();
    expect(within(sources).getByRole("radio", { name: /google fotos/i })).toBeDisabled();
    expect(screen.getByText(/indisponível nesta versão/i)).toBeInTheDocument();
    expect(within(sources).getByRole("radio", { name: /tirar agora/i })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "continuar" })).toBeEnabled();
    expect(screen.getByText(/selecionar as fotos na próxima etapa/i)).toBeInTheDocument();
  });

  it("keeps gallery selections local, validates each file, and releases removed previews", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const gateway = createGateway();
    render(<PhotoSourceFlow gateway={gateway} />);

    await user.click(screen.getByRole("button", { name: "continuar" }));
    const picker = screen.getByLabelText("Escolher fotografias");
    const validFile = new File(["photo"], "familia.jpg", { type: "image/jpeg" });
    const unsupportedFile = new File(["gif"], "animacao.gif", { type: "image/gif" });
    const emptyFile = new File([], "vazia.png", { type: "image/png" });
    await user.upload(picker, [validFile, unsupportedFile, emptyFile]);

    expect(await screen.findByRole("heading", { name: "escolhe os melhores cliques" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "familia.jpg" })).toHaveAttribute(
      "src",
      "blob:local-preview-1",
    );
    expect(screen.getByText(/escolha arquivos JPEG ou PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/arquivo está vazio/i)).toBeInTheDocument();
    expect(screen.getByText("1 foto selecionada")).toBeInTheDocument();
    expect(gateway.createUploadIntent).not.toHaveBeenCalled();
    expect(gateway.uploadFile).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /remover familia.jpg/i }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview-1");
    expect(screen.getByText("0 fotos selecionadas")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "familia.jpg" })).not.toBeInTheDocument();
  });

  it("summarizes only selected local photos in the M06 tray and clears them together", async () => {
    const user = userEvent.setup();
    render(<PhotoSourceFlow gateway={createGateway()} />);

    await user.click(screen.getByRole("button", { name: "continuar" }));
    await user.upload(screen.getByLabelText("Escolher fotografias"), [
      new File(["photo one"], "viagem.jpg", { type: "image/jpeg" }),
      new File(["photo two"], "amigos.png", { type: "image/png" }),
    ]);

    const tray = screen.getByRole("list", { name: "Prévia das fotos selecionadas" });
    expect(tray.querySelectorAll("img")).toHaveLength(2);
    expect(tray.querySelectorAll("img")[0]).toHaveAttribute("src", "blob:local-preview-1");
    expect(tray.querySelectorAll("img")[1]).toHaveAttribute("src", "blob:local-preview-2");

    await user.click(screen.getByRole("button", { name: "limpar tudo" }));
    expect(screen.queryByRole("list", { name: "Prévia das fotos selecionadas" })).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview-1");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview-2");
  });

  it("uploads only after confirmation, then opens the template catalog", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    render(<PhotoSourceFlow gateway={gateway} />);
    const file = new File(["photo"], "familia.jpg", { type: "image/jpeg" });

    await user.click(screen.getByRole("button", { name: "continuar" }));
    await user.upload(screen.getByLabelText("Escolher fotografias"), file);
    expect(gateway.createUploadIntent).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "usar essas fotos" }));

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/templates"));
    expect(gateway.createUploadIntent).toHaveBeenCalledWith(file);
    expect(gateway.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ uploadUrl: expect.stringContaining("signature=secret") }),
      file,
    );
    expect(gateway.completeUpload).toHaveBeenCalledWith("upload-1");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview-1");
    expect(screen.queryByText(/signature=secret/i)).not.toBeInTheDocument();
  });

  it("keeps failed files available for a retry without exposing signed URLs", async () => {
    const user = userEvent.setup();
    const gateway = createGateway();
    vi.mocked(gateway.uploadFile)
      .mockRejectedValueOnce(new Error("secret signed URL"))
      .mockResolvedValueOnce(undefined);
    render(<PhotoSourceFlow gateway={gateway} />);
    const file = new File(["photo"], "familia.jpg", { type: "image/jpeg" });

    await user.click(screen.getByRole("button", { name: "continuar" }));
    await user.upload(screen.getByLabelText("Escolher fotografias"), file);
    await user.click(screen.getByRole("button", { name: "usar essas fotos" }));

    expect(await screen.findByText(/não foi possível guardar uma ou mais fotografias/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "familia.jpg" })).toHaveAttribute(
      "src",
      "blob:local-preview-1",
    );
    expect(screen.queryByText(/secret signed URL/i)).not.toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "usar essas fotos" }));
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/templates"));
    expect(gateway.createUploadIntent).toHaveBeenCalledTimes(2);
  });

  it("requests camera only after Continue and stops every track on cancel", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("isSecureContext", true);
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    render(<PhotoSourceFlow gateway={createGateway()} />);

    await user.click(screen.getByRole("radio", { name: /tirar agora/i }));
    expect(getUserMedia).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "continuar" }));

    expect(await screen.findByRole("button", { name: "cancelar câmera" })).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    await user.click(screen.getByRole("button", { name: "cancelar câmera" }));
    expect(stop).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("radiogroup", { name: "Origem das fotos" })).toBeInTheDocument();
  });

  it("stops the camera tracks after capture and keeps the captured image local", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("isSecureContext", true);
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      value: 480,
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["captured"], { type: "image/jpeg" }));
    });
    const gateway = createGateway();
    render(<PhotoSourceFlow gateway={gateway} />);

    await user.click(screen.getByRole("radio", { name: /tirar agora/i }));
    await user.click(screen.getByRole("button", { name: "continuar" }));
    await user.click(await screen.findByRole("button", { name: "capturar" }));

    expect(stop).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("heading", { name: "escolhe os melhores cliques" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /memora-camera-.*\.jpg/ })).toHaveAttribute(
      "src",
      "blob:local-preview-1",
    );
    expect(gateway.createUploadIntent).not.toHaveBeenCalled();
  });

  it("stops camera tracks when the flow unmounts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("isSecureContext", true);
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const { unmount } = render(<PhotoSourceFlow gateway={createGateway()} />);

    await user.click(screen.getByRole("radio", { name: /tirar agora/i }));
    await user.click(screen.getByRole("button", { name: "continuar" }));
    await screen.findByRole("button", { name: "cancelar câmera" });
    unmount();

    expect(stop).toHaveBeenCalledTimes(2);
  });

  it("revokes local previews when the flow unmounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PhotoSourceFlow gateway={createGateway()} />);
    await user.click(screen.getByRole("button", { name: "continuar" }));
    await user.upload(
      screen.getByLabelText("Escolher fotografias"),
      new File(["photo"], "familia.jpg", { type: "image/jpeg" }),
    );

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-preview-1");
  });
});
