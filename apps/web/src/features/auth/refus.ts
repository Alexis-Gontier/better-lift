// Trois refus, trois gestes différents. Les confondre est le défaut classique : on
// laisse quelqu'un retaper dix fois un mot de passe correct pour une adresse qui ne
// sera jamais acceptée.
export type GenreRefus = "identifiants" | "listeBlanche" | "reseau";

export const MESSAGES_REFUS: Record<GenreRefus, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  listeBlanche: "Cette adresse n'est pas autorisée à créer un compte.",
  reseau: "L'API est injoignable. Réessaie dans un instant.",
};

/** 403 est le code du garde de liste blanche ; tout autre refus vise les identifiants. */
export function refusDe(status: number): GenreRefus {
  return status === 403 ? "listeBlanche" : "identifiants";
}
