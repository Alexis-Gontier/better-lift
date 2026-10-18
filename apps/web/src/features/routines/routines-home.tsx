import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ListChecks, Plus } from "lucide-react";
import { DetailPlaceholder } from "@/components/list-detail";
import { useEtat } from "@/components/states/use-etat";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { routinesQuery } from "./queries";

/**
 * `/routines` sans routine ouverte (D260) : un état vide franc, qui dit quoi faire et porte la
 * création. Sans aucune routine, la première création prend le relais.
 */
export function RoutinesHome() {
  const force = useEtat();
  const liste = useQuery(routinesQuery());
  // Aucune routine (ou toutes supprimées) : la première création reprend la main.
  if (force === "vide" || liste.data?.routines.length === 0) return <RoutinesOnboarding />;
  return (
    <DetailPlaceholder
      title="Aucune routine ouverte"
      description="Choisissez-en une dans la liste pour la relire ou la modifier, ou créez-en une nouvelle."
      empty={<RoutinesOnboarding />}
    >
      <Button asChild variant="outline">
        <Link to="/routines/new" search>
          <Plus data-icon="inline-start" /> Nouvelle routine
        </Link>
      </Button>
    </DetailPlaceholder>
  );
}

const STEPS = [
  { title: "Nommez-la", text: "« Push », « Haut du corps »… le nom qu'on choisit en salle." },
  { title: "Ajoutez les exercices", text: "Depuis le catalogue, dans l'ordre de la séance." },
  { title: "Réglez séries et repos", text: "Charges et répétitions visées, repos entre séries." },
];

/** Aucune routine (`vide`) : le panneau de droite explique la première création. */
function RoutinesOnboarding() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListChecks />
        </EmptyMedia>
        <EmptyTitle>Créez votre première routine</EmptyTitle>
        <EmptyDescription>
          Une routine prépare une séance : on la lance ensuite depuis le téléphone.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-md">
        <ol className="flex w-full flex-col gap-3 text-left">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs tabular-nums">
                {i + 1}
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-sm">{s.title}</span>
                <span className="text-muted-foreground text-sm">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <Button asChild>
          <Link to="/routines/new" search>
            <Plus data-icon="inline-start" /> Nouvelle routine
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
