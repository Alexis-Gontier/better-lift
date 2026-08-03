"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { useExercises } from "@better-lift/api-client";
import { Alert, AlertDescription } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { FieldLegend, FieldSet } from "@better-lift/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@better-lift/ui/components/input-group";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import { Toggle } from "@better-lift/ui/components/toggle";
import { type BodyPart, bodyPartSchema, type ExerciseSummary } from "@better-lift/validators";

import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { useDebouncedValue } from "./use-debounced-value";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 250;
const SKELETON_COUNT = 5;

/**
 * Panneau d'ajout d'exercice, partagé par l'éditeur de routines et celui d'une
 * séance passée (doc 05). Il vit dans le domaine « exercices » et non dans
 * l'un des deux appelants : choisir un exercice est la même question des deux
 * côtés, et la copie aurait divergé au premier filtre ajouté.
 *
 * Il **reste ouvert** après un ajout : on ajoute rarement un seul exercice, et
 * le refermer à chaque fois transformerait la construction d'une routine de six
 * exercices en six allers-retours.
 *
 * Son état n'est pas dans l'URL, contrairement au catalogue : ici la recherche
 * est un outil de saisie, pas une vue à partager, et l'URL porte déjà
 * l'identité de ce qu'on édite.
 */
export function ExercisePicker({ onAdd }: { onAdd: (exercise: ExerciseSummary) => void }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const locale = useProfileLocale();

  const q = useDebouncedValue(draftQuery, SEARCH_DEBOUNCE_MS).trim();

  const query = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(bodyParts.length ? { bodyPart: bodyParts } : {}),
      locale,
    }),
    [q, bodyParts, locale],
  );

  const exercises = useExercises(apiClient, query);
  const items = useMemo(
    () => exercises.data?.pages.flatMap((page) => page.data) ?? [],
    [exercises.data],
  );

  function toggleBodyPart(value: BodyPart) {
    setBodyParts((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value].sort((a, b) => a.localeCompare(b)),
    );
  }

  return (
    <Card size="sm" role="group" aria-label="Ajouter un exercice" className="h-fit">
      <CardHeader>
        <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Ajouter un exercice
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            id="picker-search"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Rechercher…"
            autoComplete="off"
            aria-label="Rechercher un exercice"
          />
        </InputGroup>

        <FieldSet>
          <FieldLegend className="sr-only">Filtrer par partie du corps</FieldLegend>
          <div className="flex flex-wrap gap-1.5">
            {bodyPartSchema.options.map((bodyPart) => (
              <Toggle
                key={bodyPart}
                variant="outline"
                size="sm"
                className="text-xs"
                pressed={bodyParts.includes(bodyPart)}
                onPressedChange={() => toggleBodyPart(bodyPart)}
              >
                {BODY_PART_LABELS[bodyPart]}
              </Toggle>
            ))}
          </div>
        </FieldSet>

        {exercises.isPending && (
          <div className="flex flex-col gap-1" aria-busy>
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <Skeleton key={index} className="h-10 rounded-lg" />
            ))}
          </div>
        )}

        {exercises.isError && (
          <Alert variant="destructive">
            <AlertDescription>{exercises.error.message}</AlertDescription>
          </Alert>
        )}

        {exercises.isSuccess && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun exercice ne correspond.</p>
        )}

        <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
          {items.map((exercise) => (
            <li key={exercise.id}>
              {/*
                Le bouton porte deux lignes : `h-auto` et `justify-start`
                défont la hauteur fixe et le centrage des variantes, faits pour
                un libellé d'une ligne. C'est du placement local, pas une
                densité — rien à remonter en variante partagée.
              */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onAdd(exercise)}
                className="h-auto w-full flex-col items-start justify-start gap-0 py-1.5 text-left"
              >
                <span className="w-full truncate text-sm">{exercise.name}</span>
                <span className="w-full truncate text-xs font-normal text-muted-foreground">
                  {exercise.isCustom ? "Personnalisé · " : ""}
                  {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
                </span>
              </Button>
            </li>
          ))}
        </ul>

        {exercises.hasNextPage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void exercises.fetchNextPage()}
            disabled={exercises.isFetchingNextPage}
            className="w-full"
          >
            {exercises.isFetchingNextPage && <Spinner data-icon="inline-start" />}
            Charger la suite
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
