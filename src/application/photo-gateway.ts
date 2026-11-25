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
  thumbnailUrl?: string;
  previewExpiresAt: string;
};

export type PhotoListPage = {
  items: SavedPhoto[];
  nextCursor: string | null;
};

export interface PhotoGateway {
  listPhotos(): Promise<SavedPhoto[]>;
  listPhotosPage?(query?: { limit?: number; cursor?: string | null }): Promise<PhotoListPage>;
  createUploadIntent(file: File): Promise<PhotoUploadIntent>;
  uploadFile(intent: PhotoUploadIntent, file: File): Promise<void>;
  completeUpload(uploadId: string): Promise<SavedPhoto>;
  deletePhoto(photoId: string): Promise<void>;
}
