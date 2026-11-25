import { describe, expect, it, vi } from "vitest";
import { createMuralApiGateway } from "./mural-api-gateway";

const DRAFT = {
  id: "c0f5f693-7160-4e49-9d76-cfaba4edce1c",
  status: "DRAFT",
  version: 1,
  title: "Aniversário da Sofia",
  description: null,
  createdAt: "2026-10-24T12:00:00Z",
  updatedAt: "2026-10-24T12:00:00Z",
};

describe("createMuralApiGateway (MEM-002-API-01..03)", () => {
  it("creates a draft with the idempotency key and contract payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(DRAFT, { status: 201 }));
    const gateway = createMuralApiGateway("http://localhost:8080/api/v1", fetchMock);

    await expect(
      gateway.createDraft(
        { title: "Aniversário da Sofia", description: null },
        "644d8bbf-1498-4e29-8e75-9142b2a4c9c1",
      ),
    ).resolves.toEqual(DRAFT);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/murals",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "644d8bbf-1498-4e29-8e75-9142b2a4c9c1",
        }),
        body: JSON.stringify({
          title: "Aniversário da Sofia",
          description: null,
        }),
      }),
    );
  });

  it("lists with the selected status and opaque cursor", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ items: [DRAFT], nextCursor: "eyJj1" }),
    );
    const gateway = createMuralApiGateway("http://localhost:8080/api/v1", fetchMock);

    await expect(
      gateway.listMurals({ limit: 20, status: "PUBLISHED", cursor: "opaque-cursor" }),
    ).resolves.toEqual({ items: [DRAFT], nextCursor: "eyJj1" });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.pathname).toBe("/api/v1/murals");
    expect(requestUrl.searchParams.get("limit")).toBe("20");
    expect(requestUrl.searchParams.get("status")).toBe("PUBLISHED");
    expect(requestUrl.searchParams.get("cursor")).toBe("opaque-cursor");
  });

  it("preserves field and stable code from a validation Problem Details response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          type: "about:blank",
          title: "Unprocessable Entity",
          status: 422,
          detail: "O nome do mural deve ter entre 1 e 100 caracteres.",
          code: "invalid_mural_title",
          field: "title",
          traceId: "f98f4b86-302a-4ca3-a9dd-19f8dcae3550",
        },
        { status: 422, headers: { "Content-Type": "application/problem+json" } },
      ),
    );
    const gateway = createMuralApiGateway("http://localhost:8080/api/v1", fetchMock);

    await expect(
      gateway.createDraft({ title: "", description: null }, "644d8bbf-1498-4e29-8e75-9142b2a4c9c1"),
    ).rejects.toMatchObject({
      status: 422,
      field: "title",
      code: "invalid_mural_title",
    });
  });

  it("reorders photos with the current ETag and walks every grant page without keeping the secret", async () => {
    const muralId = "c0f5f693-7160-4e49-9d76-cfaba4edce1c";
    const firstGrant = {
      grantId: "11111111-1111-4111-8111-111111111111",
      scope: "VIEW",
      status: "ACTIVE",
      createdAt: "2026-10-24T12:00:00Z",
      expiresAt: null,
      revokedAt: null,
      shareUrl: "http://localhost:3000/m/secret-token",
      tokenReturned: true,
    };
    const secondGrant = {
      ...firstGrant,
      grantId: "22222222-2222-4222-8222-222222222222",
      shareUrl: "http://localhost:3000/m/other-secret",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 200, headers: { ETag: '"4"' } }))
      .mockResolvedValueOnce(Response.json({ items: [firstGrant], nextCursor: "page-2" }))
      .mockResolvedValueOnce(Response.json({ items: [secondGrant], nextCursor: null }));
    const gateway = createMuralApiGateway("http://localhost:8080/api/v1", fetchMock);

    await expect(
      gateway.reorderPhotos(muralId, [secondGrant.grantId, firstGrant.grantId], 3),
    ).resolves.toBe(4);
    await expect(gateway.listViewGrants(muralId)).resolves.toEqual([
      {
        grantId: firstGrant.grantId,
        scope: "VIEW",
        status: "ACTIVE",
        createdAt: firstGrant.createdAt,
        expiresAt: null,
        revokedAt: null,
      },
      {
        grantId: secondGrant.grantId,
        scope: "VIEW",
        status: "ACTIVE",
        createdAt: secondGrant.createdAt,
        expiresAt: null,
        revokedAt: null,
      },
    ]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8080/api/v1/murals/" + muralId + "/photos/order",
    );
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      method: "PUT",
      headers: expect.objectContaining({ "If-Match": '"3"' }),
    }));
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("cursor=page-2");
  });
});
