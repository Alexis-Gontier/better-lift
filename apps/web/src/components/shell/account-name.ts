/** Les parties du nom local de l'adresse : « alexis.gontier » → ["alexis", "gontier"]. */
const parts = (email: string) => (email.split("@")[0] ?? "").split(/[._-]/).filter(Boolean);

/** Deux lettres tirées de l'adresse : « alexis.gontier » → « AG ». */
export function initials(email: string) {
  const [a = "", b = ""] = parts(email);
  return (a.charAt(0) + (b.charAt(0) || a.charAt(1))).toUpperCase() || "?";
}

/** Le nom du pied de barre (D156), faute de profil nommé : « alexis.gontier » → « Alexis Gontier ». */
export function displayName(email: string) {
  const words = parts(email).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return words.join(" ") || "Compte";
}
