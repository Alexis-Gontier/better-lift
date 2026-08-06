"use client";

import Link from "next/link";
import { useState } from "react";

import { useExercise } from "@better-lift/api-client";
import { Alert, AlertDescription } from "@better-lift/ui/components/alert";
import { Badge } from "@better-lift/ui/components/badge";
import { Button } from "@better-lift/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@better-lift/ui/components/dialog";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { cn } from "@better-lift/ui/lib/utils";
import { type ExerciseSummary } from "@better-lift/validators";

import { ExerciseMedia, MediaAttribution } from "./exercise-media";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Fiche d'un exercice, ouverte depuis l'endroit où on le manipule.
 *
 * ## Pourquoi un dialogue et pas la fiche complète
 *
 * `/exercises/:id` existe et reste la référence. Mais on consulte un exercice
 * *pendant* qu'on construit une routine — « c'est bien celui avec la barre
 * derrière la nuque ? » —, et y aller signifierait quitter l'éditeur, donc
 * abandonner un brouillon non enregistré ou traverser un avertissement de
 * fermeture pour lever un doute de trois secondes. Le dialogue répond sur
 * place, et le lien vers la fiche reste en pied pour qui veut l'historique et
 * les records.
 *
 * ## Le détail n'est chargé qu'à l'ouverture
 *
 * Le résumé porte déjà le nom, la partie du corps, l'équipement et les médias :
 * l'en-tête et l'image s'affichent donc **immédiatement**, sans attendre le
 * réseau. Seules les instructions manquent — elles pèsent plusieurs centaines
 * d'octets par exercice et sont volontairement absentes des listes (doc 04).
 *
 * La requête vit dans `ExerciseInstructions`, un composant enfant du
 * `DialogContent`. Ce n'est pas de la coquetterie : Radix démonte son contenu
 * à la fermeture, donc le composant — et son `useExercise` avec lui — n'existe
 * qu'une fois le dialogue ouvert. Placée dans le parent, la requête partirait
 * pour **chaque** carte d'une routine de dix exercices, au chargement de
 * l'écran, pour des textes que personne n'aura demandés.
 */
export function ExerciseQuickView({
  exercise,
  className,
}: {
  exercise: ExerciseSummary;
  /** Appliqué au déclencheur, qui est le nom de l'exercice. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  /* L'animation dit le mouvement, la vignette ne dit que la position. */
  const media = exercise.animationUrl ?? exercise.thumbnailUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/*
          Un vrai `<button>` : c'est une action — ouvrir un panneau — et non une
          navigation. Un lien mentirait sur ce qui va se passer, et son menu
          contextuel proposerait « ouvrir dans un nouvel onglet » sur une URL
          qui n'existe pas.
        */}
        <button
          type="button"
          className={cn(
            "rounded-sm text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            className,
          )}
        >
          {exercise.name}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85dvh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
          <DialogDescription>
            {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
            {exercise.isCustom ? " · Exercice personnalisé" : ""}
          </DialogDescription>
        </DialogHeader>

        <ExerciseMedia
          url={media}
          name={exercise.name}
          className="aspect-video w-full rounded-lg"
        />
        {/*
          Mention de copyright obligatoire partout où le média apparaît (D17,
          doc 08). Elle est ici plutôt que sous la vignette de la carte
          d'exercice : c'est le seul endroit où le média est vraiment *montré*,
          et une ligne de copyright sous chaque miniature d'une routine de dix
          exercices noierait l'écran sans informer personne.
        */}
        <MediaAttribution attribution={exercise.attribution} />

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Muscles
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {/* Le muscle cible en premier et en plein : c'est celui qu'on vise. */}
            <Badge>{exercise.target}</Badge>
            {exercise.secondaryMuscles.map((muscle) => (
              <Badge key={muscle} variant="secondary">
                {muscle}
              </Badge>
            ))}
          </div>
        </div>

        <ExerciseInstructions id={exercise.id} isCustom={exercise.isCustom} />

        <DialogFooter>
          <Button asChild variant="outline">
            <Link href={`/exercises/${exercise.id}`}>Historique et records</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Les instructions, chargées à part.
 *
 * Composant séparé pour une seule raison, mais elle est structurante : Radix
 * démonte le contenu d'un dialogue fermé, donc ce composant — et sa requête —
 * n'existent qu'à l'ouverture. Le reste de la fiche vient du résumé déjà en
 * main et s'affiche sans attendre.
 */
function ExerciseInstructions({ id, isCustom }: { id: string; isCustom: boolean }) {
  const locale = useProfileLocale();
  const detail = useExercise(apiClient, id, locale);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Exécution
      </h3>

      {detail.isPending && (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-4" />
          ))}
        </div>
      )}

      {detail.isError && (
        <Alert variant="destructive">
          <AlertDescription>{detail.error.message}</AlertDescription>
        </Alert>
      )}

      {detail.isSuccess &&
        (detail.data.instructions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isCustom
              ? "Vous n’avez pas décrit l’exécution de cet exercice."
              : "Le catalogue ne décrit pas l’exécution de cet exercice."}
          </p>
        ) : (
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
            {/*
              Clé par index : une instruction n'a pas d'identifiant et son
              texte peut se répéter d'une étape à l'autre. La liste est figée —
              elle ne se réordonne ni ne s'insère —, donc l'index y est stable.
            */}
            {detail.data.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        ))}
    </div>
  );
}
