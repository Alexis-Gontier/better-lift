/**
 * Validation de saisie des formulaires d'authentification.
 *
 * Elle ne fait autorité sur rien : Better Auth revérifie tout côté serveur et
 * c'est lui qui tranche. Son seul rôle est de dire à l'utilisateur ce qui ne va
 * pas **avant** qu'il appuie sur le bouton et attende un aller-retour réseau
 * pour apprendre qu'il manquait un caractère.
 *
 * Des fonctions pures, pas un schéma Zod : ces règles ne sont pas un contrat
 * d'API — elles ne sont partagées avec personne et n'ont pas leur place dans
 * `packages/validators`, qui est la source de vérité des contrats. Pures, elles
 * se testent sans monter de composant.
 */

/** Aligné sur `minPasswordLength` de l'instance Better Auth. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Volontairement laxiste. Un e-mail valide au sens de la RFC 5322 ne se décrit
 * pas raisonnablement en expression régulière, et toute tentative sérieuse finit
 * par rejeter des adresses réelles — ce qui est bien pire qu'en accepter une
 * fausse, puisque le serveur, lui, refusera. On n'attrape donc que la faute de
 * frappe grossière : un `@`, quelque chose autour, un point après.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Indiquez votre adresse e-mail.";
  }

  if (!EMAIL_SHAPE.test(trimmed)) {
    return "Cette adresse ne ressemble pas à une adresse e-mail.";
  }

  return null;
}

export function validateName(value: string): string | null {
  return value.trim().length === 0 ? "Indiquez un nom." : null;
}

/**
 * `mode` distingue les deux usages, et la différence n'est pas cosmétique :
 * à la connexion, annoncer « 8 caractères minimum » sur un mot de passe trop
 * court révélerait la politique de mots de passe **et** sous-entendrait que
 * l'adresse existe. On se contente donc d'exiger un champ non vide, et c'est
 * le serveur qui répond « identifiants incorrects », sans distinguer.
 */
export function validatePassword(value: string, mode: "new" | "existing"): string | null {
  if (value.length === 0) {
    return "Indiquez votre mot de passe.";
  }

  if (mode === "new" && value.length < MIN_PASSWORD_LENGTH) {
    return `${MIN_PASSWORD_LENGTH} caractères minimum.`;
  }

  return null;
}

/**
 * Enveloppe les validateurs pour le `blur`, et **ne dit rien d'un champ vide**.
 *
 * Un champ quitté sans avoir été rempli n'est pas une faute : on a pu en sortir
 * sans jamais y toucher. Le premier champ portant l'autofocus, il suffit de
 * cliquer sur la bascule de thème pour que « Indiquez votre adresse e-mail »
 * apparaisse — un reproche adressé à quelqu'un qui n'a rien fait.
 *
 * Les champs manquants sont rattrapés à l'envoi, où l'intention est explicite.
 * Cette fonction ne sert donc qu'au `blur` ; l'appeler à la soumission
 * laisserait passer un formulaire vide.
 */
export function validateIfFilled(
  value: string,
  validate: (value: string) => string | null,
): string | null {
  return value.trim().length === 0 ? null : validate(value);
}

export function validateConfirmation(password: string, confirmation: string): string | null {
  if (confirmation.length === 0) {
    return "Confirmez le mot de passe.";
  }

  return password === confirmation ? null : "Les deux mots de passe ne correspondent pas.";
}
