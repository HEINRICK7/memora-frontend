import {
  CompositionExportError,
  createCompositionExportPlan,
} from "../domain/compositions/composition-export";
import type {
  CompositionExportLayer,
  CompositionExportOptions,
} from "../domain/compositions/composition-export";
import type { CompositionDocument } from "../domain/compositions/composition-document";
import type { ExportPhotoSource } from "../application/compositions/composition-export-renderer";
import type { TemplateDefinition } from "../domain/templates/template-catalog";

type WorkerRequest = {
  document: CompositionDocument;
  template: TemplateDefinition;
  photos: Array<[string, ExportPhotoSource]>;
  options: CompositionExportOptions;
};

function safeTemplateName(templateId: string): string {
  return templateId.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "composicao";
}

function drawDecoration(
  context: OffscreenCanvasRenderingContext2D,
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
  context: OffscreenCanvasRenderingContext2D,
  layer: Extract<CompositionExportLayer, { kind: "photo" }>,
  bitmap: ImageBitmap,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const targetX = layer.definition.x * canvasWidth;
  const targetY = layer.definition.y * canvasHeight;
  const targetWidth = layer.definition.width * canvasWidth;
  const targetHeight = layer.definition.height * canvasHeight;
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;

  if (layer.cropMode === "cover") {
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const cropWidth = targetWidth / scale;
    const cropHeight = targetHeight / scale;
    const sourceX = (sourceWidth - cropWidth) / 2;
    const sourceY = (sourceHeight - cropHeight) / 2;
    context.drawImage(
      bitmap,
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
    context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
  }

  context.strokeStyle = "#536B65";
  context.lineWidth = Math.max(1, canvasWidth / 760);
  context.strokeRect(targetX, targetY, targetWidth, targetHeight);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { document: doc, template, photos: photoEntries, options } = event.data;
  const photoMap = new Map(photoEntries);
  const assetIds = [...new Set(
    doc.slots.map((slot) => slot.assetId).filter((id): id is string => Boolean(id)),
  )];
  const bitmaps = new Map<string, ImageBitmap>();

  try {
    self.postMessage({
      type: "progress",
      progress: { phase: "LOADING_PHOTOS", completedPhotos: 0, totalPhotos: assetIds.length },
    });

    for (let index = 0; index < assetIds.length; index += 1) {
      const assetId = assetIds[index]!;
      const slotIds = doc.slots.filter((s) => s.assetId === assetId).map((s) => s.slotId);
      const photo = photoMap.get(assetId);
      if (!photo) {
        throw new CompositionExportError(
          "PHOTO_UNAVAILABLE",
          "Atualize ou substitua as fotografias indisponíveis antes de exportar.",
          { slotIds, assetIds: [assetId] },
        );
      }
      const response = await fetch(photo.previewUrl, { mode: "cors" });
      if (!response.ok) {
        throw new CompositionExportError(
          "PHOTO_DECODE_FAILED",
          "Uma fotografia não pôde ser carregada para exportação.",
          { slotIds, assetIds: [assetId] },
        );
      }
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      if (bitmap.width < 1 || bitmap.height < 1) {
        bitmap.close();
        throw new CompositionExportError(
          "PHOTO_DECODE_FAILED",
          "Uma fotografia não pôde ser carregada para exportação.",
          { slotIds, assetIds: [assetId] },
        );
      }
      bitmaps.set(assetId, bitmap);
      self.postMessage({
        type: "progress",
        progress: { phase: "LOADING_PHOTOS", completedPhotos: index + 1, totalPhotos: assetIds.length },
      });
    }

    const sourceSizes = new Map(
      [...bitmaps].map(([assetId, bitmap]) => [assetId, { width: bitmap.width, height: bitmap.height }]),
    );
    const plan = createCompositionExportPlan({
      document: doc,
      template,
      sources: sourceSizes,
      options,
    });

    const canvas = new OffscreenCanvas(plan.width, plan.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new CompositionExportError("ENCODING_FAILED", "O Canvas 2D não está disponível.");
    }

    self.postMessage({ type: "progress", progress: { phase: "RENDERING" } });
    context.fillStyle = plan.backgroundColor;
    context.fillRect(0, 0, plan.width, plan.height);

    for (const layer of plan.layers) {
      if (layer.kind === "decoration") {
        drawDecoration(context, layer, plan.width, plan.height);
      } else {
        const bitmap = bitmaps.get(layer.assetId);
        if (!bitmap) {
          throw new CompositionExportError(
            "PHOTO_UNAVAILABLE",
            "Uma fotografia não pôde ser carregada para exportação.",
            { slotIds: [layer.slotId], assetIds: [layer.assetId] },
          );
        }
        drawPhoto(context, layer, bitmap, plan.width, plan.height);
      }
    }

    self.postMessage({ type: "progress", progress: { phase: "ENCODING" } });
    const blob = await canvas.convertToBlob({
      type: plan.format,
      quality: plan.format === "image/jpeg" ? plan.jpegQuality : undefined,
    });
    if (!blob || blob.type !== plan.format) {
      throw new CompositionExportError(
        "ENCODING_FAILED",
        "O browser não gerou o formato solicitado. Tente novamente.",
      );
    }

    self.postMessage({ type: "progress", progress: { phase: "READY" } });
    self.postMessage({
      type: "result",
      blob,
      mimeType: plan.format,
      width: plan.width,
      height: plan.height,
      fileName: `memora-${safeTemplateName(template.templateId)}.${plan.format === "image/png" ? "png" : "jpg"}`,
    });
  } catch (error) {
    if (error instanceof CompositionExportError) {
      self.postMessage({
        type: "error",
        code: error.code,
        message: error.message,
        slotIds: error.slotIds,
        assetIds: error.assetIds,
      });
    } else {
      self.postMessage({
        type: "error",
        code: "ENCODING_FAILED",
        message: "Não foi possível gerar a imagem desta composição.",
      });
    }
  } finally {
    bitmaps.forEach((bitmap) => bitmap.close());
    bitmaps.clear();
  }
};
