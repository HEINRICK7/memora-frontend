import { z } from "zod";
import type {
  MuralAccessGateway,
  MuralGateway,
  MuralListQuery,
  MuralPhotoPage,
  MuralSummary,
  SharedMural,
  ContributionItem,
  ViewGrant,
} from "../application/mural-gateway";
import { MuralGatewayError } from "../application/mural-gateway";
import { countUnicodeCodePoints } from "../domain/murals/mural-draft-input";
import { requestHeadersWithCsrf } from "./csrf-headers";

const muralSummarySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  version: z.number().int().positive(),
  title: z.string().refine((value) => {
    const length = countUnicodeCodePoints(value);
    return length >= 1 && length <= 100;
  }),
  description: z.string().nullable().refine((value) => {
    if (value === null) return true;
    return value.trim().length > 0 && countUnicodeCodePoints(value) <= 500;
  }),
  coverPhotoId: z.string().uuid().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const muralPageSchema = z.object({
  items: z.array(muralSummarySchema),
  nextCursor: z.string().max(128).nullable(),
});

const muralPhotoPageSchema = z.object({
  muralVersion: z.number().int().positive(),
  items: z.array(
    z.object({
      photoId: z.string().uuid(),
      position: z.number().int().nonnegative(),
      contentType: z.string(),
      sizeBytes: z.number().int().positive(),
      previewUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      previewExpiresAt: z.string(),
    }),
  ),
});

const viewGrantSchema = z.object({
  grantId: z.string().uuid(),
  scope: z.enum(["VIEW", "CONTRIBUTE"]),
  status: z.enum(["ACTIVE", "EXPIRED", "REVOKED"]),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  shareUrl: z.string().url().nullable().optional(),
  tokenReturned: z.boolean().optional(),
});

const sharedMuralSchema = z.object({
  mural: z.object({
    title: z.string(),
    description: z.string().nullable(),
    coverPhotoId: z.string().uuid().nullable(),
    logoUrl: z.string().url().nullable().optional().default(null),
    logoExpiresAt: z.string().datetime().nullable().optional().default(null),
    photos: z.array(
      z.object({
        photoId: z.string().uuid(),
        position: z.number().int().nonnegative(),
        contentType: z.string(),
        sizeBytes: z.number().int().positive(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        previewUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        previewExpiresAt: z.string().datetime(),
        ownedByGuest: z.boolean().optional().default(false),
        authorName: z.string().nullable().optional().default(null),
      }),
    ),
    totalPhotos: z.number().int().nonnegative().optional(),
    nextOffset: z.number().int().nonnegative().nullable().optional(),
  }),
  permissions: z.object({
    canView: z.literal(true),
    canContribute: z.boolean(),
    moderationRequired: z.literal(false).optional().default(false),
  }),
});

const contributionStatusSchema = z.enum([
  "UPLOADING", "READY", "PENDING", "PUBLISHED", "APPROVED", "REJECTED", "FAILED",
]);

const contributionItemSchema = z.object({
  contributionId: z.string().uuid(),
  status: contributionStatusSchema,
  displayName: z.string().nullable(),
  createdAt: z.string().datetime(),
  previewUrl: z.string().url().nullable(),
  previewExpiresAt: z.string().datetime().nullable(),
});

const problemSchema = z.object({
  status: z.number().int().optional(),
  detail: z.string().optional(),
  code: z.string().optional(),
  field: z.enum(["title", "description"]).optional(),
  traceId: z.string().optional(),
});

const DEFAULT_API_BASE_URL = "/api/v1";

function apiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MEMORA_API_URL || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

function genericMessage(status: number): string {
  if (status === 401) return "Acesso indisponível neste ambiente.";
  return "Não foi possível comunicar com o Memora. Tente novamente.";
}

function etagVersion(response: Response, fallback: number): number {
  const etag = response.headers.get("etag");
  const match = etag?.match(/^"([1-9][0-9]*)"$/);
  return match ? Number(match[1]) : fallback;
}

export function createMuralApiGateway(
  baseUrl = apiBaseUrl(),
  fetcher: typeof fetch = fetch,
): MuralAccessGateway {
  const base = baseUrl.replace(/\/+$/, "");

  async function requestJson<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(base + path, {
        cache: "no-store",
        ...init,
        credentials: "same-origin",
        headers: requestHeadersWithCsrf(init?.method, init?.headers),
      });
    } catch {
      throw new MuralGatewayError({
        message: "Não foi possível comunicar com o Memora. Tente novamente.",
        status: 503,
        code: "network_unavailable",
      });
    }

    if (!response.ok) {
      let problem: z.infer<typeof problemSchema> = {};
      try {
        problem = problemSchema.parse(await response.json());
      } catch {
        // Keep the response status while avoiding raw server/network details.
      }

      const detail = response.status === 422 ? problem.detail : undefined;
      throw new MuralGatewayError({
        message: detail || genericMessage(response.status),
        status: response.status,
        code: problem.code,
        field: problem.field,
        traceId: problem.traceId,
      });
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new MuralGatewayError({
        message: "A resposta do Memora está indisponível. Tente novamente.",
        status: 502,
        code: "invalid_api_response",
      });
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new MuralGatewayError({
        message: "A resposta do Memora está indisponível. Tente novamente.",
        status: 502,
        code: "invalid_api_response",
      });
    }

    return result.data;
  }

  return {
    async createDraft(input, idempotencyKey) {
      return requestJson(
        "/murals",
        muralSummarySchema,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(input),
        },
      );
    },

    async listMurals(query: MuralListQuery) {
      const params = new URLSearchParams();
      params.set("limit", String(query.limit));
      if (query.status) params.set("status", query.status);
      if (query.cursor) params.set("cursor", query.cursor);

      return requestJson(
        "/murals?" + params.toString(),
        muralPageSchema,
        { method: "GET" },
      );
    },

    async getMural(muralId: string) {
      return requestJson(
        "/murals/" + encodeURIComponent(muralId),
        muralSummarySchema,
        { method: "GET" },
      );
    },

    async updateMural(muralId, version, patch) {
      return requestJson("/murals/" + encodeURIComponent(muralId), muralSummarySchema, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "If-Match": `"${version}"`,
        },
        body: JSON.stringify(patch),
      });
    },

    async listMuralPhotos(muralId) {
      return requestJson(
        "/murals/" + encodeURIComponent(muralId) + "/photos",
        muralPhotoPageSchema,
      );
    },

    async attachPhoto(muralId, photoId, version) {
      const response = await requestResponse(
        "/murals/" + encodeURIComponent(muralId) + "/photos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "If-Match": `"${version}"`,
          },
          body: JSON.stringify({ photoId }),
        },
      );
      return etagVersion(response, version + 1);
    },

    async reorderPhotos(muralId, photoIds, version) {
      const response = await requestResponse(
        "/murals/" + encodeURIComponent(muralId) + "/photos/order",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Match": `"${version}"`,
          },
          body: JSON.stringify({ photoIds }),
        },
      );
      return etagVersion(response, version + 1);
    },

    async removePhoto(muralId, photoId, version) {
      const response = await requestResponse(
        "/murals/" + encodeURIComponent(muralId) + "/photos/" + encodeURIComponent(photoId),
        {
          method: "DELETE",
          headers: { "If-Match": `"${version}"` },
        },
      );
      return etagVersion(response, version + 1);
    },

    async publishMural(muralId, version, idempotencyKey) {
      return requestJson(
        "/murals/" + encodeURIComponent(muralId) + "/publish",
        muralSummarySchema,
        {
          method: "POST",
          headers: {
            "If-Match": `"${version}"`,
            "Idempotency-Key": idempotencyKey,
          },
        },
      );
    },

    async createViewGrant(muralId, idempotencyKey, expiresAt, scope = "VIEW") {
      const response = await requestResponse(
        "/murals/" + encodeURIComponent(muralId) + "/grants",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({ scope, expiresAt }),
        },
      );
      const grant = viewGrantSchema.parse(await response.json());
      return { ...grant, replayed: response.headers.get("idempotency-replayed") === "true" };
    },

    async listViewGrants(muralId) {
      const pageSchema = z.object({
        items: z.array(viewGrantSchema),
        nextCursor: z.string().nullable(),
      });
      const items: ViewGrant[] = [];
      const seenCursors = new Set<string>();
      let cursor: string | null = null;
      for (let page = 0; page < 20; page += 1) {
        const path: string = cursor
          ? "/murals/" + encodeURIComponent(muralId) + "/grants?cursor=" + encodeURIComponent(cursor)
          : "/murals/" + encodeURIComponent(muralId) + "/grants";
        const result: { items: ViewGrant[]; nextCursor: string | null } = await requestJson(path, pageSchema);
        for (const grant of result.items) {
          items.push({
            grantId: grant.grantId,
            scope: grant.scope,
            status: grant.status,
            createdAt: grant.createdAt,
            expiresAt: grant.expiresAt,
            revokedAt: grant.revokedAt,
          });
        }
        if (!result.nextCursor || seenCursors.has(result.nextCursor)) {
          return items;
        }
        seenCursors.add(result.nextCursor);
        cursor = result.nextCursor;
      }
      return items;
    },

    async revokeViewGrant(muralId, grantId) {
      await requestResponse(
        "/murals/" + encodeURIComponent(muralId) + "/grants/" + encodeURIComponent(grantId),
        { method: "DELETE" },
      );
    },

    async getQrLogo(muralId) {
      return requestJson(
        "/murals/" + encodeURIComponent(muralId) + "/qr-logo",
        z.object({
          logoUrl: z.string().url().nullable(),
          logoExpiresAt: z.string().datetime().nullable(),
        }),
      );
    },

    async saveQrLogo(muralId, logoDataUrl) {
      await requestJson(
        "/murals/" + encodeURIComponent(muralId) + "/qr-logo",
        z.object({
          logoUrl: z.string().url().nullable(),
          logoExpiresAt: z.string().datetime().nullable(),
        }),
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logoDataUrl }) },
      );
    },

    async deleteQrLogo(muralId) {
      await requestResponse("/murals/" + encodeURIComponent(muralId) + "/qr-logo", { method: "DELETE" });
    },

    async getSharedMural(shareToken, query, guestToken) {
      const params = new URLSearchParams();
      if (query?.limit) params.set("limit", String(query.limit));
      if (query?.offset) params.set("offset", String(query.offset));
      const suffix = params.toString() ? "?" + params.toString() : "";
      const init = guestToken ? { headers: { "X-Guest-Album-Token": guestToken } } : undefined;
      return requestJson(
        "/shared/" + encodeURIComponent(shareToken) + suffix,
        sharedMuralSchema,
        init,
      );
    },

    async createGuestAlbum(shareToken, guestToken, displayName) {
      await requestJson(
        "/shared/" + encodeURIComponent(shareToken) + "/guest-album",
        z.object({ displayName: z.string().nullable() }),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestToken, displayName }),
        },
      );
    },

    async getGuestAlbum(shareToken, guestToken) {
      const result = await requestJson(
        "/shared/" + encodeURIComponent(shareToken) + "/guest-album",
        z.object({ items: z.array(contributionItemSchema) }),
        { headers: { "X-Guest-Album-Token": guestToken } },
      );
      return result.items;
    },

    async publishGuestPhotos(shareToken, guestToken, contributionIds) {
      const result = await requestJson(
        "/shared/" + encodeURIComponent(shareToken) + "/guest-album/publish",
        z.object({ items: z.array(z.object({ contributionId: z.string().uuid(), status: contributionStatusSchema })) }),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Guest-Album-Token": guestToken,
          },
          body: JSON.stringify({ contributionIds }),
        },
      );
      return result.items;
    },

    async submitContribution(shareToken, file, displayName, guestToken) {
      if (!guestToken) {
        throw new MuralGatewayError({
          message: "Não foi possível preparar o envio. Tente novamente.",
          status: 400,
          code: "guest_album_required",
        });
      }
      const intent = await requestJson(
        "/shared/" + encodeURIComponent(shareToken) + "/guest-album/contributions",
        z.object({
          contributionId: z.string().uuid(),
          method: z.literal("PUT"),
          uploadUrl: z.string().url(),
          headers: z.record(z.string(), z.string()),
          expiresAt: z.string(),
        }),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Guest-Album-Token": guestToken,
          },
          body: JSON.stringify({
            contentType: file.type,
            sizeBytes: file.size,
            displayName,
          }),
        },
      );
      let uploaded: Response;
      try {
        uploaded = await fetcher(intent.uploadUrl, {
          method: intent.method,
          headers: intent.headers,
          body: file,
        });
      } catch {
        throw new MuralGatewayError({
          message: "Não foi possível comunicar com o Memora. Tente novamente.",
          status: 503,
          code: "network_unavailable",
        });
      }
      if (!uploaded.ok) {
        throw new MuralGatewayError({
          message: "Não foi possível enviar a fotografia.",
          status: uploaded.status,
          code: "contribution_upload_failed",
        });
      }
      return requestJson(
        "/shared/" + encodeURIComponent(shareToken) + "/guest-album/contributions/"
          + encodeURIComponent(intent.contributionId) + "/complete?autoPublish=true",
        z.object({
          contributionId: z.string().uuid(),
          photoId: z.string().uuid().nullable().optional(),
          status: contributionStatusSchema,
        }),
        { method: "POST", headers: { "X-Guest-Album-Token": guestToken } },
      );
    },

    async deleteGuestPhoto(shareToken, photoId, guestToken) {
      await requestResponse(
        "/shared/" + encodeURIComponent(shareToken) + "/guest-album/photos/"
          + encodeURIComponent(photoId),
        {
          method: "DELETE",
          headers: { "X-Guest-Album-Token": guestToken },
        },
      );
    },

    async listContributions(muralId) {
      const page: { items: ContributionItem[] } = await requestJson(
        "/murals/" + encodeURIComponent(muralId) + "/contributions",
        z.object({
          items: z.array(z.object({
            contributionId: z.string().uuid(),
            status: contributionStatusSchema,
            displayName: z.string().nullable(),
            createdAt: z.string().datetime(),
            previewUrl: z.string().url().nullable(),
            previewExpiresAt: z.string().datetime().nullable(),
          })),
        }),
      );
      return page.items;
    },

    async approveContribution() {
      throw new MuralGatewayError({
        message: "As fotos do aniversário entram direto no álbum.",
        status: 409,
        code: "automatic_publication",
      });
    },

    async rejectContribution() {
      throw new MuralGatewayError({
        message: "As fotos do aniversário entram direto no álbum.",
        status: 409,
        code: "automatic_publication",
      });
    },

  };

  async function requestResponse(path: string, init?: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetcher(base + path, {
        cache: "no-store",
        ...init,
        credentials: "same-origin",
        headers: requestHeadersWithCsrf(init?.method, init?.headers),
      });
    } catch {
      throw new MuralGatewayError({
        message: "Não foi possível comunicar com o Memora. Tente novamente.",
        status: 503,
        code: "network_unavailable",
      });
    }
    if (!response.ok) {
      let problem: z.infer<typeof problemSchema> = {};
      try {
        problem = problemSchema.parse(await response.json());
      } catch {
        // Keep the response status while avoiding raw server details.
      }
      throw new MuralGatewayError({
        message: problem.detail || genericMessage(response.status),
        status: response.status,
        code: problem.code,
        field: problem.field,
        traceId: problem.traceId,
      });
    }
    return response;
  }
}

export const muralApiGateway = createMuralApiGateway();
