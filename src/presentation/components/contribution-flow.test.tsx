import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MuralAccessGateway, SharedMural } from "../../application/mural-gateway";
import { ContributionQueue } from "./contribution-queue";
import { SharedMuralView } from "./shared-mural-view";

const SHARED: SharedMural = {
  mural: {
    title: "Festa",
    description: null,
    coverPhotoId: null,
    photos: [],
  },
  permissions: { canView: true, canContribute: false, moderationRequired: true },
};

afterEach(() => cleanup());

describe("collaborative mural", () => {
  it("hides the upload when the link is view only", async () => {
    render(<SharedMuralView shareToken="token" loadShared={async () => SHARED} />);
    expect(await screen.findByRole("heading", { name: "Festa" })).toBeTruthy();
    expect(screen.queryByText("Adicionar minhas fotos")).toBeNull();
  });

  it("publishes an accepted file directly and keeps a failed sibling in the review sheet", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => "blob:contrib-preview"),
        revokeObjectURL: vi.fn(),
      }),
    );
    const gateway = {
      submitContribution: vi.fn()
        .mockResolvedValueOnce({
          contributionId: "11111111-1111-4111-8111-111111111111",
          photoId: "11111111-1111-4111-8111-111111111111",
          status: "PUBLISHED" as const,
        })
        .mockRejectedValue(new Error("falhou")),
    };
    render(
      <SharedMuralView
        shareToken="token"
        loadShared={async () => ({ ...SHARED, permissions: { canView: true, canContribute: true, moderationRequired: false } })}
        gateway={gateway}
      />,
    );
    const input = await screen.findByLabelText("Escolher fotos da galeria");
    const good = new File([new Uint8Array([1])], "boa.jpg", { type: "image/jpeg" });
    const bad = new File([new Uint8Array([2])], "ruim.jpg", { type: "image/jpeg" });
    await user.upload(input, [good, bad]);
    await user.click(screen.getByRole("button", { name: /enviar para a festa/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/1 foto\(s\) publicada\(s\)/i);
    expect(screen.getByRole("img", { name: "ruim.jpg" })).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("approves a pending contribution", async () => {
    const user = userEvent.setup();
    const gateway = {
      listContributions: vi.fn().mockResolvedValue([
        {
          contributionId: "11111111-1111-4111-8111-111111111111",
          status: "PENDING",
          displayName: "Ana",
          createdAt: "2026-10-24T12:00:00Z",
          previewUrl: null,
          previewExpiresAt: null,
        },
      ]),
      approveContribution: vi.fn().mockResolvedValue({
        contributionId: "11111111-1111-4111-8111-111111111111",
        status: "APPROVED",
        displayName: "Ana",
        createdAt: "2026-10-24T12:00:00Z",
        previewUrl: null,
        previewExpiresAt: null,
      }),
      rejectContribution: vi.fn(),
    } as unknown as MuralAccessGateway;
    render(<ContributionQueue muralId="c0f5f693-7160-4e49-9d76-cfaba4edce1c" gateway={gateway} />);
    await user.click(await screen.findByRole("button", { name: "Aprovar" }));
    expect(gateway.approveContribution).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("mesmo link");
  });
});
