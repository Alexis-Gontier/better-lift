import { type Locale } from "@better-lift/validators";

/** Repos usuels en salle, du superset court au gros mouvement lourd. */
const COMMON_REST_SEC = [30, 45, 60, 90, 120, 150, 180, 240, 300] as const;

/**
 * Met en forme une durée de repos : « 1 min 30 » plutôt que « 90 ».
 *
 * Personne ne raisonne en secondes au-delà d'une minute, et un menu de neuf
 * nombres bruts obligerait à convertir de tête à chaque ouverture.
 */
export function formatRest(seconds: number, locale: Locale = "fr"): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (locale === "en") {
    if (minutes === 0) return `${rest} s`;
    return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
  }

  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest}`;
}

/**
 * Options du menu de repos par défaut, la valeur du profil comprise.
 *
 * Un profil peut porter une valeur absente de la liste — réglée depuis le
 * mobile, ou héritée d'une version antérieure. Sans cette insertion, le menu
 * s'ouvrirait sur du vide et le premier enregistrement écraserait
 * silencieusement un réglage que personne n'avait demandé à changer.
 */
export function restOptions(
  current: number,
  locale: Locale = "fr",
): { value: number; label: string }[] {
  const values = COMMON_REST_SEC.includes(current as (typeof COMMON_REST_SEC)[number])
    ? [...COMMON_REST_SEC]
    : [...COMMON_REST_SEC, current].sort((a, b) => a - b);

  return values.map((value) => ({ value, label: formatRest(value, locale) }));
}
