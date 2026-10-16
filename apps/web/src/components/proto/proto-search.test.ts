import { describe, expect, it } from "vitest";
import { parseProtoSearch } from "./proto-search";

describe("parseProtoSearch", () => {
  it("garde une variante et un état valides", () => {
    expect(parseProtoSearch({ v: "b", etat: "vide" })).toEqual({ v: "b", etat: "vide" });
  });

  it("omet les valeurs inconnues", () => {
    expect(parseProtoSearch({ v: "z", etat: "cassé" })).toEqual({});
  });

  it("omet les paramètres absents", () => {
    expect(parseProtoSearch({})).toEqual({});
  });

  it("ignore les autres paramètres", () => {
    expect(parseProtoSearch({ v: "c", q: "squat" })).toEqual({ v: "c" });
  });
});
