import { createFileRoute } from "@tanstack/react-router";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/settings/preferences")({
  staticData: { crumb: "Préférences" },
  component: () => (
    <>
      <Zone title="Unités" hint="kg ou lb" className="min-h-28" />
      <Zone title="Formats" hint="Date, heure" className="min-h-28" />
      <Zone title="Premier jour de la semaine" hint="Lundi ou dimanche" className="min-h-28" />
      <Zone title="Apparence" hint="Clair, sombre ou système" className="min-h-28" />
    </>
  ),
});
