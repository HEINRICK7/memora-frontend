import {
  TEMPLATE_CATALOG_V1,
  type PhotoSlotDefinition,
  type TemplateDefinition,
} from "./template-catalog";

export type MomentViewModeId = "mural" | TemplateDefinition["templateId"];

export type MomentTemplateOption =
  | Readonly<{
      id: "mural";
      name: string;
      description: string;
      template: null;
    }>
  | Readonly<{
      id: string;
      name: string;
      description: string;
      template: TemplateDefinition;
    }>;

export type MomentTemplateFrameSlot<T> = Readonly<{
  slot: PhotoSlotDefinition;
  photo: T | null;
  globalIndex: number | null;
}>;

export type MomentTemplateFrame<T> = Readonly<{
  frameIndex: number;
  template: TemplateDefinition;
  slots: readonly MomentTemplateFrameSlot<T>[];
}>;

export const MOMENT_TEMPLATE_OPTIONS: readonly MomentTemplateOption[] = Object.freeze([
  Object.freeze({
    id: "mural" as const,
    name: "mural livre",
    description: "Todas as fotos da festa em mosaico fluido.",
    template: null,
  }),
  ...TEMPLATE_CATALOG_V1.map((template) =>
    Object.freeze({
      id: template.templateId,
      name: template.name,
      description: template.description,
      template,
    }),
  ),
]);

export function findMomentTemplateOption(id: string): MomentTemplateOption {
  return MOMENT_TEMPLATE_OPTIONS.find((option) => option.id === id) ?? MOMENT_TEMPLATE_OPTIONS[0]!;
}

export function chunkPhotosForTemplate<T>(
  photos: readonly T[],
  template: TemplateDefinition,
): readonly MomentTemplateFrame<T>[] {
  if (photos.length === 0) return [];
  const perFrame = Math.max(1, template.slots.length);
  const frameCount = Math.ceil(photos.length / perFrame);
  const frames: MomentTemplateFrame<T>[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const start = frameIndex * perFrame;
    const slots: MomentTemplateFrameSlot<T>[] = template.slots.map((slot, slotIndex) => {
      const globalIndex = start + slotIndex;
      const photo = photos[globalIndex] ?? null;
      return {
        slot,
        photo,
        globalIndex: photo ? globalIndex : null,
      };
    });
    frames.push({ frameIndex, template, slots });
  }

  return frames;
}
