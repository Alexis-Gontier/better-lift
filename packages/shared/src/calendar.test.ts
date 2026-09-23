import { describe, expect, it } from "vitest";
import { formatJour, memeJour } from "./calendar.js";

describe("arithmétique civile", () => {
  it("rend le jour du fuseau demandé, pas celui d'UTC", () => {
    // 23 h 30 à Paris le samedi 20 septembre 2026 = 21 h 30 UTC le même jour.
    // Une heure de plus et UTC bascule au dimanche alors que Paris est encore samedi.
    const samediSoir = "2026-09-20T23:30:00+02:00";
    expect(formatJour(samediSoir, "Europe/Paris")).toBe("20 septembre 2026");
  });

  // Le test précédent passerait encore si `formatJour` ignorait son paramètre et
  // lisait le fuseau de la machine — laquelle est justement à Paris. Celui-ci ne
  // le peut pas : le même instant tombe un jour plus tard à Auckland.
  it("suit le fuseau demandé, et non celui de la machine", () => {
    const samediSoirParis = "2026-09-20T23:30:00+02:00"; // 21 h 30 UTC
    expect(formatJour(samediSoirParis, "Pacific/Auckland")).toBe("21 septembre 2026");
  });

  it("ne fait pas basculer une séance de fin de soirée au lendemain", () => {
    const a = "2026-09-20T23:30:00+02:00";
    const b = "2026-09-20T18:00:00+02:00";
    expect(memeJour(a, b, "Europe/Paris")).toBe(true);
  });

  it("distingue bien deux jours civils consécutifs", () => {
    const samedi = "2026-09-20T23:30:00+02:00";
    const dimanche = "2026-09-21T00:30:00+02:00";
    expect(memeJour(samedi, dimanche, "Europe/Paris")).toBe(false);
  });
});
