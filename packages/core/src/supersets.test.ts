import { describe, expect, it } from "vitest";

import { normalizeSupersetGroups } from "./supersets.js";

describe("normalizeSupersetGroups", () => {
  it("conserve un groupe d'au moins deux exercices", () => {
    expect(normalizeSupersetGroups([1, 1, null])).toEqual([1, 1, null]);
  });

  it("annule un groupe resté seul", () => {
    expect(normalizeSupersetGroups([1, 2, 2])).toEqual([null, 2, 2]);
  });

  it("traite `undefined` comme une absence de groupe", () => {
    expect(normalizeSupersetGroups([undefined, undefined])).toEqual([null, null]);
  });

  it("garde le groupe 0, qui est une valeur et non une absence", () => {
    expect(normalizeSupersetGroups([0, 0])).toEqual([0, 0]);
  });

  it("traite plusieurs groupes indépendamment", () => {
    expect(normalizeSupersetGroups([1, 3, 1, 2, 3])).toEqual([1, 3, 1, null, 3]);
  });
});
