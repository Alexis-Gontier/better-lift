import { describe, expect, it } from "vitest";
import { resolveShortcut } from "./shortcuts";

describe("resolveShortcut", () => {
  it("arme la séquence sur g", () => {
    expect(resolveShortcut(null, "g")).toEqual({ action: null, pending: "g" });
  });

  it("navigue sur g puis une lettre connue", () => {
    expect(resolveShortcut("g", "r")).toEqual({
      action: { type: "navigate", to: "/routines" },
      pending: null,
    });
    expect(resolveShortcut("g", "g")).toEqual({
      action: { type: "navigate", to: "/progress" },
      pending: null,
    });
  });

  it("abandonne la séquence sur une lettre inconnue", () => {
    expect(resolveShortcut("g", "z")).toEqual({ action: null, pending: null });
  });

  it("ouvre l'aide sur ?", () => {
    expect(resolveShortcut(null, "?")).toEqual({ action: { type: "help" }, pending: null });
  });

  it("demande une nouvelle routine sur n", () => {
    expect(resolveShortcut(null, "n")).toEqual({ action: { type: "new-routine" }, pending: null });
  });

  it("ignore la casse", () => {
    expect(resolveShortcut("g", "R")).toEqual({
      action: { type: "navigate", to: "/routines" },
      pending: null,
    });
  });

  it("ne fait rien sur une touche libre", () => {
    expect(resolveShortcut(null, "x")).toEqual({ action: null, pending: null });
  });
});
