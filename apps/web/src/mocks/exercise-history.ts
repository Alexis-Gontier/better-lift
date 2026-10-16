import type { Performance } from "./exercise-stats";
import { exerciseBySlug } from "./exercises";
import { seeded } from "./random";
import { addDays } from "./stats";
import { TODAY } from "./today";

/** Charge de départ par exercice, il y a six mois ; elle progresse ensuite d'environ 10 %. */
const START_KG: Record<string, number> = {
  "developpe-couche": 85,
  "developpe-incline-halteres": 26,
  dips: 0,
  "developpe-militaire": 38,
  "elevations-laterales": 8,
  "extension-triceps-poulie": 20,
  tractions: 0,
  rowing: 60,
  "tirage-vertical": 50,
  "curl-biceps": 12,
  "face-pull": 15,
  squat: 100,
  "souleve-de-terre": 120,
  "presse-cuisses": 150,
  "leg-curl": 38,
  "mollets-debout": 50,
  "hip-thrust": 80,
  "curl-marteau-poulie": 15,
};

function hash(text: string): number {
  return [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
}

/** Une exécution par semaine environ sur six mois, dans l'ordre chronologique (la plus ancienne d'abord). */
export function exerciseHistory(slug: string): Performance[] {
  if (!exerciseBySlug(slug)) return [];
  const rand = seeded(hash(slug));
  const start = START_KG[slug] ?? 20;
  const out: Performance[] = [];
  for (let week = 26; week >= 0; week--) {
    if (rand() < 0.15) continue; // semaines sautées
    const progress = 1 + ((26 - week) / 26) * 0.1;
    const kg = Math.round((start * progress) / 2.5) * 2.5;
    const reps = 6 + Math.floor(rand() * 5);
    const date = addDays(TODAY, -week * 7 - Math.floor(rand() * 3) - 1);
    out.push({
      date,
      sessionId: String(900 + (26 - week)),
      sets: [
        { kg, reps },
        { kg, reps: Math.max(1, reps - 1) },
        { kg: Math.max(0, kg - 5), reps: reps + 1 },
      ],
    });
  }
  return out;
}
