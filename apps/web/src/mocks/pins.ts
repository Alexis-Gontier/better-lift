import { workouts } from "./generated-workouts";
import { signal } from "./signal";
import { addDays } from "./stats";
import { TODAY } from "./today";

/** Huit exercices épinglés au plus (D276) : au-delà, l'Accueil redevient un catalogue. */
export const MAX_PINS = 8;
const DEFAULT_COUNT = 6;
const DEFAULT_DAYS = 90;

/** À défaut d'épinglés, les six exercices les plus faits sur 90 jours (égalité : ordre du nom). */
export function defaultPins(done: readonly { slug: string; date: string }[], today: string) {
  const from = addDays(today, -DEFAULT_DAYS);
  const counts = new Map<string, number>();
  for (const d of done)
    if (d.date >= from && d.date <= today) counts.set(d.slug, (counts.get(d.slug) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, DEFAULT_COUNT)
    .map(([slug]) => slug);
}

/** Épingle à la fin ou désépingle ; `null` si la liste est pleine. */
export function togglePin(list: readonly string[], slug: string): string[] | null {
  if (list.includes(slug)) return list.filter((s) => s !== slug);
  if (list.length >= MAX_PINS) return null;
  return [...list, slug];
}

const DEFAULTS = defaultPins(
  workouts.flatMap((w) => w.exercises.map((e) => ({ slug: e.slug, date: w.date }))),
  TODAY,
);

/** Les épinglés choisis ; `null` : aucun, on montre ceux par défaut. En mémoire (wireframe). */
const pinned = signal<string[] | null>(null);

export function usePins(): { slugs: string[]; isDefault: boolean } {
  const chosen = pinned.use();
  return chosen ? { slugs: chosen, isDefault: false } : { slugs: DEFAULTS, isDefault: true };
}

/**
 * Épingle ou désépingle à partir de la liste affichée : désépingler un exercice par défaut fige
 * les autres. Une liste vidée revient aux exercices par défaut.
 */
export function applyPin(current: readonly string[], slug: string): "pinned" | "unpinned" | "full" {
  const next = togglePin(current, slug);
  if (next === null) return "full";
  pinned.set(next.length > 0 ? next : null);
  return current.includes(slug) ? "unpinned" : "pinned";
}
