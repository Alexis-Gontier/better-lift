import { useSearch } from "@tanstack/react-router";
import { type Etat, parseEtat } from "./etat";

/** L'état forcé par l'URL, ou `undefined` : la page suit alors sa requête (D303). */
export function useEtat(): Etat | undefined {
  // Le routeur superpose la recherche validée à la recherche BRUTE : une valeur rejetée par
  // `validateSearch` (`?etat=z`) reste lisible ici. On la refiltre.
  return parseEtat(useSearch({ strict: false })).etat;
}
