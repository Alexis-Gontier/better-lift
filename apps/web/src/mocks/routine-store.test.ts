import { describe, expect, it } from "vitest";
import { groupByFolder, uniqueFolderName } from "./routine-store";

describe("dossiers de routines", () => {
  it("range dans l'ordre des dossiers, « Sans dossier » en dernier", () => {
    const items = [
      { id: "a", folder: "Full body" },
      { id: "b", folder: "PPL" },
      { id: "c", folder: "" },
      { id: "d", folder: "Disparu" },
      { id: "e", folder: "PPL" },
    ];
    expect(groupByFolder(items, ["PPL", "Full body", "Vide"])).toEqual([
      { folder: "PPL", items: [items[1], items[4]] },
      { folder: "Full body", items: [items[0]] },
      { folder: "Vide", items: [] },
      { folder: "", items: [items[2], items[3]] },
    ]);
  });

  it("n'affiche pas « Sans dossier » quand tout est rangé", () => {
    expect(groupByFolder([{ folder: "PPL" }], ["PPL"]).map((g) => g.folder)).toEqual(["PPL"]);
  });

  it("trouve un nom de dossier libre", () => {
    expect(uniqueFolderName("Nouveau dossier", [])).toBe("Nouveau dossier");
    expect(uniqueFolderName("Nouveau dossier", ["Nouveau dossier", "Nouveau dossier 2"])).toBe(
      "Nouveau dossier 3",
    );
  });
});
