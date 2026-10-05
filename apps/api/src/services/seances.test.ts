import { describe, expect, it } from "vitest";
import { anterieurA, type LigneSeance, versDetail, versResume } from "./seances.js";

// Prisma rend les charges en `Decimal` : un objet, pas un nombre.
const d = (n: number) => ({ toString: () => String(n) });

const ligne: LigneSeance = {
  id: "s2",
  nom: "Push",
  routineId: "r-push",
  debut: new Date("2026-09-24T18:00:00.000Z"),
  fin: new Date("2026-09-24T19:00:00.000Z"),
  note: null,
  exercices: [
    {
      exerciseId: "bench",
      exercise: { slug: "barbell-bench-press", nomFr: "Développé couché à la barre" },
      note: "siège cran 4",
      series: [
        { type: "ECHAUFFEMENT", reps: 10, chargeKg: d(40), faite: true },
        { type: "NORMALE", reps: 5, chargeKg: d(100), faite: true },
      ],
    },
    {
      exerciseId: "traction",
      exercise: { slug: "pull-up", nomFr: "Traction" },
      note: null,
      series: [{ type: "NORMALE", reps: 10, chargeKg: null, faite: true }],
    },
    // Le même exercice une seconde fois : il se mesure à la première occurrence.
    {
      exerciseId: "bench",
      exercise: { slug: "barbell-bench-press", nomFr: "Développé couché à la barre" },
      note: null,
      series: [{ type: "NORMALE", reps: 6, chargeKg: d(100), faite: true }],
    },
  ],
};

describe("versResume", () => {
  // D5 : ni échauffement ni poids du corps dans le volume.
  it("compte les séries faites, et un volume sans échauffement ni poids du corps", () => {
    expect(versResume(ligne)).toEqual({
      id: "s2",
      nom: "Push",
      routineId: "r-push",
      debut: "2026-09-24T18:00:00.000Z",
      fin: "2026-09-24T19:00:00.000Z",
      seriesFaites: 4,
      volumeKg: 1100,
    });
  });
});

describe("versDetail", () => {
  const anterieur = new Map([
    [
      "bench",
      [
        {
          type: "NORMALE" as const,
          reps: 5,
          chargeKg: 100,
          faite: true,
          date: "2026-09-20T18:00:00.000Z",
        },
      ],
    ],
    [
      "traction",
      [
        {
          type: "NORMALE" as const,
          reps: 12,
          chargeKg: null,
          faite: true,
          date: "2026-09-20T18:00:00.000Z",
        },
      ],
    ],
  ]);

  it("marque les records battus contre l'historique antérieur (D64)", () => {
    const detail = versDetail(ligne, anterieur);
    // 100 × 5 égale l'ancien record : rien de battu.
    expect(detail.exercices[0]?.series.map((s) => s.records)).toEqual([[], []]);
    // 10 tractions < 12 : pas de record.
    expect(detail.exercices[1]?.series[0]?.records).toEqual([]);
    // 100 × 6, dans la seconde occurrence : bat charge (plus de reps), 1RM et volume.
    expect(detail.exercices[2]?.series[0]?.records).toEqual(["CHARGE", "UN_RM", "VOLUME"]);
    // D110 : le résumé compte les séries qui ont battu au moins un record.
    expect(detail.nbRecords).toBe(1);
  });

  it("rend des charges en nombres, et le nom français", () => {
    const detail = versDetail(ligne, new Map());
    expect(detail.exercices[0]).toMatchObject({
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      note: "siège cran 4",
    });
    expect(detail.exercices[1]?.note).toBeNull();
    expect(detail.exercices[0]?.series[1]?.chargeKg).toBe(100);
  });

  it("sans historique, la première série qui compte établit les records", () => {
    const detail = versDetail(ligne, new Map());
    expect(detail.exercices[0]?.series[1]?.records).toEqual(["CHARGE", "UN_RM", "VOLUME"]);
    expect(detail.exercices[1]?.series[0]?.records).toEqual(["REPS"]);
    expect(detail.nbRecords).toBe(3);
  });
  it("rend la note de la séance (D130), null sans note", () => {
    expect(versDetail({ ...ligne, note: "Bonne séance." }, new Map()).note).toBe("Bonne séance.");
    expect(versDetail(ligne, new Map()).note).toBeNull();
  });
});

describe("anterieurA", () => {
  // La liste juge chaque séance contre ce qui la PRÉCÈDE, comme le détail (D64).
  it("ne garde que l'historique strictement antérieur à une date", () => {
    const serie = (date: string) => ({
      type: "NORMALE" as const,
      reps: 5,
      chargeKg: 100,
      faite: true,
      date,
    });
    const h = new Map([
      ["bench", [serie("2026-09-20T18:00:00.000Z"), serie("2026-09-24T18:00:00.000Z")]],
    ]);
    const avant = anterieurA(h, new Date("2026-09-24T18:00:00.000Z"));
    expect(avant.get("bench")?.map((x) => x.date)).toEqual(["2026-09-20T18:00:00.000Z"]);
  });
});
