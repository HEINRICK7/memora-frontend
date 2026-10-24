import { describe, expect, it, vi } from "vitest";
import { createCompositionDocument, setPhotoForSlot } from "../domain/compositions/composition-document";
import { createCanvasCompositionExportRenderer } from "./canvas-composition-export-renderer";
import { TEMPLATE_CATALOG_V1 } from "../domain/templates/template-catalog";
import type { RenderCompositionRequest } from "../application/compositions/composition-export-renderer";

const template = TEMPLATE_CATALOG_V1.find((item) => item.templateId === "polaroid-single")!;

function request(overrides: Partial<RenderCompositionRequest> = {}): RenderCompositionRequest {
  return {
    document: setPhotoForSlot(createCompositionDocument(template), "photo-1", "asset-a"),
    template,
    photos: new Map([
      ["asset-a", {
        assetId: "asset-a",
        previewUrl: "http://localhost:9000/private/signed",
        previewExpiresAt: "2026-10-24T17:15:00.000Z",
      }],
    ]),
    options: { format: "image/png" },
    signal: new AbortController().signal,
    ...overrides,
  };
}

function rendererHarness({
  imageLoad = "load",
  blobType,
}: { imageLoad?: "load" | "fail"; blobType?: string } = {}) {
  const operations: string[] = [];
  const encodedDimensions: number[] = [];
  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    fillRect: vi.fn(() => operations.push("fillRect")),
    strokeRect: vi.fn(() => operations.push("strokeRect")),
    drawImage: vi.fn(() => operations.push("drawImage")),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((callback: BlobCallback, type?: string, quality?: number) => {
      operations.push("toBlob");
      encodedDimensions.push(canvas.width, canvas.height);
      callback(blobType === "null" ? null : new Blob(["pixels"], { type: blobType ?? type }));
      return undefined;
    }),
  };
  const imageOrder: string[] = [];
  const image = {
    naturalWidth: 2400,
    naturalHeight: 2400,
    onload: null as null | (() => void),
    onerror: null as null | (() => void),
    crossOrigin: null as string | null,
    _src: "",
    set src(value: string) {
      imageOrder.push(`src:${value}`);
      this._src = value;
      queueMicrotask(() => imageLoad === "load" ? this.onload?.() : this.onerror?.());
    },
    get src() { return this._src; },
  };
  const service = createCanvasCompositionExportRenderer({
    createCanvas: () => canvas as unknown as HTMLCanvasElement,
    createImage: () => {
      imageOrder.push("createImage");
      return image as unknown as HTMLImageElement;
    },
  });
  return { service, canvas, context, operations, encodedDimensions, image, imageOrder };
}

describe("Canvas 2D composition export renderer (MEM-007-R03..09)", () => {
  it("draws the linen base, template decoration, and photo in layer order at template dimensions", async () => {
    const harness = rendererHarness();

    const result = await harness.service.render(request());

    expect(harness.encodedDimensions).toEqual([1200, 1500]);
    expect(harness.canvas.width).toBe(0);
    expect(harness.canvas.height).toBe(0);
    expect(harness.context.fillRect).toHaveBeenNthCalledWith(1, 0, 0, 1200, 1500);
    expect(harness.operations).toEqual([
      "fillRect",
      "fillRect",
      "strokeRect",
      "drawImage",
      "strokeRect",
      "toBlob",
    ]);
    expect(harness.context.drawImage).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      mimeType: "image/png",
      width: 1200,
      height: 1500,
      fileName: "memora-polaroid-single.png",
    });
  });

  it("sets anonymous CORS before the signed MinIO image URL", async () => {
    const harness = rendererHarness();

    await harness.service.render(request());

    expect(harness.image.crossOrigin).toBe("anonymous");
    expect(harness.imageOrder).toEqual([
      "createImage",
      "src:http://localhost:9000/private/signed",
    ]);
  });

  it("uses the contain crop geometry and the selected JPEG quality", async () => {
    const input = request({
      document: {
        ...request().document,
        slots: request().document.slots.map((slot) => ({ ...slot, cropMode: "contain" })),
      },
      options: { format: "image/jpeg", jpegQuality: 0.74 },
    });
    const harness = rendererHarness();

    const result = await harness.service.render(input);

    expect(harness.context.drawImage).toHaveBeenCalledWith(
      harness.image,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    expect(harness.canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.74);
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.fileName).toMatch(/\.jpg$/);
  });

  it("fails on image decode failure without encoding a partial composition", async () => {
    const harness = rendererHarness({ imageLoad: "fail" });

    await expect(harness.service.render(request())).rejects.toMatchObject({
      code: "PHOTO_DECODE_FAILED",
      slotIds: ["photo-1"],
      assetIds: ["asset-a"],
    });
    expect(harness.canvas.toBlob).not.toHaveBeenCalled();
  });

  it.each(["null", "image/jpeg"])("rejects a null or mismatched PNG Blob (%s)", async (blobType) => {
    const harness = rendererHarness({ blobType });

    await expect(harness.service.render(request())).rejects.toMatchObject({
      code: "ENCODING_FAILED",
    });
  });

  it("discards a completed encoding if cancellation arrived while toBlob was pending", async () => {
    const controller = new AbortController();
    let finishEncoding: BlobCallback | undefined;
    const harness = rendererHarness();
    harness.canvas.toBlob.mockImplementation((callback: BlobCallback) => {
      finishEncoding = callback;
      return undefined;
    });

    const pending = harness.service.render(request({ signal: controller.signal }));
    await vi.waitFor(() => expect(finishEncoding).toBeDefined());
    controller.abort();
    finishEncoding?.(new Blob(["pixels"], { type: "image/png" }));

    await expect(pending).rejects.toMatchObject({ code: "CANCELLED" });
  });
});
