import { readFile } from "node:fs/promises";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FiberCanvasProps } from "./fiber-canvas";
import { MeuNiverStage } from "./meu-niver-stage";

afterEach(() => {
  cleanup();
});

describe("Meu Niver 3D page", () => {
  it("shows the static cover and skips the fiber canvas without WebGL", () => {
    const loadCanvas = vi.fn();
    render(<MeuNiverStage webglAvailable={false} loadCanvas={loadCanvas} />);

    expect(screen.getByRole("heading", { name: "Meu Niver" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /colagem estática de meu niver/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar aos templates" })).toHaveAttribute("href", "/templates");
    expect(loadCanvas).not.toHaveBeenCalled();
  });

  it("loads the Meu Niver canvas instead of the empty fiber canvas", async () => {
    const source = await readFile(path.join(process.cwd(), "src/presentation/animated-templates/meu-niver-stage.tsx"), "utf8");
    expect(source).toContain('import("./meu-niver-canvas")');
    expect(source).not.toContain('import("./fiber-canvas")');
  });

  it("opens one looping fiber scene when WebGL is available", async () => {
    const frameloop = { current: null as FiberCanvasProps["frameloop"] | null };
    const loadCanvas = vi.fn(async () => ({
      default: function MockScene(props: FiberCanvasProps) {
        frameloop.current = props.frameloop;
        return <canvas aria-label={props.label} />;
      },
    }));

    render(<MeuNiverStage webglAvailable loadCanvas={loadCanvas} />);

    expect(await screen.findByLabelText("Cena Meu Niver 3D")).toBeInTheDocument();
    expect(frameloop.current).toBe("always");
    expect(screen.queryByRole("img", { name: /colagem estática/i })).not.toBeInTheDocument();
  });
});
