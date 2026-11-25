import { needsClientConversion } from "../domain/photos/validate-photo";

const MAX_UPLOAD_SIDE = 2048;
const OPTIMIZE_SIZE_THRESHOLD_BYTES = 600 * 1024;
const DEFAULT_JPEG_QUALITY = 0.85;

type DecodedBitmap = {
  width: number;
  height: number;
  close?: () => void;
};

export type ImageOptimizerDependencies = {
  decodeBitmap?: ((file: File) => Promise<DecodedBitmap>) | null;
  detectTransparency?: (bitmap: DecodedBitmap) => Promise<boolean>;
  encodeCanvas?: (
    width: number,
    height: number,
    mimeType: "image/jpeg" | "image/png",
    quality: number,
    bitmap: DecodedBitmap,
  ) => Promise<Blob | null>;
};

function renameExtension(fileName: string, extension: ".jpg" | ".png"): string {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  return `${base || "foto"}${extension}`;
}

async function defaultDecodeBitmap(file: File): Promise<DecodedBitmap> {
  if (typeof globalThis.createImageBitmap !== "function") {
    throw new Error("bitmap-unavailable");
  }
  return globalThis.createImageBitmap(file, { imageOrientation: "from-image" });
}

async function defaultDetectTransparency(bitmap: DecodedBitmap): Promise<boolean> {
  const probeMax = 256;
  const scale = Math.min(1, probeMax / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return true;
      ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, width, height);
      const { data } = ctx.getImageData(0, 0, width, height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) return true;
      }
      return false;
    }
    if (typeof document === "undefined") return true;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return true;
      ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, width, height);
      const { data } = ctx.getImageData(0, 0, width, height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) return true;
      }
      return false;
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch {
    return true;
  }
}

async function defaultEncodeCanvas(
  width: number,
  height: number,
  mimeType: "image/jpeg" | "image/png",
  quality: number,
  bitmap: DecodedBitmap,
): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, width, height);
    return canvas.convertToBlob({ type: mimeType, quality });
  }
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" ? quality : undefined);
    });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function optimizePhotoForUpload(
  file: File,
  dependencies: ImageOptimizerDependencies = {},
): Promise<File> {
  const mustConvert = needsClientConversion(file);
  const decodeBitmap =
    dependencies.decodeBitmap === undefined
      ? typeof globalThis.createImageBitmap === "function"
        ? defaultDecodeBitmap
        : null
      : dependencies.decodeBitmap;

  if (!decodeBitmap) {
    if (mustConvert) {
      throw new Error("Este navegador não conseguiu converter WebP/HEIC. Envie em JPEG ou PNG.");
    }
    return file;
  }

  let bitmap: DecodedBitmap;
  try {
    bitmap = await decodeBitmap(file);
  } catch {
    if (mustConvert) {
      throw new Error("Este navegador não conseguiu converter WebP/HEIC. Envie em JPEG ou PNG.");
    }
    return file;
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const shouldResize = longest > MAX_UPLOAD_SIDE;
    const shouldCompress = file.size > OPTIMIZE_SIZE_THRESHOLD_BYTES;

    let targetMime: "image/jpeg" | "image/png" = "image/jpeg";
    let convertedOpaquePng = false;
    if (file.type === "image/png" && !mustConvert) {
      const detectTransparency = dependencies.detectTransparency ?? defaultDetectTransparency;
      const hasTransparency = await detectTransparency(bitmap);
      if (hasTransparency) {
        targetMime = "image/png";
      } else {
        targetMime = "image/jpeg";
        convertedOpaquePng = true;
      }
    }

    if (!mustConvert && !shouldResize && !shouldCompress && !convertedOpaquePng) {
      return file;
    }

    const scale = shouldResize ? MAX_UPLOAD_SIDE / longest : 1;
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const encodeCanvas = dependencies.encodeCanvas ?? defaultEncodeCanvas;
    const blob = await encodeCanvas(targetWidth, targetHeight, targetMime, DEFAULT_JPEG_QUALITY, bitmap);
    if (!blob || blob.size === 0) {
      if (mustConvert) {
        throw new Error("Não foi possível converter esta imagem para JPEG ou PNG.");
      }
      return file;
    }

    // If re-encoding didn't shrink and didn't resize/require conversion, keep the original untouched.
    if (!mustConvert && !shouldResize && blob.size >= file.size) {
      return file;
    }

    const extensionChanged = mustConvert || convertedOpaquePng;
    const nextName = extensionChanged
      ? renameExtension(file.name, targetMime === "image/png" ? ".png" : ".jpg")
      : file.name;
    return new File([blob], nextName, { type: targetMime, lastModified: file.lastModified });
  } finally {
    bitmap.close?.();
  }
}
