import type { LocalCompositionDraft } from "../../domain/compositions/composition-document";

export interface LocalCompositionDraftStore {
  create(draft: LocalCompositionDraft): Promise<LocalCompositionDraft>;
  get(draftId: string): Promise<LocalCompositionDraft | undefined>;
  list(): Promise<LocalCompositionDraft[]>;
  save(draft: LocalCompositionDraft): Promise<LocalCompositionDraft>;
}
