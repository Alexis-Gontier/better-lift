import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { HomeFeed } from "@/features/home/home-feed";
import { HomePinned } from "@/features/home/home-pinned";
import { HomeEmpty, HomeSkeleton } from "@/features/home/home-states";
import { HomeToBeat } from "@/features/home/home-to-beat";
import { RecordsStrip } from "@/features/home/records-strip";

export const Route = createFileRoute("/_app/")({
  staticData: {
    crumb: "Accueil",
    proto: {
      variants: [
        { value: "a", label: "Épinglés" },
        { value: "b", label: "Fil des records" },
        { value: "c", label: "À battre" },
      ],
    },
  },
  component: HomePage,
});

/** L'Accueil parle de records (D277) : la ligne de tête, puis la variante choisie. */
function HomePage() {
  const { state, variant } = useProto();
  return (
    <Page
      title="Accueil"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/records">
            Tous les records <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      }
    >
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && (
        <>
          <RecordsStrip />
          {variant === "a" && <HomePinned />}
          {variant === "b" && <HomeFeed />}
          {variant === "c" && <HomeToBeat />}
        </>
      )}
    </Page>
  );
}
