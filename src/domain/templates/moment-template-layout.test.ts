import { describe, expect, it } from "vitest";
import { TEMPLATE_CATALOG_V1 } from "./template-catalog";
import {
  MOMENT_TEMPLATE_OPTIONS,
  chunkPhotosForTemplate,
  findMomentTemplateOption,
} from "./moment-template-layout";

describe("moment-template-layout", () => {
  it("exposes mural livre plus every registered template from TEMPLATE_CATALOG_V1", () => {
    expect(MOMENT_TEMPLATE_OPTIONS[0]?.id).toBe("mural");
    expect(MOMENT_TEMPLATE_OPTIONS).toHaveLength(TEMPLATE_CATALOG_V1.length + 1);
    for (const template of TEMPLATE_CATALOG_V1) {
      const option = findMomentTemplateOption(template.templateId);
      expect(option.id).toBe(template.templateId);
      expect(option.template).toBe(template);
    }
  });

  it("chunks party photos into template frames preserving global indices", () => {
    const fourFrames = findMomentTemplateOption("four-frames").template!;
    const photos = ["p0", "p1", "p2", "p3", "p4", "p5"];

    const frames = chunkPhotosForTemplate(photos, fourFrames);

    expect(frames).toHaveLength(2);
    expect(frames[0]?.slots.map((s) => s.photo)).toEqual(["p0", "p1", "p2", "p3"]);
    expect(frames[0]?.slots.map((s) => s.globalIndex)).toEqual([0, 1, 2, 3]);
    expect(frames[1]?.slots.map((s) => s.photo)).toEqual(["p4", "p5", null, null]);
    expect(frames[1]?.slots.map((s) => s.globalIndex)).toEqual([4, 5, null, null]);
  });
});
