export const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_BATCH_UPLOAD_COUNT = 20;
export const ACCEPTED_PHOTO_INPUT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export type PhotoValidationFailure =
  | "unsupported-type"
  | "empty"
  | "too-large";

export type PhotoValidationResult =
  | { valid: true }
  | { valid: false; reason: PhotoValidationFailure };

export type PhotoBatchValidation<T extends Pick<File, "type" | "size">> = {
  accepted: T[];
  rejected: Array<{ file: T; reason: PhotoValidationFailure }>;
  truncatedCount: number;
};

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const CONVERTIBLE_IMAGE_TYPES = new Set([
  "image/webp",
  "image/heic",
  "image/heif",
]);

function inferImageType(file: Pick<File, "type"> & { name?: string }): string {
  const normalized = file.type.toLowerCase();
  if (normalized) return normalized;
  const name = file.name?.toLowerCase() ?? "";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export function needsClientConversion(
  file: Pick<File, "type"> & { name?: string },
): boolean {
  return CONVERTIBLE_IMAGE_TYPES.has(inferImageType(file));
}

export function validatePhotoFile(
  file: Pick<File, "type" | "size"> & { name?: string },
): PhotoValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.has(inferImageType(file))) {
    return { valid: false, reason: "unsupported-type" };
  }

  if (file.size <= 0) {
    return { valid: false, reason: "empty" };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { valid: false, reason: "too-large" };
  }

  return { valid: true };
}

export function validatePhotoBatch<T extends Pick<File, "type" | "size"> & { name?: string }>(
  files: Iterable<T>,
  maxBatchCount = MAX_BATCH_UPLOAD_COUNT,
): PhotoBatchValidation<T> {
  const all = Array.from(files);
  const capped = maxBatchCount > 0 ? all.slice(0, maxBatchCount) : all;
  const truncatedCount = Math.max(0, all.length - capped.length);
  const accepted: T[] = [];
  const rejected: Array<{ file: T; reason: PhotoValidationFailure }> = [];

  for (const file of capped) {
    const check = validatePhotoFile(file);
    if (check.valid) {
      accepted.push(file);
    } else {
      rejected.push({ file, reason: check.reason });
    }
  }

  return { accepted, rejected, truncatedCount };
}
