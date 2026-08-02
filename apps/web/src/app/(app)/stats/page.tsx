import { ChartLineIcon } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

export const metadata: Metadata = { title: "Statistiques — better-lift" };

/**
 * La doc 05 décrit les statistiques comme « la version approfondie du tableau
 * de bord », et la classe « V2 pour l'essentiel ». La destination existe donc
 * avant son contenu, pour que la navigation soit complète et qu'aucune entrée
 * de la sidebar ne mène à un 404.
 *
 * L'écran annonce ce qui manque plutôt que de faire semblant : les courbes ont
 * besoin d'un historique, et l'historique a besoin de séances.
 */
export default function StatsPage() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ChartLineIcon />
          </EmptyMedia>
          <EmptyTitle>Pas encore de statistiques</EmptyTitle>
          <EmptyDescription>
            Les courbes de progression arriveront quand il y aura des séances à comparer. En
            attendant, l’historique montre déjà ce qui a été fait.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/workouts">Voir l’historique</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
