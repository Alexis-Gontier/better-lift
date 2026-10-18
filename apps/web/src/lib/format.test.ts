import { describe, expect, it } from "vitest";
import { initials } from "./format";

describe("initials", () => {
  it("prend la première lettre des deux premiers mots, en capitale", () => {
    expect(initials("Alexis Gontier")).toBe("AG");
    expect(initials("  marie  ")).toBe("M");
    expect(initials("Jean Paul Sartre")).toBe("JP");
  });
});
