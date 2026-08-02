import { SlidersHorizontalIcon } from "lucide-react";
import { type Metadata } from "next";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

export const metadata: Metadata = { title: "Préférences — Réglages — better-lift" };

/**
 * Unités, langue, temps de repos par défaut — les trois réglages que la V1
 * doit livrer (doc 01).
 *
 * Le thème s'y ajoutera aussi, en doublon assumé du menu utilisateur : on le
 * change en regardant l'écran qu'il transforme, et on le retrouve ici avec les
 * autres préférences d'affichage. Les deux commandes écriront la même valeur.
 */
export default function SettingsPreferencesPage() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SlidersHorizontalIcon />
          </EmptyMedia>
          <EmptyTitle>Préférences</EmptyTitle>
          <EmptyDescription>
            Unités (kg ou lb), langue, temps de repos par défaut et thème. En attendant, le thème se
            règle depuis le menu de votre compte, en bas de la colonne.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
