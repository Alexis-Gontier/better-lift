/**
 * Les médias du catalogue ne sont pas hébergés — pas encore.
 *
 * Le seed préfixe les chemins du dataset par `MEDIA_BASE_URL` (doc 08). Tant
 * que la variable est vide, la base contient des chemins **relatifs**
 * (`images/2gPfomN.png`), et les fichiers eux-mêmes ne sont pas dans le dépôt.
 * Les poser tels quels dans un `src` produirait une vignette cassée et une
 * requête 404 par exercice, soit vingt par page de catalogue.
 *
 * On ne retient donc que les URL absolues, et l'interface bascule sur son
 * placeholder pour tout le reste. Le jour où le CDN existe, il suffit de
 * renseigner `MEDIA_BASE_URL` et de rejouer le seed : rien à changer ici.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  return /^https?:\/\//i.test(url) ? url : null;
}
