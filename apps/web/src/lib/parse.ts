/** Une charge saisie : « 82,5 » ou « 82.5 » ; vide, pas de charge notée (`null`). */
export function parseKg(text: string): number | null {
  const n = Number(text.replace(",", ".").trim());
  return text.trim() === "" || Number.isNaN(n) ? null : Math.max(0, n);
}

/** Un entier positif (répétitions, secondes, minutes), ou la valeur d'avant si la saisie n'en est pas un. */
export function parseCount(text: string, fallback: number): number {
  const n = Number.parseInt(text, 10);
  return Number.isNaN(n) || n < 0 ? fallback : n;
}
