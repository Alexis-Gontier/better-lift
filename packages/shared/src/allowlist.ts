/**
 * La liste blanche d'inscription, réduite à du calcul pur.
 *
 * C'est le point de sécurité du projet (D22) : dans l'ancien dépôt,
 * `/sign-up/email` est resté ouvert sur Internet. Le garde qui s'appuie sur ces
 * fonctions vit dans `apps/api/src/auth.ts`, sur la création d'utilisateur.
 */

function normaliser(email: string): string {
  return email.trim().toLowerCase();
}

export function normaliserListe(brut: string | undefined): string[] {
  if (!brut) return [];
  return brut
    .split(",")
    .map(normaliser)
    .filter((e) => e.length > 0);
}

export function estAutorisee(email: string, liste: string[]): boolean {
  // Une liste vide refuse tout. L'inverse — tout laisser passer — aurait
  // l'apparence d'une protection sans en être une.
  if (liste.length === 0) return false;
  return liste.includes(normaliser(email));
}
