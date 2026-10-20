import { bornesPeriode, depuisPour } from "@better-lift/shared";
import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/home-page";
import { periodeRetenue } from "@/features/home/periode";
import { tableauDeBordQuery } from "@/features/home/queries";
import { FUSEAU } from "@/lib/locale";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  // Sans attendre : la page montre son squelette pendant ce temps (D300).
  loader: ({ context }) =>
    void context.queryClient.prefetchQuery(
      tableauDeBordQuery(depuisPour(bornesPeriode(periodeRetenue(), new Date(), FUSEAU))),
    ),
  component: HomePage,
});
