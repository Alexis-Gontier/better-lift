/** Les parties du nom local de l'adresse : « alexis.gontier » → ["alexis", "gontier"]. */
const parties = (email: string) => (email.split("@")[0] ?? "").split(/[._-]/).filter(Boolean);

/** Deux lettres tirées de l'adresse : « alexis.gontier » → « AG ». */
export function initiales(email: string) {
  const [a = "", b = ""] = parties(email);
  return (a.charAt(0) + (b.charAt(0) || a.charAt(1))).toUpperCase() || "?";
}

/** Le nom du pied de barre (D156), faute de profil nommé : « alexis.gontier » → « Alexis Gontier ». */
export function nomAffiche(email: string) {
  const mots = parties(email).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return mots.join(" ") || "Compte";
}
