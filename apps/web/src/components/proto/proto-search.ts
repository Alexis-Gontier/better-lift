export const VARIANTS = ["a", "b", "c"] as const;
export const PROTO_STATES = ["nominal", "vide", "chargement", "erreur"] as const;

export type Variant = (typeof VARIANTS)[number];
export type ProtoState = (typeof PROTO_STATES)[number];
type ProtoSearch = { v?: Variant; etat?: ProtoState };

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/** Ne garde que des valeurs connues : une adresse fausse retombe sur les défauts. */
export function parseProtoSearch(search: Record<string, unknown>): ProtoSearch {
  const out: ProtoSearch = {};
  if (isOneOf(VARIANTS, search.v)) out.v = search.v;
  if (isOneOf(PROTO_STATES, search.etat)) out.etat = search.etat;
  return out;
}
