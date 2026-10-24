import { z } from "zod";
import type { MuralGateway, MuralListQuery } from "../application/mural-gateway";
import { MuralGatewayError } from "../application/mural-gateway";
import { countUnicodeCodePoints } from "../domain/murals/mural-draft-input";

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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const muralPageSchema = z.object({
  items: z.array(muralSummarySchema),
  nextCursor: z.string().max(128).nullable(),
});

const problemSchema = z.object({
  status: z.number().int().optional(),
  detail: z.string().optional(),
  code: z.string().optional(),
  field: z.enum(["title", "description"]).optional(),
  traceId: z.string().optional(),
});

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

function apiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MEMORA_API_URL || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

function genericMessage(status: number): string {
  if (status === 401) return "Acesso indisponível neste ambiente.";
  return "Não foi possível comunicar com o Memora. Tente novamente.";
}

export function createMuralApiGateway(
  baseUrl = apiBaseUrl(),
  fetcher: typeof fetch = fetch,
): MuralGateway {
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
  };
}

export const muralApiGateway = createMuralApiGateway();
