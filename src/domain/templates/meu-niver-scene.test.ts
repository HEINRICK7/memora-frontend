import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MEU_NIVER_SCENE } from "./meu-niver-scene";

describe("Meu Niver 3D scene data", () => {
  it("keeps a versioned collage of example photos without renderer objects", async () => {
    expect(MEU_NIVER_SCENE).toMatchObject({
      templateId: "meu-niver-3d",
      version: 1,
      name: "Meu Niver 3D",
      title: "Meu Niver",
    });
    expect(MEU_NIVER_SCENE.photos).toHaveLength(5);
    expect(new Set(MEU_NIVER_SCENE.photos.map((photo) => photo.id)).size).toBe(5);
    for (const photo of MEU_NIVER_SCENE.photos) {
      expect(photo.src.startsWith("/brand/v2/photos/")).toBe(true);
      expect(photo.size[0]).toBeGreaterThan(0);
      expect(photo.size[1]).toBeGreaterThan(0);
    }

    const source = await readFile(path.join(process.cwd(), "src/domain/templates/meu-niver-scene.ts"), "utf8");
    expect(source).not.toMatch(/three|@react-three/);
  });
});
