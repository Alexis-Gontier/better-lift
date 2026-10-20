import { rechercheAccueil } from "@better-lift/shared";
import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/home-page";
import { periodeEffective } from "@/features/home/periode";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  validateSearch: (s) => rechercheAccueil.parse(s),
  component: function Accueil() {
    return <HomePage periode={periodeEffective(Route.useSearch().periode)} />;
  },
});
