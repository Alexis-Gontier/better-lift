import { describe, expect, it } from "vitest";
import { MERGE_MS, record, redo, startHistory, undo } from "./draft-history";

describe("historique du brouillon", () => {
  it("annule puis rétablit pas à pas", () => {
    let h = startHistory(1);
    h = record(h, 2, 0);
    h = record(h, 3, MERGE_MS * 2);
    h = undo(h);
    expect(h.present).toBe(2);
    h = undo(h);
    expect(h.present).toBe(1);
    expect(undo(h)).toBe(h);
    h = redo(redo(h));
    expect(h.present).toBe(3);
  });

  it("fond en un seul pas des changements rapprochés", () => {
    let h = startHistory("");
    h = record(h, "a", 0);
    h = record(h, "ab", 100);
    h = record(h, "abc", 200);
    expect(undo(h).present).toBe("");
  });

  it("un nouveau changement efface ce qu'on pouvait rétablir", () => {
    let h = record(startHistory(1), 2, 0);
    h = undo(h);
    h = record(h, 5, MERGE_MS * 3);
    expect(h.future).toEqual([]);
    expect(redo(h)).toBe(h);
  });

  it("après une annulation, le changement suivant fait un nouveau pas", () => {
    let h = record(startHistory(1), 2, 0);
    h = record(h, 3, MERGE_MS * 2);
    h = undo(h);
    h = record(h, 4, MERGE_MS * 2 + 10);
    expect(undo(h).present).toBe(2);
  });
});
