import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";
import { createCompositionDocument } from "../../domain/compositions/composition-document";
import type { TemplateDefinition } from "../../domain/templates/template-catalog";
import type { LocalCompositionDraftStore } from "./local-composition-draft-store";

export type CreateCompositionDraftDependencies = {
  catalog: readonly TemplateDefinition[];
  store: Pick<LocalCompositionDraftStore, "create">;
  createId: () => string;
  now: () => Date;
};

export async function createCompositionDraft(
  templateId: string,
  dependencies: CreateCompositionDraftDependencies,
): Promise<LocalCompositionDraft> {
  const template = dependencies.catalog.find((item) => item.templateId === templateId);
  if (!template) throw new Error("O template escolhido não está disponível.");

  const now = dependencies.now().toISOString();
  const draft: LocalCompositionDraft = {
    id: dependencies.createId(),
    createdAt: now,
    updatedAt: now,
    document: createCompositionDocument(template),
  };

  return dependencies.store.create(draft);
}
