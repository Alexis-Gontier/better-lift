import { ShieldIcon } from "lucide-react";
import { type Metadata } from "next";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

export const metadata: Metadata = { title: "Compte — Réglages — better-lift" };

/**
 * Mot de passe, sessions actives, export JSON et suppression du compte.
 *
 * Les deux derniers sont au périmètre V1 (doc 01) : ce sont eux qui rendent
 * l'app quittable, ce qui n'est pas une fonctionnalité optionnelle.
 */
export default function SettingsAccountPage() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldIcon />
          </EmptyMedia>
          <EmptyTitle>Compte</EmptyTitle>
          <EmptyDescription>
            Mot de passe, sessions actives, export de vos données et suppression du compte. Vos
            données vous appartiennent : elles partiront avec vous.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
