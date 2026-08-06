"use client";

import { MoreHorizontalIcon, PlusIcon, XIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@better-lift/ui/components/dropdown-menu";
import { Field, FieldLabel } from "@better-lift/ui/components/field";
import { Input } from "@better-lift/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@better-lift/ui/components/select";
import { Textarea } from "@better-lift/ui/components/textarea";
import { cn } from "@better-lift/ui/lib/utils";
import { setTypeSchema } from "@better-lift/validators";

import { type DraftAction, type DraftExercise, type DraftSet } from "./draft";
import { SET_TYPE_LABELS, SET_TYPE_TONE } from "./labels";
import { restOptions } from "@/features/account/rest-options";
import { useWeightUnitLabel } from "@/features/account/units";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { ExerciseMedia } from "@/features/exercises/exercise-media";
import { ExerciseQuickView } from "@/features/exercises/exercise-quick-view";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";

/**
 * La grille des lignes de série, partagée avec l'en-tête de colonnes.
 *
 * La première colonne porte le numéro de la série — repère visuel constant
 * pendant qu'on ajoute, retire ou réordonne les autres, ce qu'un simple
 * comptage des lignes ne donne pas d'un coup d'œil.
 */
const SET_GRID = "grid grid-cols-[1.5rem_7rem_1fr_1fr_1fr_2rem] items-center gap-2";

/** Sentinelle « aucun réglage propre » : l'exercice hérite du repos par défaut du profil. */
const DEFAULT_REST = "__default__";

/**
 * Une série du brouillon.
 *
 * `inputMode="decimal"` fait sortir le pavé numérique sur un portable, et
 * `type="text"` plutôt que `type="number"` est délibéré : un champ numérique
 * HTML avale la virgule des claviers français, refuse silencieusement les
 * valeurs qu'il juge invalides, et se met à défiler quand la molette passe
 * dessus. On préfère valider nous-mêmes.
 */
function SetRow({
  exerciseKey,
  set,
  index,
  dispatch,
  canRemove,
}: {
  exerciseKey: string;
  set: DraftSet;
  index: number;
  dispatch: (action: DraftAction) => void;
  canRemove: boolean;
}) {
  const fieldId = useId();

  return (
    <div className={cn(SET_GRID, "py-1")}>
      {/*
        Le numéro de série n'est pas décoratif : c'est le seul repère stable
        pendant qu'on ajoute, retire ou réordonne les lignes autour — compter
        les lignes à l'œil pour savoir laquelle on modifie ne tient pas au-delà
        de deux ou trois séries.
      */}
      <span aria-hidden="true" className="text-center text-sm text-muted-foreground tabular-nums">
        {index + 1}
      </span>

      <div>
        <label htmlFor={`${fieldId}-type`} className="sr-only">
          Type de la série {index + 1}
        </label>
        {/*
            Le type colore son propre déclencheur : une série d'échauffement ne
            compte ni dans le volume ni dans les records (invariant 1, doc 03),
            et la distinguer d'un coup d'œil n'est donc pas cosmétique.

            Sans `size="sm"` : les inputs de charge/reps/RPE juste à droite
            sont en hauteur par défaut (`h-9`), et le déclencheur plus bas de
            `sm` (`h-8`) désalignait toute la ligne de deux pixels — visible
            surtout sur la bordure du haut, qui ne suivait plus celle des champs.
          */}
        <Select
          value={set.type}
          onValueChange={(value) =>
            dispatch({
              type: "setSetField",
              exerciseKey,
              setKey: set.key,
              field: "type",
              value,
            })
          }
        >
          <SelectTrigger
            id={`${fieldId}-type`}
            className={cn("w-full text-xs font-medium", SET_TYPE_TONE[set.type])}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setTypeSchema.options.map((type) => (
              <SelectItem key={type} value={type}>
                {SET_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(
        [
          { field: "targetWeightKg", label: "Charge", placeholder: "charge" },
          { field: "targetReps", label: "Répétitions", placeholder: "reps" },
          { field: "targetRpe", label: "RPE", placeholder: "RPE" },
        ] as const
      ).map(({ field, label, placeholder }) => (
        <div key={field}>
          <label htmlFor={`${fieldId}-${field}`} className="sr-only">
            {label} — série {index + 1}
          </label>
          <Input
            id={`${fieldId}-${field}`}
            type="text"
            inputMode="decimal"
            value={set[field]}
            placeholder={placeholder}
            onChange={(event) =>
              dispatch({
                type: "setSetField",
                exerciseKey,
                setKey: set.key,
                field,
                value: event.target.value,
              })
            }
          />
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => dispatch({ type: "removeSet", exerciseKey, setKey: set.key })}
        disabled={!canRemove}
        aria-label={`Supprimer la série ${index + 1}`}
        title={canRemove ? undefined : "Un exercice garde au moins une série."}
        className="text-muted-foreground hover:text-destructive"
      >
        <XIcon />
      </Button>
    </div>
  );
}

export function EditorExercise({
  exercise,
  index,
  dispatch,
}: {
  exercise: DraftExercise;
  index: number;
  dispatch: (action: DraftAction) => void;
}) {
  const fieldId = useId();
  const weightUnit = useWeightUnitLabel();
  const locale = useProfileLocale();

  const restValue = exercise.restSec.trim();
  const restSeconds = restValue === "" ? undefined : Number(restValue);

  return (
    /*
      `role="group"` plutôt qu'un `<section aria-label>` : `Card` rend un `<div>`
      et n'accepte pas `asChild`. Le groupe est d'ailleurs le bon rôle — une
      routine de six exercices ferait six régions de navigation, ce qui encombre
      la liste des repères pour un gain nul.
    */
    /*
      Sans cadre ni fond : c'est `SortableRow` qui les porte, poignée
      comprise. Les garder ici donnerait deux bordures emboîtées et un coin
      arrondi à l'intérieur d'un autre.
    */
    <Card
      size="sm"
      role="group"
      aria-label={exercise.exercise.name}
      className="rounded-none border-0 bg-transparent"
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/*
            La vignette n'est pas décorative : dans une routine de dix lignes,
            l'image distingue un développé incliné d'un décliné plus vite que
            le nom, qui ne diffère que par un mot au milieu. Elle bascule sur
            son placeholder tant qu'aucun média n'est servi (`media.ts`), ce
            qui est l'état nominal aujourd'hui — d'où une taille fixe, pour que
            la mise en page ne bouge pas le jour où les images arrivent.
          */}
          <ExerciseMedia
            url={exercise.exercise.thumbnailUrl}
            name={exercise.exercise.name}
            className="size-12 shrink-0 rounded-md"
          />

          <div className="min-w-0">
            <CardTitle className="truncate">
              <span className="mr-2 text-muted-foreground">{index + 1}.</span>
              {/*
                Le nom ouvre la fiche. On consulte un exercice *pendant* qu'on
                construit — « c'est bien celui prise serrée ? » — et partir sur
                `/exercises/:id` obligerait à abandonner un brouillon non
                enregistré pour lever un doute de trois secondes.
              */}
              <ExerciseQuickView exercise={exercise.exercise} />
            </CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
              {equipmentLabel(exercise.exercise.equipment)}
            </p>
          </div>
        </div>

        {/*
          Menu plutôt qu'un bouton « Retirer » direct : c'est l'emplacement où
          viendra le futur « Superset » (doc 01), et un bouton unique n'aurait
          fait qu'être remplacé au premier ajout. Autant poser le menu
          maintenant que d'y revenir modifier chaque routine.
        */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions sur ${exercise.exercise.name}`}
              className="text-muted-foreground"
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => dispatch({ type: "removeExercise", key: exercise.key })}
            >
              Retirer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <Field className="sm:max-w-[10rem]">
            <FieldLabel htmlFor={`${fieldId}-rest`}>Repos</FieldLabel>
            {/*
              Un menu plutôt qu'un champ libre : le repos entre deux séries se
              choisit dans une poignée de valeurs rondes, ça ne se tape pas.
              Mêmes options et même mise en forme (« 1 min 30 ») que « Repos
              par défaut » dans Réglages › Préférences — c'est le réglage que
              cet écran vient justement remplacer, doc 05 le dit explicitement.

              `restOptions` insère la valeur courante si elle n'est dans la
              liste : une routine venue du mobile ou d'avant ce changement
              peut porter un repos qui n'y figure pas, et le menu ne doit ni
              s'ouvrir sur du vide ni l'écraser au premier changement d'un
              champ qu'on n'a pas touché. Sans valeur, `90` sert de graine —
              déjà dans la liste standard, il n'y ajoute rien.
            */}
            <Select
              value={restValue === "" ? DEFAULT_REST : restValue}
              onValueChange={(value) =>
                dispatch({
                  type: "setExerciseField",
                  key: exercise.key,
                  field: "restSec",
                  value: value === DEFAULT_REST ? "" : value,
                })
              }
            >
              <SelectTrigger id={`${fieldId}-rest`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_REST}>Par défaut</SelectItem>
                {restOptions(restSeconds ?? 90, locale).map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldId}-notes`}>Notes</FieldLabel>
            <Textarea
              id={`${fieldId}-notes`}
              value={exercise.notes}
              placeholder="Pause 1 s en bas…"
              onChange={(event) =>
                dispatch({
                  type: "setExerciseField",
                  key: exercise.key,
                  field: "notes",
                  value: event.target.value,
                })
              }
            />
          </Field>
        </div>

        {/*
            En-tête de colonnes, aligné sur la grille des lignes : les séries
            n'ont plus de poignée depuis que leur ordre suit la saisie, la
            grille commence donc au même bord que le reste de la carte.

            L'unité vient du profil : la routine prescrit des kilos en base
            (règle non négociable n°3), mais un profil impérial doit lire « lb ».
          */}
        <div className={cn(SET_GRID, "pb-1 text-xs text-muted-foreground")}>
          {/* Vide : le numéro lui-même tient lieu d'en-tête, « # » n'apprendrait rien de plus. */}
          <span />
          <span>Type</span>
          <span>{weightUnit}</span>
          <span>Reps</span>
          <span>RPE</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {exercise.sets.map((set, setIndex) => (
            <SetRow
              key={set.key}
              exerciseKey={exercise.key}
              set={set}
              index={setIndex}
              dispatch={dispatch}
              canRemove={exercise.sets.length > 1}
            />
          ))}
        </div>

        {/*
          Pleine largeur plutôt qu'alignée à gauche à la taille du texte :
          c'est une action qu'on répète plusieurs fois par exercice, pas un
          choix ponctuel — une cible large réduit le nombre de clics manqués
          sur une action qu'on va redéclencher tout de suite. `size="lg"` la
          rapproche des 44 px recommandés au doigt, la plus grande taille que
          porte le registre.

          Un seul bouton : il copie déjà la dernière série (`addSet` dans
          `draft.ts`), ce qui couvre le cas courant — la plupart des séries
          d'un exercice sont identiques (doc 05). Avoir « Ajouter » et
          « Dupliquer » séparés forçait à choisir entre deux boutons qui
          faisaient presque la même chose.
        */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: "addSet", exerciseKey: exercise.key })}
        >
          <PlusIcon />
          Ajouter une série
        </Button>
      </CardContent>
    </Card>
  );
}
