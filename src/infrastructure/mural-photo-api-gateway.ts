import { z } from "zod";
import { MuralGatewayError } from "../application/mural-gateway";
import type { MuralPhotoGateway, MuralPhotoPage } from "../application/mural-photo-gateway";

const muralPhotoPageSchema = z.object({
  muralVersion: z.number().int().positive(),
  items: z.array(
    z.object({
      photoId: z.string().uuid(),
      position: z.number().int().nonnegative(),
      contentType: z.string().min(1),
      sizeBytes: z.number().int().positive(),
      previewUrl: z.string().url(),
      previewExpiresAt: z.string().datetime({ offset: true }),
    }),
  ),
});

const problemSchema = z.object({
  status: z.number().int().optional(),
  code: z.string().optional(),
  traceId: z.string().optional(),
});

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_MEMORA_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function messageForStatus(status: number): string {
  if (status === 401 || status === 403 || status === 404) {
    return "As fotos deste mural estão indisponíveis.";
  }
  return "Não foi possível carregar as fotos deste mural. Tente novamente.";
}

export function createMuralPhotoApiGateway(
  baseUrl = apiBaseUrl(),
  fetcher: typeof fetch = fetch,
): MuralPhotoGateway {
  const base = baseUrl.replace(/\/+$/, "");

  return {
    async listMuralPhotos(muralId) {
      let response: Response;
      try {
        response = await fetcher(`${base}/murals/${encodeURIComponent(muralId)}/photos`, {
          cache: "no-store",
          method: "GET",
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
          // Keep the HTTP status without exposing the response body.
        }
        throw new MuralGatewayError({
          message: messageForStatus(response.status),
          status: response.status,
          code: problem.code,
          traceId: problem.traceId,
        });
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new MuralGatewayError({
          message: "A resposta das fotos está indisponível. Tente novamente.",
          status: 502,
          code: "invalid_api_response",
        });
      }

      const result = muralPhotoPageSchema.safeParse(payload);
      if (!result.success) {
        throw new MuralGatewayError({
          message: "A resposta das fotos está indisponível. Tente novamente.",
          status: 502,
          code: "invalid_api_response",
        });
      }

      return result.data as MuralPhotoPage;
    },
  };
}

export const muralPhotoApiGateway = createMuralPhotoApiGateway();
