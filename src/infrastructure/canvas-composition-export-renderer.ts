import {
  CompositionExportError,
  createCompositionExportPlan,
} from "../domain/compositions/composition-export";
import type { CompositionExportLayer } from "../domain/compositions/composition-export";
import type {
  CompositionExportRenderer,
  ExportPhotoSource,
  RenderCompositionRequest,
} from "../application/compositions/composition-export-renderer";

type CanvasCompositionExportRendererDependencies = Readonly<{
  createCanvas?: () => HTMLCanvasElement;
  createImage?: () => HTMLImageElement;
  yieldToBrowser?: () => Promise<void>;
}>;

function cancelled(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new CompositionExportError("CANCELLED", "Exportação cancelada.");
  }
}

function decodeFailure(): CompositionExportError {
  return new CompositionExportError(
    "PHOTO_DECODE_FAILED",
    "Uma fotografia não pôde ser carregada para exportação.",
  );
}

function loadImage(
  image: HTMLImageElement,
  photo: ExportPhotoSource,
  signal: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
      callback();
    };
    const abort = () => finish(() => reject(new CompositionExportError("CANCELLED", "Exportação cancelada.")));

    image.onload = () => finish(() => resolve(image));
    image.onerror = () => finish(() => reject(decodeFailure()));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    try {
      image.crossOrigin = "anonymous";
      image.src = photo.previewUrl;
    } catch {
      finish(() => reject(decodeFailure()));
    }
  });
}

function sourceDimensions(image: HTMLImageElement) {
  return { width: image.naturalWidth, height: image.naturalHeight };
}

function safeTemplateName(templateId: string): string {
  return templateId.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "composicao";
}

function drawDecoration(
  context: CanvasRenderingContext2D,
  layer: Extract<CompositionExportLayer, { kind: "decoration" }>,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const { definition } = layer;
  const x = definition.x * canvasWidth;
  const y = definition.y * canvasHeight;
  const width = definition.width * canvasWidth;
  const height = definition.height * canvasHeight;

  if (definition.decorationId === "polaroid-paper" && definition.styleVersion === 1) {
    context.fillStyle = "#FFFFFF";
    context.fillRect(x, y, width, height);
    context.strokeStyle = "#E4DED3";
    context.lineWidth = Math.max(1, canvasWidth / 760);
    context.strokeRect(x, y, width, height);
  }
}

function drawPhoto(
  context: CanvasRenderingContext2D,
  layer: Extract<CompositionExportLayer, { kind: "photo" }>,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const targetX = layer.definition.x * canvasWidth;
  const targetY = layer.definition.y * canvasHeight;
  const targetWidth = layer.definition.width * canvasWidth;
  const targetHeight = layer.definition.height * canvasHeight;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (layer.cropMode === "cover") {
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const cropWidth = targetWidth / scale;
    const cropHeight = targetHeight / scale;
    const sourceX = (sourceWidth - cropWidth) / 2;
    const sourceY = (sourceHeight - cropHeight) / 2;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
    );
  } else {
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const drawX = targetX + (targetWidth - drawWidth) / 2;
    const drawY = targetY + (targetHeight - drawHeight) / 2;
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  context.strokeStyle = "#536B65";
  context.lineWidth = Math.max(1, canvasWidth / 760);
  context.strokeRect(targetX, targetY, targetWidth, targetHeight);
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  request: RenderCompositionRequest,
  quality?: number,
): Promise<Blob> {
  cancelled(request.signal);
  request.onProgress?.({ phase: "ENCODING" });

  const blob = await new Promise<Blob | null>((resolve, reject) => {
    try {
      const callback: BlobCallback = (value) => resolve(value);
      if (request.options.format === "image/jpeg") {
        canvas.toBlob(callback, request.options.format, quality);
      } else {
        canvas.toBlob(callback, request.options.format);
      }
    } catch (error) {
      const code = error instanceof DOMException && error.name === "SecurityError"
        ? "CANVAS_CORS"
        : "ENCODING_FAILED";
      reject(new CompositionExportError(code, "O browser não conseguiu codificar a composição."));
    }
  });

  cancelled(request.signal);
  if (!blob || blob.type !== request.options.format) {
    throw new CompositionExportError(
      "ENCODING_FAILED",
      "O browser não gerou o formato solicitado. Tente novamente.",
    );
  }
  return blob;
}

export function createCanvasCompositionExportRenderer(
  dependencies: CanvasCompositionExportRendererDependencies = {},
): CompositionExportRenderer {
  const createCanvas = dependencies.createCanvas ?? (() => {
    if (typeof document === "undefined") {
      throw new CompositionExportError("ENCODING_FAILED", "A exportação precisa ser feita no navegador.");
    }
    return document.createElement("canvas");
  });
  const createImage = dependencies.createImage ?? (() => new Image());
  const yieldToBrowser = dependencies.yieldToBrowser ?? (() =>
    new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0)));

  return {
    async render(request) {
      cancelled(request.signal);
      request.onProgress?.({ phase: "LOADING_PHOTOS", completedPhotos: 0, totalPhotos: new Set(
        request.document.slots.map((slot) => slot.assetId).filter((id): id is string => Boolean(id)),
      ).size });

      const assetIds = [...new Set(
        request.document.slots.map((slot) => slot.assetId).filter((id): id is string => Boolean(id)),
      )];
      const images = new Map<string, HTMLImageElement>();
      try {
        for (let index = 0; index < assetIds.length; index += 1) {
          cancelled(request.signal);
          const assetId = assetIds[index]!;
          const slotIds = request.document.slots
            .filter((slot) => slot.assetId === assetId)
            .map((slot) => slot.slotId);
          const photo = request.photos.get(assetId);
          if (!photo) {
            throw new CompositionExportError(
              "PHOTO_UNAVAILABLE",
              "Atualize ou substitua as fotografias indisponíveis antes de exportar.",
              { slotIds, assetIds: [assetId] },
            );
          }
          let image: HTMLImageElement;
          try {
            image = await loadImage(createImage(), photo, request.signal);
            if (image.naturalWidth < 1 || image.naturalHeight < 1) throw decodeFailure();
          } catch (error) {
            if (error instanceof CompositionExportError && error.code === "PHOTO_DECODE_FAILED") {
              throw new CompositionExportError(error.code, error.message, {
                slotIds,
                assetIds: [assetId],
              });
            }
            throw error;
          }
          images.set(assetId, image);
          request.onProgress?.({
            phase: "LOADING_PHOTOS",
            completedPhotos: index + 1,
            totalPhotos: assetIds.length,
          });
        }

        const sourceSizes = new Map(
          [...images].map(([assetId, image]) => [assetId, sourceDimensions(image)]),
        );
        const plan = createCompositionExportPlan({
          document: request.document,
          template: request.template,
          sources: sourceSizes,
          options: request.options,
        });
        cancelled(request.signal);

        const canvas = createCanvas();
        try {
          canvas.width = plan.width;
          canvas.height = plan.height;
          const context = canvas.getContext("2d");
          if (!context) {
            throw new CompositionExportError("ENCODING_FAILED", "O Canvas 2D não está disponível.");
          }
          request.onProgress?.({ phase: "RENDERING" });
          context.fillStyle = plan.backgroundColor;
          context.fillRect(0, 0, plan.width, plan.height);

          for (const layer of plan.layers) {
            cancelled(request.signal);
            if (layer.kind === "decoration") {
              drawDecoration(context, layer, plan.width, plan.height);
            } else {
              const image = images.get(layer.assetId);
              if (!image) {
                throw new CompositionExportError(
                  "PHOTO_UNAVAILABLE",
                  "Uma fotografia não pôde ser carregada para exportação.",
                  { slotIds: [layer.slotId], assetIds: [layer.assetId] },
                );
              }
              drawPhoto(context, layer, image, plan.width, plan.height);
            }
            await yieldToBrowser();
          }

          const blob = await encodeCanvas(canvas, request, plan.jpegQuality);
          request.onProgress?.({ phase: "READY" });
          return {
            blob,
            mimeType: plan.format,
            width: plan.width,
            height: plan.height,
            fileName: `memora-${safeTemplateName(request.template.templateId)}.${plan.format === "image/png" ? "png" : "jpg"}`,
          };
        } catch (error) {
          if (error instanceof CompositionExportError) throw error;
          const code = error instanceof DOMException && error.name === "SecurityError"
            ? "CANVAS_CORS"
            : "ENCODING_FAILED";
          throw new CompositionExportError(code, "Não foi possível gerar a imagem desta composição.");
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      } finally {
        images.clear();
      }
    },
  };
}
