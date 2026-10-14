import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/shell/page-layout";

// L'Accueil (D197) : la coquille et son en-tête, sans contenu, en attendant la suite
// du chantier web. Il reste la page d'arrivée, sous la garde de `_protege`.
export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

function Home() {
  return <PageLayout title="Accueil" />;
}
