import { describe, expect, it } from "vitest";
import {
  countUnicodeCodePoints,
  normalizeMuralDraftInput,
  validateMuralDraftInput,
} from "./mural-draft-input";

describe("mural draft input (MEM-002-R03)", () => {
  it("trims Unicode whitespace and converts an empty description to null", () => {
    expect(
      normalizeMuralDraftInput({
        title: "\u2003Aniversário\u00a0",
        description: "\u2028 \u00a0",
      }),
    ).toEqual({ title: "Aniversário", description: null });
  });

  it("preserves whitespace inside the text and counts Unicode code points", () => {
    expect(
      normalizeMuralDraftInput({
        title: "  Nossa  viagem  ",
        description: " Primeiro\nsegundo ",
      }),
    ).toEqual({ title: "Nossa  viagem", description: "Primeiro\nsegundo" });
    expect(countUnicodeCodePoints("🙂é")).toBe(3);
  });

  it("accepts the exact title and description limits by code point", () => {
    expect(
      validateMuralDraftInput({
        title: "🙂".repeat(100),
        description: "🙂".repeat(500),
      }),
    ).toEqual({});
  });

  it("rejects empty or over-limit text after Unicode trimming", () => {
    const titleErrors = validateMuralDraftInput({
      title: "\u2003\u00a0",
      description: "",
    });
    expect(titleErrors).toHaveProperty("title");
    expect(titleErrors).not.toHaveProperty("description");

    expect(
      validateMuralDraftInput({
        title: "🙂".repeat(101),
        description: "🙂".repeat(501),
      }),
    ).toHaveProperty("title");
    expect(
      validateMuralDraftInput({
        title: "Mural",
        description: "🙂".repeat(501),
      }),
    ).toHaveProperty("description");
  });
});
