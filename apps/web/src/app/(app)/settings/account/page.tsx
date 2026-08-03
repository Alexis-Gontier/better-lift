import { type Metadata } from "next";

import { AccountIdentity } from "@/features/account/account-identity";
import { PasswordForm } from "@/features/account/password-form";

export const metadata: Metadata = { title: "Compte — Réglages — better-lift" };

/**
 * Adresse e-mail et mot de passe.
 *
 * **L'export des données et la suppression du compte manquent encore**, alors
 * qu'ils sont au périmètre V1 (doc 01) : ce sont eux qui rendent l'app
 * quittable. Ils demandent deux endpoints qui n'existent pas et une
 * confirmation irréversible, donc leur propre lot — les bâcler ici aurait été
 * le pire endroit pour aller vite.
 */
export default function SettingsAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountIdentity />
      <PasswordForm />
    </div>
  );
}
