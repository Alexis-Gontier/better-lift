/**
 * Les médias du catalogue ne sont pas hébergés — pas encore.
 *
 * Le seed préfixe les chemins du dataset par `MEDIA_BASE_URL` (doc 08). Tant
 * que la variable est vide, la base contient des chemins **relatifs**
 * (`images/2gPfomN.png`) que rien ne sert. Sur mobile, une `<Image>` pointant
 * dessus déclenche une requête par ligne visible, pour n'afficher qu'un carré
 * vide : autant s'en abstenir et rendre le repli directement.
 *
 * Jumeau de `apps/web/src/features/exercises/media.ts` — voir `labels.ts` pour
 * la raison de la duplication.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  return /^https?:\/\//i.test(url) ? url : null;
}
