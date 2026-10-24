export type CreateUploadIntentInput = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type PhotoUploadIntent = {
  uploadId: string;
  method: "PUT";
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
};

export type SavedPhoto = {
  id: string;
  status: "READY";
  contentType: string;
  sizeBytes: number;
  previewUrl: string;
  previewExpiresAt: string;
};

export interface PhotoGateway {
  listPhotos(): Promise<SavedPhoto[]>;
  createUploadIntent(file: File): Promise<PhotoUploadIntent>;
  uploadFile(intent: PhotoUploadIntent, file: File): Promise<void>;
  completeUpload(uploadId: string): Promise<SavedPhoto>;
  deletePhoto(photoId: string): Promise<void>;
}
