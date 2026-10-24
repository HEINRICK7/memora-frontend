import { describe, expect, it, vi } from "vitest";
import { createMuralDraft } from "./create-mural-draft";

describe("createMuralDraft (MEM-002-AC01)", () => {
  it("normalizes text before sending the request and preserves the idempotency key", async () => {
    const idempotencyKey = "644d8bbf-1498-4e29-8e75-9142b2a4c9c1";
    const draft = {
      id: "c0f5f693-7160-4e49-9d76-cfaba4edce1c",
      status: "DRAFT",
      version: 1,
      title: "Aniversário da Sofia",
      description: null,
      createdAt: "2026-10-24T12:00:00Z",
      updatedAt: "2026-10-24T12:00:00Z",
    };
    const gateway = { createDraft: vi.fn().mockResolvedValue(draft) };

    await expect(
      createMuralDraft(
        { title: "\u2003Aniversário da Sofia\u00a0", description: " \u2028 " },
        gateway,
        idempotencyKey,
      ),
    ).resolves.toEqual(draft);

    expect(gateway.createDraft).toHaveBeenCalledWith(
      { title: "Aniversário da Sofia", description: null },
      idempotencyKey,
    );
  });
});
