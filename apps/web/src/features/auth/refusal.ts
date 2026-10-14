// Trois refus, trois gestes différents. Les confondre est le défaut classique : on
// laisse quelqu'un retaper dix fois un mot de passe correct pour une adresse qui ne
// sera jamais acceptée.
export type RefusalKind = "identifiants" | "listeBlanche" | "reseau";

export const REFUSAL_MESSAGES: Record<RefusalKind, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  listeBlanche: "Cette adresse n'est pas autorisée à créer un compte.",
  reseau: "L'API est injoignable. Réessaie dans un instant.",
};

/** 403 est le code du garde de liste blanche ; tout autre refus vise les identifiants. */
export function refusalOf(status: number): RefusalKind {
  return status === 403 ? "listeBlanche" : "identifiants";
}
