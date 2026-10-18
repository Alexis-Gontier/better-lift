import { describe, expect, it } from "vitest";
import { defaultPins, MAX_PINS, togglePin } from "./pins";

const TODAY = "2026-10-16";

describe("defaultPins", () => {
  it("prend les six exercices les plus faits sur 90 jours", () => {
    const done = [
      ...["a", "a", "a", "b", "b", "c", "d", "e", "f", "g"].map((slug) => ({
        slug,
        date: "2026-10-01",
      })),
      { slug: "z", date: "2026-01-01" },
      { slug: "z", date: "2026-01-02" },
      { slug: "z", date: "2026-01-03" },
    ];
    expect(defaultPins(done, TODAY)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
});

describe("togglePin", () => {
  it("ajoute à la fin, retire s'il y est", () => {
    expect(togglePin(["a"], "b")).toEqual(["a", "b"]);
    expect(togglePin(["a", "b"], "a")).toEqual(["b"]);
  });
  it("refuse au-delà du maximum", () => {
    const full = Array.from({ length: MAX_PINS }, (_, i) => `e${i}`);
    expect(togglePin(full, "x")).toBeNull();
    expect(togglePin(full, "e0")).toHaveLength(MAX_PINS - 1);
  });
});
