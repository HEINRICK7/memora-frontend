import { z } from "zod";
import type {
  PhotoGateway,
  PhotoUploadIntent,
  SavedPhoto,
} from "../application/photo-gateway";
import { requestHeadersWithCsrf } from "./csrf-headers";

const uploadIntentSchema = z.object({
  uploadId: z.string().min(1),
  method: z.literal("PUT"),
  uploadUrl: z.string().url(),
  requiredHeaders: z.record(z.string(), z.string()),
  expiresAt: z.string().min(1),
});

const savedPhotoSchema = z.object({
  id: z.string().min(1),
  status: z.literal("READY"),
  contentType: z.enum(["image/jpeg", "image/png"]),
  sizeBytes: z.number().int().positive(),
  previewUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  previewExpiresAt: z.string().min(1),
});

const photoListSchema = z.object({
  items: z.array(savedPhotoSchema),
  nextCursor: z.string().nullable().optional().default(null),
});

const DEFAULT_API_BASE_URL = "/api/v1";

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MEMORA_API_URL;
  return (configured || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function communicationError(): Error {
  return new Error("Não foi possível comunicar com o Memora. Tente novamente.");
}

export function createPhotoApiGateway(
  baseUrl = getApiBaseUrl(),
  fetcher: typeof fetch = fetch,
): PhotoGateway {
  const apiUrl = baseUrl.replace(/\/+$/, "");

  async function requestJson<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetcher(apiUrl + path, {
        cache: "no-store",
        ...init,
        credentials: "same-origin",
        headers: requestHeadersWithCsrf(init?.method, init?.headers),
      });
    } catch {
      throw communicationError();
    }

    if (!response.ok) {
      throw communicationError();
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw communicationError();
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
      throw communicationError();
    }

    return result.data;
  }

  return {
    async createUploadIntent(file: File): Promise<PhotoUploadIntent> {
      return requestJson(
        "/uploads",
        uploadIntentSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          }),
        },
      );
    },

    async uploadFile(intent, file): Promise<void> {
      let response: Response;
      try {
        response = await fetcher(intent.uploadUrl, {
          method: intent.method,
          headers: intent.requiredHeaders,
          body: file,
        });
      } catch {
        throw communicationError();
      }

      if (!response.ok) {
        throw communicationError();
      }
    },

    async completeUpload(uploadId: string): Promise<SavedPhoto> {
      return requestJson(
        "/uploads/" + encodeURIComponent(uploadId) + "/complete",
        savedPhotoSchema,
        { method: "POST" },
      );
    },

    async listPhotos(): Promise<SavedPhoto[]> {
      const result = await requestJson("/photos", photoListSchema);
      return result.items;
    },

    async listPhotosPage(query?: { limit?: number; cursor?: string | null }) {
      const params = new URLSearchParams();
      if (query?.limit) params.set("limit", String(query.limit));
      if (query?.cursor) params.set("cursor", query.cursor);
      const suffix = params.toString() ? "?" + params.toString() : "";
      const result = await requestJson("/photos" + suffix, photoListSchema);
      return { items: result.items, nextCursor: result.nextCursor ?? null };
    },

    async deletePhoto(photoId: string): Promise<void> {
      let response: Response;
      try {
        response = await fetcher(
          apiUrl + "/photos/" + encodeURIComponent(photoId),
          {
            method: "DELETE",
            credentials: "same-origin",
            headers: requestHeadersWithCsrf("DELETE"),
          },
        );
      } catch {
        throw communicationError();
      }

      if (!response.ok && response.status !== 404) {
        throw communicationError();
      }
    },
  };
}

export const photoApiGateway = createPhotoApiGateway();
