import type {
  CompositionExportOptions,
} from "../../domain/compositions/composition-export";
import type { CompositionDocument } from "../../domain/compositions/composition-document";
import type { TemplateDefinition } from "../../domain/templates/template-catalog";

export type CompositionExportPhase =
  | "PREPARING"
  | "LOADING_PHOTOS"
  | "RENDERING"
  | "ENCODING"
  | "READY"
  | "DOWNLOADING"
  | "COMPLETE"
  | "CANCELLED"
  | "ERROR";

export type CompositionExportProgress = Readonly<{
  phase: CompositionExportPhase;
  completedPhotos?: number;
  totalPhotos?: number;
}>;

export type ExportPhotoSource = Readonly<{
  assetId: string;
  previewUrl: string;
  previewExpiresAt: string;
}>;

export type RenderCompositionRequest = Readonly<{
  document: CompositionDocument;
  template: TemplateDefinition;
  photos: ReadonlyMap<string, ExportPhotoSource>;
  options: CompositionExportOptions;
  signal: AbortSignal;
  onProgress?: (progress: CompositionExportProgress) => void;
}>;

export type CompositionExportResult = Readonly<{
  blob: Blob;
  mimeType: CompositionExportOptions["format"];
  width: number;
  height: number;
  fileName: string;
}>;

export interface CompositionExportRenderer {
  render(request: RenderCompositionRequest): Promise<CompositionExportResult>;
}
