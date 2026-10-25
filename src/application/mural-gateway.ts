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

export interface MuralGateway {
  createDraft(
    input: NormalizedMuralDraftInput,
    idempotencyKey: string,
  ): Promise<MuralSummary>;
  listMurals(query: MuralListQuery): Promise<MuralPage>;
  getMural(muralId: string): Promise<MuralSummary>;
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
