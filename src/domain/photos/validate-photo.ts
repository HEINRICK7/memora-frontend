export const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;

export type PhotoValidationFailure =
  | "unsupported-type"
  | "empty"
  | "too-large";

export type PhotoValidationResult =
  | { valid: true }
  | { valid: false; reason: PhotoValidationFailure };

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export function validatePhotoFile(
  file: Pick<File, "type" | "size">,
): PhotoValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
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
