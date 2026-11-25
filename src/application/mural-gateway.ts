import type {
  MuralDraftField,
  NormalizedMuralDraftInput,
} from "../domain/murals/mural-draft-input";

export type MuralStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type MuralSummary = {
  id: string;
  status: MuralStatus;
  version: number;
  title: string;
  description: string | null;
  coverPhotoId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MuralPage = {
  items: MuralSummary[];
  nextCursor: string | null;
};

export type MuralListQuery = {
  limit: number;
  status?: MuralStatus;
  cursor?: string;
};

export type MuralPhotoItem = {
  photoId: string;
  position: number;
  contentType: string;
  sizeBytes: number;
  previewUrl: string;
  thumbnailUrl?: string;
  previewExpiresAt: string;
};

export type MuralPhotoPage = {
  muralVersion: number;
  items: MuralPhotoItem[];
};

export type GrantScope = "VIEW" | "CONTRIBUTE";

export type ViewGrant = {
  grantId: string;
  scope: GrantScope;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  shareUrl?: string | null;
  tokenReturned?: boolean;
};

export type SharedPhoto = {
  photoId: string;
  position: number;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  previewUrl: string;
  thumbnailUrl?: string;
  previewExpiresAt: string;
  ownedByGuest?: boolean;
  authorName?: string | null;
};

export type SharedMural = {
  mural: {
    title: string;
    description: string | null;
    coverPhotoId: string | null;
    logoUrl?: string | null;
    logoExpiresAt?: string | null;
    photos: SharedPhoto[];
    totalPhotos?: number;
    nextOffset?: number | null;
  };
  permissions: {
    canView: boolean;
    canContribute: boolean;
    moderationRequired?: boolean;
  };
};

export type ContributionStatus = "UPLOADING" | "READY" | "PENDING" | "PUBLISHED" | "APPROVED" | "REJECTED" | "FAILED";

export type ContributionReceipt = {
  contributionId: string;
  photoId?: string | null;
  status: ContributionStatus;
};

export type ContributionItem = ContributionReceipt & {
  displayName: string | null;
  createdAt: string;
  previewUrl: string | null;
  previewExpiresAt: string | null;
};

export interface MuralGateway {
  createDraft(
    input: NormalizedMuralDraftInput,
    idempotencyKey: string,
  ): Promise<MuralSummary>;
  listMurals(query: MuralListQuery): Promise<MuralPage>;
  getMural(muralId: string): Promise<MuralSummary>;
}

export interface MuralAccessGateway extends MuralGateway {
  updateMural(
    muralId: string,
    version: number,
    patch: { title?: string; description?: string | null; coverPhotoId?: string | null },
  ): Promise<MuralSummary>;
  listMuralPhotos(muralId: string): Promise<MuralPhotoPage>;
  attachPhoto(muralId: string, photoId: string, version: number): Promise<number>;
  reorderPhotos(muralId: string, photoIds: string[], version: number): Promise<number>;
  removePhoto(muralId: string, photoId: string, version: number): Promise<number>;
  publishMural(muralId: string, version: number, idempotencyKey: string): Promise<MuralSummary>;
  createViewGrant(
    muralId: string,
    idempotencyKey: string,
    expiresAt: string | null,
    scope?: GrantScope,
  ): Promise<ViewGrant & { replayed: boolean }>;
  listViewGrants(muralId: string): Promise<ViewGrant[]>;
  revokeViewGrant(muralId: string, grantId: string): Promise<void>;
  getSharedMural(
    shareToken: string,
    query?: { limit?: number; offset?: number },
    guestToken?: string | null,
  ): Promise<SharedMural>;
  submitContribution(
    shareToken: string,
    file: File,
    displayName: string | null,
    guestToken?: string,
  ): Promise<ContributionReceipt>;
  deleteGuestPhoto?(shareToken: string, photoId: string, guestToken: string): Promise<void>;
  listContributions(muralId: string): Promise<ContributionItem[]>;
  createGuestAlbum?(shareToken: string, guestToken: string, displayName: string | null): Promise<void>;
  getGuestAlbum?(shareToken: string, guestToken: string): Promise<ContributionItem[]>;
  publishGuestPhotos?(shareToken: string, guestToken: string, contributionIds: string[]): Promise<ContributionReceipt[]>;
  getQrLogo?(muralId: string): Promise<{ logoUrl: string | null; logoExpiresAt: string | null }>;
  saveQrLogo?(muralId: string, logoDataUrl: string): Promise<void>;
  deleteQrLogo?(muralId: string): Promise<void>;
  /** Legacy method retained for callers compiled against the older contribution contract. */
  approveContribution(muralId: string, contributionId: string): Promise<ContributionItem>;
  /** Legacy method retained for callers compiled against the older contribution contract. */
  rejectContribution(muralId: string, contributionId: string): Promise<ContributionItem>;
}

export class MuralGatewayError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: MuralDraftField;
  readonly traceId?: string;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    field?: MuralDraftField;
    traceId?: string;
  }) {
    super(args.message);
    this.name = "MuralGatewayError";
    this.status = args.status;
    this.code = args.code ?? "mural_request_failed";
    this.field = args.field;
    this.traceId = args.traceId;
  }
}
