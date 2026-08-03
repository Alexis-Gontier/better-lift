import { DEFAULT_LOCALE, LOCALES, type Locale } from "@better-lift/validators";

/**
 * Choix de la langue affichée (doc 09, D29).
 *
 * Trois sources, dans cet ordre :
 *
 * 1. **Le profil**, dès qu'il est connu. C'est un réglage explicite du compte,
 *    il l'emporte sur tout le reste — y compris sur un navigateur d'une autre
 *    langue, cas courant d'un poste partagé ou d'un système en anglais.
 * 2. **La langue du navigateur**, avant la connexion : c'est le seul indice
 *    dont on dispose sur les écrans d'authentification, où il n'y a pas encore
 *    de profil.
 * 3. **`DEFAULT_LOCALE`**, sinon.
 *
 * Pure et testable : la résolution est la seule règle de tout le dispositif
 * i18n, et c'est elle qui décide ce que voit quelqu'un qui n'a pas encore de
 * compte.
 */
export function resolveLocale(profile: Locale | null, preferred: readonly string[]): Locale {
  if (profile) {
    return profile;
  }

  for (const candidate of preferred) {
    // `fr-CA`, `en-GB`, `EN` : on ne garde que la sous-étiquette de langue.
    // Une correspondance exacte ne trouverait presque jamais rien — les
    // navigateurs annoncent une région dans la quasi-totalité des cas.
    const language = candidate.toLowerCase().split("-")[0];
    const match = LOCALES.find((locale) => locale === language);

    if (match) {
      return match;
    }
  }

  return DEFAULT_LOCALE;
}
