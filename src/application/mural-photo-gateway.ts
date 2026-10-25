export type MuralPhotoItem = {
  photoId: string;
  position: number;
  contentType: string;
  sizeBytes: number;
  previewUrl: string;
  previewExpiresAt: string;
};

export type MuralPhotoPage = {
  muralVersion: number;
  items: MuralPhotoItem[];
};

export interface MuralPhotoGateway {
  listMuralPhotos(muralId: string): Promise<MuralPhotoPage>;
}
