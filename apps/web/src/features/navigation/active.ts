import { type NavItem } from "./nav-items";

/**
 * Une destination est-elle celle où l'on se trouve ?
 *
 * La correspondance se fait par préfixe **de segment** : `/exercises/xyz` doit
 * garder « Exercices » actif, parce qu'une fiche appartient à sa section. D'où
 * le slash dans `${href}/` — sans lui, un `startsWith` nu allumerait « Routines »
 * sur `/routines-archive`, qui est une tout autre page.
 *
 * Extrait ici plutôt que laissé dans le composant : c'est la seule règle de la
 * navigation qui puisse être fausse en silence, et elle se teste sans rendu.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Entrée correspondant au chemin courant, pour le libellé de la topbar.
 *
 * La liste est parcourue à l'envers : les entrées sont rangées de la plus
 * générale à la plus précise, et si deux préfixes correspondent, c'est la plus
 * précise qui décrit vraiment l'écran. Renvoie `undefined` sur les chemins
 * qu'aucune destination ne couvre — la topbar retombe alors sur la marque
 * plutôt que d'afficher un libellé faux.
 */
export function findActiveNavItem(
  pathname: string,
  items: readonly NavItem[],
): NavItem | undefined {
  return [...items].reverse().find((item) => isNavItemActive(pathname, item.href));
}
