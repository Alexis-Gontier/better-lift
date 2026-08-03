import { type Metadata } from "next";

import { PreferencesForm } from "@/features/account/preferences-form";

export const metadata: Metadata = { title: "Préférences — Réglages — better-lift" };

/**
 * Unités, langue, fuseau, repos et visibilité par défaut — les préférences que
 * la V1 doit livrer (doc 01). Le thème s'y ajoute, en doublon assumé du menu du
 * compte : les deux commandes écrivent la même valeur.
 */
export default function SettingsPreferencesPage() {
  return <PreferencesForm />;
}
