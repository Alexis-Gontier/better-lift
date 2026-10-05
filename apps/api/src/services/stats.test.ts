import { describe, expect, it } from "vitest";
import { recordsRecents } from "./stats.js";

const serie = (date: string, reps: number, chargeKg: number | null) => ({
  type: "NORMALE" as const,
  reps,
  chargeKg,
  faite: true,
  date,
});

describe("recordsRecents (D112)", () => {
  const depuis = new Date("2026-09-05T00:00:00.000Z");

  it("rend les records établis depuis une date, du plus récent au plus ancien", () => {
    const r = recordsRecents(
      [
        {
          slug: "bench",
          nom: "Développé couché",
          historique: [
            serie("2026-08-20T17:00:00.000Z", 5, 80), // ancien : records d'avant la fenêtre
            serie("2026-09-20T17:00:00.000Z", 5, 90), // bat la charge, le 1RM et le volume
          ],
        },
        {
          slug: "traction",
          nom: "Traction",
          historique: [serie("2026-09-10T17:00:00.000Z", 12, null)],
        },
      ],
      depuis,
    );
    // Une série qui bat plusieurs records : UNE ligne, plusieurs types.
    expect(r.map((x) => [x.slug, x.types, x.date.slice(0, 10)])).toEqual([
      ["bench", ["CHARGE", "UN_RM", "VOLUME"], "2026-09-20"],
      ["traction", ["REPS"], "2026-09-10"],
    ]);
    expect(r[0]).toMatchObject({ nom: "Développé couché", reps: 5, chargeKg: 90 });
  });

  it("ignore les records plus anciens que la fenêtre, et borne le nombre", () => {
    const r = recordsRecents(
      [
        {
          slug: "bench",
          nom: "Développé couché",
          historique: [serie("2026-08-20T17:00:00.000Z", 5, 80)],
        },
      ],
      depuis,
    );
    expect(r).toEqual([]);
    expect(
      recordsRecents(
        Array.from({ length: 7 }, (_, i) => ({
          slug: `e${i}`,
          nom: `E${i}`,
          historique: [serie(`2026-09-1${i}T17:00:00.000Z`, 5, 50)],
        })),
        depuis,
        5,
      ).map((x) => x.slug),
    ).toEqual(["e6", "e5", "e4", "e3", "e2"]);
  });
});
