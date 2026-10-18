/**
 * Le message à montrer pour un échec de Better Auth. À la connexion, on ne dit jamais lequel
 * des deux champs est faux ; la limite de tentatives (table `rateLimit`) rend son propre
 * message. Statut 0 : la requête n'a pas atteint le serveur.
 */
export function messageAuth(
  page: "connexion" | "inscription",
  code: string | undefined,
  statut: number,
): string {
  if (statut === 0) return "Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.";
  if (statut === 429) return "Trop de tentatives. Réessayez dans un moment.";
  if (page === "connexion") return "E-mail ou mot de passe incorrect.";
  // Better Auth 1.7 : `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`.
  if (code?.startsWith("USER_ALREADY_EXISTS")) return "Un compte existe déjà avec cette adresse.";
  return "Cette adresse n'est pas invitée. Demandez l'accès à l'administrateur.";
}
