import { type Locale } from "@better-lift/validators";

import { type Messages } from "./messages";

/**
 * Typage des clés de traduction.
 *
 * `t("SignIn.titre")` devient une erreur de compilation plutôt qu'un texte
 * manquant découvert à l'écran. Le catalogue **français** fait référence : une
 * clé traduite en anglais mais absente du français n'existe donc pas, ce qui
 * est le bon sens de la relation entre les deux.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
    Locale: Locale;
  }
}
