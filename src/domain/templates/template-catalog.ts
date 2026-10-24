export type TemplateOrientation = "portrait" | "square" | "landscape";

export type PhotoSlotDefinition = Readonly<{
  slotId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layerOrder: number;
}>;

export type MutablePhotoSlotDefinition = {
  slotId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layerOrder: number;
};

export type TemplateDecorationDefinition = Readonly<{
  decorationId: "polaroid-paper";
  styleVersion: 1;
  x: number;
  y: number;
  width: number;
  height: number;
  layerOrder: number;
}>;

export type MutableTemplateDecorationDefinition = {
  decorationId: "polaroid-paper";
  styleVersion: 1;
  x: number;
  y: number;
  width: number;
  height: number;
  layerOrder: number;
};

export type TemplateDefinition = Readonly<{
  templateId: string;
  version: number;
  name: string;
  description: string;
  photoCount: number;
  aspectRatio: number;
  slots: readonly PhotoSlotDefinition[];
  decorations: readonly TemplateDecorationDefinition[];
  export: Readonly<{
    width: number;
    height: number;
    formats: readonly ("image/png" | "image/jpeg")[];
    jpegQuality: number;
  }>;
}>;

export type MutableTemplateDefinition = {
  templateId: string;
  version: number;
  name: string;
  description: string;
  photoCount: number;
  aspectRatio: number;
  slots: MutablePhotoSlotDefinition[];
  decorations: MutableTemplateDecorationDefinition[];
  export: {
    width: number;
    height: number;
    formats: Array<"image/png" | "image/jpeg">;
    jpegQuality: number;
  };
};

export type TemplateCatalogFilter = {
  photoCount?: 1 | 2 | 3 | 4 | 6;
  aspectRatio?: "1:1" | "4:3" | "2:3" | "4:5";
};

const SUPPORTED_FORMATS: readonly TemplateDefinition["export"]["formats"][number][] = [
  "image/png",
  "image/jpeg",
];

const QUALITY = 0.92;

function photoSlot(
  slotId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  layerOrder: number,
): MutablePhotoSlotDefinition {
  return { slotId, x, y, width, height, layerOrder };
}

function exportSettings(width: number, height: number): MutableTemplateDefinition["export"] {
  return {
    width,
    height,
    formats: [...SUPPORTED_FORMATS],
    jpegQuality: QUALITY,
  };
}

const TEMPLATE_DEFINITIONS: MutableTemplateDefinition[] = [
  {
    templateId: "single-photo",
    version: 1,
    name: "Single",
    description: "Uma fotografia em destaque para guardar um instante.",
    photoCount: 1,
    aspectRatio: 1,
    slots: [photoSlot("photo-1", 0, 0, 1, 1, 0)],
    decorations: [],
    export: exportSettings(1600, 1600),
  },
  {
    templateId: "duo-side-by-side",
    version: 1,
    name: "Duo",
    description: "Duas lembranças lado a lado.",
    photoCount: 2,
    aspectRatio: 4 / 3,
    slots: [
      photoSlot("photo-1", 0, 0, 0.5, 1, 0),
      photoSlot("photo-2", 0.5, 0, 0.5, 1, 1),
    ],
    decorations: [],
    export: exportSettings(1600, 1200),
  },
  {
    templateId: "trio-featured",
    version: 1,
    name: "Trio",
    description: "Um momento em destaque, acompanhado por dois detalhes.",
    photoCount: 3,
    aspectRatio: 4 / 3,
    slots: [
      photoSlot("photo-1", 0, 0, 0.62, 1, 0),
      photoSlot("photo-2", 0.62, 0, 0.38, 0.5, 1),
      photoSlot("photo-3", 0.62, 0.5, 0.38, 0.5, 2),
    ],
    decorations: [],
    export: exportSettings(1600, 1200),
  },
  {
    templateId: "classic-strip",
    version: 1,
    name: "Classic strip",
    description: "Quatro momentos em uma sequência vertical.",
    photoCount: 4,
    aspectRatio: 2 / 3,
    slots: [
      photoSlot("photo-1", 0, 0, 1, 0.25, 0),
      photoSlot("photo-2", 0, 0.25, 1, 0.25, 1),
      photoSlot("photo-3", 0, 0.5, 1, 0.25, 2),
      photoSlot("photo-4", 0, 0.75, 1, 0.25, 3),
    ],
    decorations: [],
    export: exportSettings(1200, 1800),
  },
  {
    templateId: "grid-four",
    version: 1,
    name: "Grid",
    description: "Quatro fotografias em um arranjo equilibrado.",
    photoCount: 4,
    aspectRatio: 1,
    slots: [
      photoSlot("photo-1", 0, 0, 0.5, 0.5, 0),
      photoSlot("photo-2", 0.5, 0, 0.5, 0.5, 1),
      photoSlot("photo-3", 0, 0.5, 0.5, 0.5, 2),
      photoSlot("photo-4", 0.5, 0.5, 0.5, 0.5, 3),
    ],
    decorations: [],
    export: exportSettings(1600, 1600),
  },
  {
    templateId: "polaroid-single",
    version: 1,
    name: "Polaroid",
    description: "Uma fotografia emoldurada com uma faixa inferior ampla.",
    photoCount: 1,
    aspectRatio: 4 / 5,
    slots: [photoSlot("photo-1", 0.08, 0.06, 0.84, 0.72, 1)],
    decorations: [
      {
        decorationId: "polaroid-paper",
        styleVersion: 1,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        layerOrder: 0,
      },
    ],
    export: exportSettings(1200, 1500),
  },
  {
    templateId: "grid-six",
    version: 1,
    name: "Grid 6",
    description: "Seis fotografias organizadas em três colunas.",
    photoCount: 6,
    aspectRatio: 4 / 3,
    slots: Array.from({ length: 6 }, (_, index) =>
      photoSlot(
        `photo-${index + 1}`,
        (index % 3) / 3,
        Math.floor(index / 3) * 0.5,
        1 / 3,
        0.5,
        index,
      ),
    ),
    decorations: [],
    export: exportSettings(1800, 1350),
  },
  {
    templateId: "story-trio",
    version: 1,
    name: "Story trio",
    description: "Uma imagem ampla com duas lembranças na base.",
    photoCount: 3,
    aspectRatio: 2 / 3,
    slots: [
      photoSlot("photo-1", 0, 0, 1, 0.62, 0),
      photoSlot("photo-2", 0, 0.62, 0.5, 0.38, 1),
      photoSlot("photo-3", 0.5, 0.62, 0.5, 0.38, 2),
    ],
    decorations: [],
    export: exportSettings(1200, 1800),
  },
];

function freezeTemplateDefinition(definition: MutableTemplateDefinition): TemplateDefinition {
  const slots = Object.freeze(
    definition.slots.map((slot) => Object.freeze({ ...slot })),
  );
  const decorations = Object.freeze(
    definition.decorations.map((decoration) => Object.freeze({ ...decoration })),
  );
  const exportSettings = Object.freeze({
    ...definition.export,
    formats: Object.freeze([...definition.export.formats]),
  });

  return Object.freeze({
    ...definition,
    slots,
    decorations,
    export: exportSettings,
  });
}

export const TEMPLATE_CATALOG_V1: readonly TemplateDefinition[] = Object.freeze(
  TEMPLATE_DEFINITIONS.map(freezeTemplateDefinition),
);

const RATIO_VALUES: Record<NonNullable<TemplateCatalogFilter["aspectRatio"]>, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "2:3": 2 / 3,
  "4:5": 4 / 5,
};

const RATIO_TOLERANCE = 1e-9;

function assertValid(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid template definition: ${message}`);
}

function isWithinCanvas(rectangle: {
  x: number;
  y: number;
  width: number;
  height: number;
}): boolean {
  const values = [rectangle.x, rectangle.y, rectangle.width, rectangle.height];
  return (
    values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1) &&
    rectangle.width > 0 &&
    rectangle.height > 0 &&
    rectangle.x + rectangle.width <= 1 &&
    rectangle.y + rectangle.height <= 1
  );
}

export function validateTemplateDefinition(definition: TemplateDefinition): void {
  assertValid(definition.templateId.trim().length > 0, "templateId must not be empty");
  assertValid(Number.isInteger(definition.version) && definition.version > 0, "version must be positive");
  assertValid(definition.name.trim().length > 0, "name must not be empty");
  assertValid(Number.isFinite(definition.aspectRatio), "aspectRatio must be finite");
  assertValid(
    definition.aspectRatio >= 0.5 && definition.aspectRatio <= 2,
    "aspectRatio must be between 0.5 and 2",
  );
  assertValid(
    Number.isInteger(definition.photoCount) && definition.photoCount > 0,
    "photoCount must be a positive integer",
  );
  assertValid(definition.photoCount === definition.slots.length, "photoCount must match slot count");

  const identifiers = new Set<string>();
  const layerOrders = new Set<number>();

  for (const slot of definition.slots) {
    assertValid(slot.slotId.trim().length > 0, "slotId must not be empty");
    assertValid(!identifiers.has(slot.slotId), "slotId values must be unique");
    identifiers.add(slot.slotId);
    assertValid(isWithinCanvas(slot), `slot ${slot.slotId} must fit inside the canvas`);
    assertValid(Number.isInteger(slot.layerOrder), `slot ${slot.slotId} layerOrder must be an integer`);
    assertValid(!layerOrders.has(slot.layerOrder), "layerOrder values must be unique");
    layerOrders.add(slot.layerOrder);
  }

  for (let first = 0; first < definition.slots.length; first += 1) {
    for (let second = first + 1; second < definition.slots.length; second += 1) {
      const left = definition.slots[first]!;
      const right = definition.slots[second]!;
      const intersectionWidth =
        Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
      const intersectionHeight =
        Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
      assertValid(
        intersectionWidth <= 0 || intersectionHeight <= 0,
        `slots ${left.slotId} and ${right.slotId} must not overlap by positive area`,
      );
    }
  }

  for (const decoration of definition.decorations) {
    assertValid(
      decoration.decorationId === "polaroid-paper" && decoration.styleVersion === 1,
      "decoration identifier or styleVersion is unsupported",
    );
    assertValid(
      isWithinCanvas(decoration),
      `decoration ${decoration.decorationId} must fit inside the canvas`,
    );
    assertValid(
      Number.isInteger(decoration.layerOrder),
      `decoration ${decoration.decorationId} layerOrder must be an integer`,
    );
    assertValid(!layerOrders.has(decoration.layerOrder), "layerOrder values must be unique");
    layerOrders.add(decoration.layerOrder);
  }

  const exportDefinition = definition.export;
  assertValid(
    Number.isInteger(exportDefinition.width) && exportDefinition.width > 0,
    "export width must be a positive integer",
  );
  assertValid(
    Number.isInteger(exportDefinition.height) && exportDefinition.height > 0,
    "export height must be a positive integer",
  );
  assertValid(
    Math.abs(definition.aspectRatio - exportDefinition.width / exportDefinition.height) <=
      RATIO_TOLERANCE,
    "aspectRatio must match the export dimensions",
  );
  assertValid(exportDefinition.formats.length > 0, "at least one export format is required");
  assertValid(
    exportDefinition.formats.every((format) => SUPPORTED_FORMATS.includes(format)),
    "export format is unsupported",
  );
  assertValid(
    new Set(exportDefinition.formats).size === exportDefinition.formats.length,
    "export formats must be unique",
  );
  assertValid(
    Number.isFinite(exportDefinition.jpegQuality) &&
      exportDefinition.jpegQuality >= 0 &&
      exportDefinition.jpegQuality <= 1,
    "jpegQuality must be between 0 and 1",
  );
}

export function getTemplateOrientation(aspectRatio: number): TemplateOrientation {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    throw new Error("aspectRatio must be a positive finite number");
  }
  if (aspectRatio === 1) return "square";
  return aspectRatio > 1 ? "landscape" : "portrait";
}

export function filterTemplateCatalog(
  catalog: readonly TemplateDefinition[],
  filter: TemplateCatalogFilter,
): TemplateDefinition[] {
  const targetRatio = filter.aspectRatio ? RATIO_VALUES[filter.aspectRatio] : undefined;
  return catalog.filter((definition) => {
    if (filter.photoCount !== undefined && definition.photoCount !== filter.photoCount) {
      return false;
    }
    if (
      targetRatio !== undefined &&
      Math.abs(definition.aspectRatio - targetRatio) > RATIO_TOLERANCE
    ) {
      return false;
    }
    return true;
  });
}

for (const definition of TEMPLATE_CATALOG_V1) {
  validateTemplateDefinition(definition);
}
