import { type Metadata } from "next";

import { AccountIdentity } from "@/features/account/account-identity";
import { DataExportSection } from "@/features/account/data-export";
import { DeleteAccountSection } from "@/features/account/delete-account";
import { PasswordForm } from "@/features/account/password-form";

export const metadata: Metadata = { title: "Compte — Réglages — better-lift" };

/**
 * Adresse e-mail, mot de passe, export et suppression.
 *
 * L'ordre n'est pas neutre : l'export vient **avant** la suppression, parce
 * qu'on ne récupère pas ses données après coup. Les deux terminent la page,
 * l'irréversible en dernier.
 */
export default function SettingsAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountIdentity />
      <PasswordForm />
      <DataExportSection />
      <DeleteAccountSection />
    </div>
  );
}
