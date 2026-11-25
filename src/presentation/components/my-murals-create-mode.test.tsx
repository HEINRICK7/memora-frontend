import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MyMurals } from "./my-murals";
import type { MuralGateway } from "../../application/mural-gateway";

describe("MyMurals create mode", () => {
  it("keeps the create form visible in create mode and omits the redundant empty-state /criar link", async () => {
    const gateway = {
      listMurals: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    } as unknown as MuralGateway;

    const { container } = render(<MyMurals gateway={gateway} mode="create" />);

    await waitFor(() => {
      expect(screen.getByText("Você ainda não criou nenhum aniversário.")).toBeTruthy();
    });

    const root = container.firstElementChild;
    expect(root?.className).toContain("createMode");
    expect(screen.getByRole("heading", { name: "Criar aniversário" })).toBeTruthy();
    expect(screen.getByLabelText("Nome da festa")).toBeTruthy();
    const emptyRegion = screen.getByRole("region", { name: "Você ainda não criou nenhum aniversário." });
    expect(within(emptyRegion).queryByRole("link", { name: "Criar aniversário" })).toBeNull();
  });
});
