import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(`${process.cwd()}/tokens.css`, "utf8");

describe("Memora v2 design tokens", () => {
  it.each([
    "--color-ink",
    "--color-paper",
    "--color-lime",
    "--color-cobalt",
    "--color-coral",
    "--color-background",
    "--color-foreground",
    "--color-surface",
    "--color-border",
    "--color-interactive",
    "--color-hover",
    "--color-focus",
    "--color-selected",
    "--color-disabled-background",
    "--color-disabled-foreground",
    "--color-success",
    "--color-warning",
    "--color-error",
  ])("defines %s in the shared token file", (token) => {
    expect(tokens).toMatch(new RegExp(`${token}:\\s*[^;]+;`));
  });

  it("uses the non-serif font pairing shown in the official brand board", () => {
    expect(tokens).toContain('"Space Grotesk"');
    expect(tokens).toContain('"DM Sans"');
    expect(tokens).not.toMatch(/Cormorant|Georgia|(?:^|,)\s*serif(?:,|;|$)/i);
  });
});
