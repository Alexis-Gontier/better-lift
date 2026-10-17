import { seeded } from "./random";
import { addDays } from "./stats";
import { type RealSet, type RealWorkout, realWorkouts } from "./workouts";

/**
 * Séances INVENTÉES pour remplir l'été, entre les vraies séances de juillet et celle du
 * 13 octobre : semaine type Push le mardi, Pull le jeudi, Legs le vendredi, environ une séance
 * sur sept sautée, et une semaine de pause mi-août. Les charges partent des vraies : le Push
 * glisse de celui du 29 juillet vers celui du 13 octobre, Pull et Legs progressent d'environ
 * 10 %. Identifiants en `gen-` : rien de tout cela n'a été fait.
 */

const FIRST_WEEK = "2026-07-27"; // lundi
const LAST_DAY = "2026-10-12"; // la veille du vrai Push du 13 octobre
const PAUSE = ["2026-08-10", "2026-08-16"]; // semaine sans séance
const DAYS: [weekday: number, routine: "Push" | "Pull" | "Legs"][] = [
  [1, "Push"],
  [3, "Pull"],
  [4, "Legs"],
];
const MINUTES = { Push: [44, 52], Pull: [62, 74], Legs: [48, 56] } as const;

const real = (id: string) => realWorkouts.find((w) => w.id === id);
const PUSH_FROM = real("hevy-2026-07-29");
const PUSH_TO = real("s-mv5vlq5k-axbue3y8");
const PULL = real("hevy-2026-07-26");
const LEGS = real("hevy-2026-07-24");

/** Pas de charge réaliste : 1 kg sous 10 kg, 2 kg aux haltères, 2,5 kg sinon. */
function roundKg(kg: number, slug: string): number {
  const step = kg < 10 ? 1 : slug.startsWith("dumbbell") ? 2 : 2.5;
  return Math.round(kg / step) * step;
}

function sets(
  slug: string,
  from: RealSet[],
  to: RealSet[] | undefined,
  t: number,
  rand: () => number,
): RealSet[] {
  return from.map(([kgFrom, reps], i) => {
    const kgTo = to?.[i]?.[0] ?? null;
    // Une charge non notée le reste ; sans cible, la charge progresse de 10 % sur l'été.
    if (kgFrom === null) return [null, reps];
    const target = kgTo ?? kgFrom * 1.1;
    const kg = kgFrom + (target - kgFrom) * t + (rand() < 0.2 ? -2.5 : 0);
    return [Math.max(0, roundKg(kg, slug)), Math.max(1, reps + (rand() < 0.25 ? -1 : 0))];
  });
}

function generate(): RealWorkout[] {
  const rand = seeded(2026);
  const out: RealWorkout[] = [];
  const realDates = new Set(realWorkouts.map((w) => w.date));
  const span = (Date.parse(LAST_DAY) - Date.parse(FIRST_WEEK)) / 86_400_000;
  for (let week = FIRST_WEEK; week <= LAST_DAY; week = addDays(week, 7)) {
    for (const [weekday, routine] of DAYS) {
      const date = addDays(week, weekday);
      if (date > LAST_DAY || date < "2026-07-30" || realDates.has(date)) continue;
      if (date >= (PAUSE[0] ?? "") && date <= (PAUSE[1] ?? "")) continue;
      if (rand() < 0.15) continue;
      const t = (Date.parse(date) - Date.parse(FIRST_WEEK)) / 86_400_000 / span;
      const base = routine === "Push" ? PUSH_FROM : routine === "Pull" ? PULL : LEGS;
      const [low, high] = MINUTES[routine];
      out.push({
        id: `gen-${date}`,
        date,
        routine,
        minutes: Math.round(low + rand() * (high - low)),
        exercises:
          (routine === "Push" ? (PUSH_TO ?? base) : base)?.exercises.map((e) => {
            const from = base?.exercises.find((x) => x.slug === e.slug)?.sets ?? e.sets;
            const to = routine === "Push" ? e.sets : undefined;
            return { slug: e.slug, sets: sets(e.slug, from, to, t, rand) };
          }) ?? [],
      });
    }
  }
  return out;
}

/** Toutes les séances, vraies et inventées, la plus récente d'abord. */
export const workouts: RealWorkout[] = [...realWorkouts, ...generate()].sort((a, b) =>
  b.date.localeCompare(a.date),
);

/** Les dernières séries faites d'un exercice, ou `undefined` s'il n'a jamais été fait. */
export function lastSets(slug: string): RealSet[] | undefined {
  return workouts
    .find((w) => w.exercises.some((e) => e.slug === slug))
    ?.exercises.find((e) => e.slug === slug)?.sets;
}
