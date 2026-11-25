import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FiberCanvasProps } from "./fiber-canvas";
import { AnimatedTemplateStage } from "./animated-template-stage";

afterEach(() => {
  cleanup();
});

function canvasModule(frameloop: { current: FiberCanvasProps["frameloop"] | null }) {
  return {
    default: function MockFiberCanvas(props: FiberCanvasProps) {
      frameloop.current = props.frameloop;
      return <canvas aria-label={props.label} />;
    },
  };
}

describe("animated template stage (MEM-ANI-004..006)", () => {
  it("keeps the static fallback and does not load the fiber canvas without WebGL", () => {
    const loadCanvas = vi.fn();
    render(
      <AnimatedTemplateStage
        label="Cena animada"
        webglAvailable={false}
        loadCanvas={loadCanvas}
        fallback={<p>Fotos do mural</p>}
      />,
    );

    expect(screen.getByText("Fotos do mural")).toBeInTheDocument();
    expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
    expect(loadCanvas).not.toHaveBeenCalled();
  });

  it("loads one fiber canvas on demand when WebGL is available", async () => {
    const frameloop = { current: null as FiberCanvasProps["frameloop"] | null };
    const loadCanvas = vi.fn(async () => canvasModule(frameloop));
    render(
      <AnimatedTemplateStage
        label="Cena animada"
        webglAvailable
        loadCanvas={loadCanvas}
        fallback={<p>Fotos do mural</p>}
      />,
    );

    const canvas = await screen.findByLabelText("Cena animada");
    expect(canvas.tagName).toBe("CANVAS");
    expect(loadCanvas).toHaveBeenCalledOnce();
    expect(frameloop.current).toBe("demand");
    expect(screen.queryByText("Fotos do mural")).not.toBeInTheDocument();
  });

  it("loops the fiber canvas when the scene asks to play", async () => {
    const frameloop = { current: null as FiberCanvasProps["frameloop"] | null };
    const loadCanvas = vi.fn(async () => canvasModule(frameloop));
    render(
      <AnimatedTemplateStage
        label="Cena animada"
        webglAvailable
        playback="loop"
        loadCanvas={loadCanvas}
        fallback={<p>Fotos do mural</p>}
      />,
    );

    await screen.findByLabelText("Cena animada");
    expect(frameloop.current).toBe("always");
  });

  it("mounts the canvas paused when reduced motion is requested", async () => {
    const frameloop = { current: null as FiberCanvasProps["frameloop"] | null };
    const loadCanvas = vi.fn(async () => canvasModule(frameloop));
    render(
      <AnimatedTemplateStage
        label="Cena animada"
        webglAvailable
        reducedMotion
        loadCanvas={loadCanvas}
        fallback={<p>Fotos do mural</p>}
      />,
    );

    await screen.findByLabelText("Cena animada");
    expect(frameloop.current).toBe("never");
  });

  it("removes the canvas when the stage unmounts", async () => {
    const frameloop = { current: null as FiberCanvasProps["frameloop"] | null };
    const loadCanvas = vi.fn(async () => canvasModule(frameloop));
    const view = render(
      <AnimatedTemplateStage
        label="Cena animada"
        webglAvailable
        loadCanvas={loadCanvas}
        fallback={<p>Fotos do mural</p>}
      />,
    );

    await screen.findByLabelText("Cena animada");
    view.unmount();
    expect(screen.queryByLabelText("Cena animada")).not.toBeInTheDocument();
  });

  it("does not import three from the stage, domain, or application", async () => {
    const stage = await readFile(
      path.join(process.cwd(), "src/presentation/animated-templates/animated-template-stage.tsx"),
      "utf8",
    );
    expect(stage).not.toMatch(/from ["']@react-three\/fiber["']/);
    expect(stage).not.toMatch(/from ["']three["']/);
    expect(stage).toContain('import("./fiber-canvas")');

    const roots = ["src/domain", "src/application"];
    const offenders: string[] = [];
    for (const root of roots) {
      const files = await listSourceFiles(path.join(process.cwd(), root));
      for (const file of files) {
        const source = await readFile(file, "utf8");
        if (/@react-three\/fiber|from ["']three["']|require\(["']three["']\)/.test(source)) {
          offenders.push(path.relative(process.cwd(), file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) return [entryPath];
    return [];
  }));
  return files.flat();
}
