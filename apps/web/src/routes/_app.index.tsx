import { PERIODES, type Periode } from "@better-lift/shared";
import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/home-page";

/** Sans période dans l'URL, trois mois (D330). */
const PAR_DEFAUT: Periode = "3m";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  // La période vit dans l'URL : elle survit au rechargement et au retour (D330). Facultative,
  // pour qu'un lien vers l'Accueil n'ait pas à la donner.
  validateSearch: (s: Record<string, unknown>): { periode?: Periode } =>
    PERIODES.includes(s.periode as Periode) ? { periode: s.periode as Periode } : {},
  component: function Accueil() {
    return <HomePage periode={Route.useSearch().periode ?? PAR_DEFAUT} />;
  },
});
