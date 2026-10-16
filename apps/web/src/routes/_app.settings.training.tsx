import { createFileRoute } from "@tanstack/react-router";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/settings/training")({
  staticData: { crumb: "Entraînement" },
  component: () => (
    <>
      <Zone title="Repos" hint="Durée par défaut entre les séries" className="min-h-28" />
      <Zone
        title="Charges et disques"
        hint="Incrément, poids de la barre, disques disponibles"
        className="min-h-28"
      />
      <Zone title="Formule du 1RM" hint="Epley ou Brzycki" className="min-h-28" />
      <Zone title="RPE / RIR" hint="Activé ou non" className="min-h-28" />
    </>
  ),
});
