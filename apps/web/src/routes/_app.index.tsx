import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

/** L'Accueil, vide pour l'instant (D283) : son contenu viendra quand on saura ce qui y sert. */
function HomePage() {
  return <Page title="Accueil">{null}</Page>;
}
