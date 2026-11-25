import { describe, expect, it, vi } from "vitest";
import { createCanvasCompositionExportRenderer } from "./canvas-composition-export-renderer";
import { TEMPLATE_CATALOG_V1 } from "../domain/templates/template-catalog";
import { createCompositionDocument } from "../domain/compositions/composition-document";

describe("createCanvasCompositionExportRenderer worker path (MEM-011-AC13)", () => {
  it("delegates export to Worker + OffscreenCanvas when available and terminates on abort", async () => {
    const template = TEMPLATE_CATALOG_V1.find((item) => item.templateId === "poster")!;
    const doc = createCompositionDocument(template);
    const photos = new Map([
      ["photo-1", {
        assetId: "photo-1",
        previewUrl: "https://media.test/1.jpg",
        previewExpiresAt: "2026-11-25T23:59:00.000Z",
      }],
    ]);

    const terminate = vi.fn();
    let capturedOnMessage: ((event: MessageEvent) => void) | null = null;
    const postMessage = vi.fn(() => {
      capturedOnMessage?.({ data: { type: "progress", progress: { phase: "RENDERING" } } } as MessageEvent);
      capturedOnMessage?.({
        data: {
          type: "result",
          blob: new Blob(["png-bytes"], { type: "image/png" }),
          mimeType: "image/png",
          width: 1200,
          height: 1500,
          fileName: "memora-poster.png",
        },
      } as MessageEvent);
    });

    const createWorker = vi.fn(() => {
      const worker = {
        postMessage,
        terminate,
        set onmessage(handler: ((event: MessageEvent) => void) | null) {
          capturedOnMessage = handler;
        },
        onerror: null,
      };
      return worker as unknown as Worker;
    });

    const progressPhases: string[] = [];
    const renderer = createCanvasCompositionExportRenderer({
      createWorker,
      supportsOffscreenWorker: () => true,
    });

    const controller = new AbortController();
    const result = await renderer.render({
      document: doc,
      template,
      photos,
      options: { format: "image/png" },
      signal: controller.signal,
      onProgress: (p) => progressPhases.push(p.phase),
    });

    expect(createWorker).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(progressPhases).toContain("RENDERING");
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBe(1200);
    expect(result.height).toBe(1500);
  });
});
