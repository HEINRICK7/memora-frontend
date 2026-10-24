import type { PhotoGateway, SavedPhoto } from "./photo-gateway";

type SavePhotoGateway = Pick<
  PhotoGateway,
  "createUploadIntent" | "uploadFile" | "completeUpload"
>;

const SAVE_ERROR_MESSAGE =
  "Não foi possível guardar esta fotografia. Tente novamente.";

export async function savePhoto(
  file: File,
  gateway: SavePhotoGateway,
): Promise<SavedPhoto> {
  try {
    const intent = await gateway.createUploadIntent(file);
    await gateway.uploadFile(intent, file);
    const savedPhoto = await gateway.completeUpload(intent.uploadId);

    if (savedPhoto.status !== "READY") {
      throw new Error("Photo is not ready");
    }

    return savedPhoto;
  } catch {
    // Never propagate fetch errors that may include a signed URL.
    throw new Error(SAVE_ERROR_MESSAGE);
  }
}
