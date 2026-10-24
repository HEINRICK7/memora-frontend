import type { MuralDraftInput } from "../domain/murals/mural-draft-input";
import {
  normalizeMuralDraftInput,
  validateMuralDraftInput,
} from "../domain/murals/mural-draft-input";
import type { MuralGateway } from "./mural-gateway";

export class MuralDraftValidationError extends Error {
  readonly fields: ReturnType<typeof validateMuralDraftInput>;

  constructor(fields: ReturnType<typeof validateMuralDraftInput>) {
    super("Confira os campos do mural.");
    this.name = "MuralDraftValidationError";
    this.fields = fields;
  }
}

export async function createMuralDraft(
  input: MuralDraftInput,
  gateway: Pick<MuralGateway, "createDraft">,
  idempotencyKey: string,
) {
  const fieldErrors = validateMuralDraftInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    throw new MuralDraftValidationError(fieldErrors);
  }

  return gateway.createDraft(
    normalizeMuralDraftInput(input),
    idempotencyKey,
  );
}
