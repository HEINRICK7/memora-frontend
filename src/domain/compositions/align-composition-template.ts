import type { LocalCompositionDraft } from "./composition-document";
import {
  resolveTemplateId,
  TEMPLATE_CATALOG_V1,
  type TemplateDefinition,
} from "../templates/template-catalog";

export function alignCompositionDraft(
  draft: LocalCompositionDraft,
  catalog: readonly TemplateDefinition[] = TEMPLATE_CATALOG_V1,
): { draft: LocalCompositionDraft; template: TemplateDefinition | undefined } {
  const templateId = resolveTemplateId(draft.document.templateId);
  const template = catalog.find(
    (item) => item.templateId === templateId && item.version === draft.document.templateVersion,
  );
  if (templateId === draft.document.templateId) return { draft, template };
  return {
    draft: {
      ...draft,
      document: {
        ...draft.document,
        templateId,
      },
    },
    template,
  };
}
