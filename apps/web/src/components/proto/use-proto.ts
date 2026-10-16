import { useSearch } from "@tanstack/react-router";
import { type ProtoState, parseProtoSearch, type Variant } from "./proto-search";

export function useProto(): { variant: Variant; state: ProtoState } {
  // Le routeur superpose la recherche validée à la recherche BRUTE : une valeur rejetée
  // par `validateSearch` (`?v=z`) reste donc lisible ici. On la refiltre.
  const search = parseProtoSearch(useSearch({ strict: false }));
  return { variant: search.v ?? "a", state: search.etat ?? "nominal" };
}
