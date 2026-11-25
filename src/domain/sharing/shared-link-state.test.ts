import { describe, expect, it } from "vitest";
import { sharedLinkMessage, sharedLinkState } from "./shared-link-state";

describe("shared link states (MEM-008-FE-R10)", () => {
  it("maps the safe backend codes without exposing mural metadata", () => {
    expect(sharedLinkState(404, "shared_link_unavailable")).toBe("LINK_INVALID");
    expect(sharedLinkState(410, "shared_link_expired")).toBe("LINK_EXPIRED");
    expect(sharedLinkState(410, "shared_link_revoked")).toBe("LINK_REVOKED");
    expect(sharedLinkState(404, "shared_mural_unavailable")).toBe("MURAL_REMOVED");
    expect(sharedLinkMessage("MURAL_REMOVED")).not.toMatch(/Sofia|owner|uuid/i);
  });
});
