import { describe, expect, it } from "vitest";

import { MAX_PAGE_SIZE } from "@better-lift/validators";

import { currentMonthKey } from "./calendar";
import {
  type HistoryFilters,
  parseHistoryFilters,
  serializeHistoryFilters,
  toWorkoutListQuery,
} from "./history-filters";

const DEFAULTS: HistoryFilters = {
  view: "list",
  period: "3m",
  month: "2026-08",
  routineId: undefined,
};

function parse(search: string, timeZone = "UTC") {
  return parseHistoryFilters(new URLSearchParams(search), timeZone);
}

describe("parseHistoryFilters", () => {
  it("part sur la liste et trois mois quand l'URL est nue", () => {
    const filters = parse("");

    expect(filters.view).toBe("list");
    expect(filters.period).toBe("3m");
    expect(filters.routineId).toBeUndefined();
  });

  it("lit une vue et une période valides", () => {
    expect(parse("view=calendar&period=30d").view).toBe("calendar");
    expect(parse("period=all").period).toBe("all");
  });

  it("écarte silencieusement les valeurs inconnues", () => {
    // Un vieux lien doit donner un historique, jamais un écran d'erreur.
    expect(parse("view=grid").view).toBe("list");
    expect(parse("period=42y").period).toBe("3m");
  });

  it("borne l'identifiant de routine et traite le vide comme absent", () => {
    expect(parse("routineId=abc123").routineId).toBe("abc123");
    expect(parse("routineId=%20%20").routineId).toBeUndefined();
    expect(parse(`routineId=${"x".repeat(200)}`).routineId).toHaveLength(64);
  });
});

describe("serializeHistoryFilters", () => {
  const current = "2026-08";

  it("laisse l'URL nue quand rien n'est filtré", () => {
    expect(serializeHistoryFilters(DEFAULTS, current)).toBe("");
  });

  it("n'écrit le mois qu'en vue calendrier, et seulement s'il a changé", () => {
    expect(serializeHistoryFilters({ ...DEFAULTS, view: "calendar" }, current)).toBe(
      "view=calendar",
    );
    expect(
      serializeHistoryFilters({ ...DEFAULTS, view: "calendar", month: "2026-03" }, current),
    ).toBe("view=calendar&month=2026-03");
  });

  it("n'écrit pas la période en vue calendrier, où elle ne veut rien dire", () => {
    const filters: HistoryFilters = { ...DEFAULTS, view: "calendar", period: "30d" };

    expect(serializeHistoryFilters(filters, current)).toBe("view=calendar");
  });

  it("fait un aller-retour fidèle", () => {
    const filters: HistoryFilters = {
      view: "calendar",
      period: "3m",
      month: "2025-11",
      routineId: "routine-1",
    };

    expect(parse(serializeHistoryFilters(filters, current))).toEqual(filters);
  });
});

describe("toWorkoutListQuery", () => {
  const now = new Date("2026-08-04T12:00:00.000Z");

  it("borne la liste sur une fenêtre glissante, sans borne haute", () => {
    const query = toWorkoutListQuery({ ...DEFAULTS, period: "30d" }, now);

    expect(query.from).toBe("2026-07-05T12:00:00.000Z");
    expect(query.to).toBeUndefined();
  });

  it("recule d'un nombre de jours fixe, sans déborder depuis un mois court", () => {
    // Le piège de `setUTCMonth` : le 31 mars moins un mois donnerait le 3 mars.
    const query = toWorkoutListQuery(
      { ...DEFAULTS, period: "30d" },
      new Date("2026-03-31T00:00:00.000Z"),
    );

    expect(query.from).toBe("2026-03-01T00:00:00.000Z");
  });

  it("ne borne rien du tout sur « Tout »", () => {
    expect(toWorkoutListQuery({ ...DEFAULTS, period: "all" }, now)).toEqual({});
  });

  it("tire le mois entier en vue calendrier, période ignorée", () => {
    const query = toWorkoutListQuery({ ...DEFAULTS, view: "calendar", period: "30d" }, now);

    expect(query.from).toBe("2026-07-31T00:00:00.000Z");
    expect(query.to).toBe("2026-09-02T00:00:00.000Z");
  });

  it("demande la page maximale en vue calendrier, où il n'y a pas de « charger la suite »", () => {
    // Avec les 20 par défaut, un mois chargé perdrait des pastilles sans que
    // rien ne le signale à l'écran.
    expect(toWorkoutListQuery({ ...DEFAULTS, view: "calendar" }, now).limit).toBe(MAX_PAGE_SIZE);
    expect(toWorkoutListQuery(DEFAULTS, now).limit).toBeUndefined();
  });

  it("transmet le filtre de routine dans les deux vues", () => {
    const filters: HistoryFilters = { ...DEFAULTS, routineId: "routine-1" };

    expect(toWorkoutListQuery(filters, now).routineId).toBe("routine-1");
    expect(toWorkoutListQuery({ ...filters, view: "calendar" }, now).routineId).toBe("routine-1");
  });
});

describe("mois courant", () => {
  it("sert de repli au calendrier et de défaut à la sérialisation", () => {
    const filters = parse("view=calendar");

    expect(filters.month).toBe(currentMonthKey("UTC"));
    expect(serializeHistoryFilters(filters, currentMonthKey("UTC"))).toBe("view=calendar");
  });
});
