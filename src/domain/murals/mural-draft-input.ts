export type MuralDraftInput = {
  title: string;
  description: string;
};

export type NormalizedMuralDraftInput = {
  title: string;
  description: string | null;
};

export type MuralDraftField = "title" | "description";
export type MuralDraftFieldError = "required" | "too-long";
export type MuralDraftFieldErrors = Partial<
  Record<MuralDraftField, MuralDraftFieldError>
>;

const UNICODE_WHITESPACE_AT_EDGES =
  /^\p{White_Space}+|\p{White_Space}+$/gu;

function trimUnicodeWhitespace(value: string): string {
  return value.replace(UNICODE_WHITESPACE_AT_EDGES, "");
}

export function countUnicodeCodePoints(value: string): number {
  return Array.from(value).length;
}

export function normalizeMuralDraftInput(
  input: MuralDraftInput,
): NormalizedMuralDraftInput {
  const title = trimUnicodeWhitespace(input.title);
  const description = trimUnicodeWhitespace(input.description);

  return {
    title,
    description: description.length === 0 ? null : description,
  };
}

export function validateMuralDraftInput(
  input: MuralDraftInput,
): MuralDraftFieldErrors {
  const normalized = normalizeMuralDraftInput(input);
  const errors: MuralDraftFieldErrors = {};
  const titleLength = countUnicodeCodePoints(normalized.title);

  if (titleLength === 0) {
    errors.title = "required";
  } else if (titleLength > 100) {
    errors.title = "too-long";
  }

  if (
    normalized.description !== null &&
    countUnicodeCodePoints(normalized.description) > 500
  ) {
    errors.description = "too-long";
  }

  return errors;
}
