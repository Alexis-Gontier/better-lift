"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useExercises } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import { Spinner } from "@better-lift/ui/components/spinner";
import { type BodyPart } from "@better-lift/validators";

import { CatalogFilters } from "./catalog-filters";
import { ExerciseCard, ExerciseCardSkeleton } from "./exercise-card";
import {
  EMPTY_FILTERS,
  type CatalogFilters as Filters,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  toggleValue,
  toListQuery,
} from "./filters";
import { resolveMediaUrl } from "./media";
import { useDebouncedValue } from "./use-debounced-value";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 250;
const SKELETON_COUNT = 6;

/**
 * Trois vides bien différents, et les confondre serait une occasion manquée.
 *
 * « Les miens » sans résultat n'est pas un échec de recherche : c'est le seul
 * moment où l'on sait avec certitude que l'utilisateur n'a encore rien créé.
 * L'écran doit alors proposer de créer, pas conseiller d'élargir les filtres.
 */
function EmptyState({ filters }: { filters: Filters }) {
  if (filters.custom === true && !filters.q.trim() && !filters.bodyPart.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Aucun exercice personnalisé pour l’instant.</EmptyTitle>
          <EmptyDescription>
            Utile quand le catalogue ne connaît pas un mouvement de votre salle, ou une variante que
            vous êtes seul à faire.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/exercises/new">Créer un exercice</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Aucun exercice ne correspond.</EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters(filters)
            ? "Essayer avec moins de filtres, ou une autre orthographe."
            : "Le catalogue semble vide : vérifier que le seed a bien été joué."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/**
 * Catalogue d'exercices (doc 05, § Catalogue).
 *
 * ## Pourquoi l'URL porte l'état
 *
 * Les filtres ne sont pas dans un `useState` : ils vivent dans la query string.
 * Une recherche est alors partageable, elle survit à un rechargement, et le
 * bouton « précédent » du navigateur redevient un bouton « défiltrer ».
 *
 * Le champ de recherche fait exception et garde un état local : le pousser dans
 * l'URL à chaque frappe ferait une navigation et une requête par caractère.
 * C'est le débounce de 250 ms qui décide quand le brouillon devient l'URL.
 */
export function ExerciseCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [draftQuery, setDraftQuery] = useState(filters.q);

  const applyFilters = useCallback(
    (next: Filters) => {
      const serialized = serializeFilters(next);

      /**
       * `replace` et non `push` : une recherche affinée n'est pas une nouvelle
       * page. Empiler « d », « dé », « dév »… obligerait à autant de retours
       * en arrière pour revenir au tableau de bord.
       *
       * `scroll: false` parce qu'on filtre souvent après avoir déjà fait
       * défiler la grille — remonter en haut serait vécu comme un bug.
       */
      router.replace(`/exercises${serialized ? `?${serialized}` : ""}`, { scroll: false });
    },
    [router],
  );

  // Le brouillon devient l'URL, une fois la frappe retombée.
  const debouncedQuery = useDebouncedValue(draftQuery, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedQuery.trim() !== filters.q.trim()) {
      applyFilters({ ...filters, q: debouncedQuery });
    }
  }, [debouncedQuery, filters, applyFilters]);

  /**
   * … et l'URL redevient le brouillon quand elle change sans passer par le
   * champ : retour arrière, lien partagé, réinitialisation des filtres. Sans
   * cette synchronisation, le champ afficherait encore la recherche précédente.
   */
  useEffect(() => {
    setDraftQuery(filters.q);
  }, [filters.q]);

  const locale = useProfileLocale();
  const query = useMemo(() => ({ ...toListQuery(filters), locale }), [filters, locale]);
  const exercises = useExercises(apiClient, query);

  const items = useMemo(
    () => exercises.data?.pages.flatMap((page) => page.data) ?? [],
    [exercises.data],
  );

  /**
   * Mentions de copyright des médias effectivement affichés (D17, doc 08).
   * Elles sont regroupées en pied de grille plutôt que répétées sous chaque
   * carte : la source est unique pour tout le catalogue, et vingt fois la même
   * ligne n'informe pas mieux qu'une seule.
   */
  const attributions = useMemo(
    () => [
      ...new Set(
        items
          .filter((exercise) => resolveMediaUrl(exercise.thumbnailUrl))
          .map((exercise) => exercise.attribution)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [items],
  );

  return (
    <div className="flex flex-col gap-6">
      <CatalogFilters
        draftQuery={draftQuery}
        filters={filters}
        onDraftQueryChange={setDraftQuery}
        onToggleBodyPart={(value: BodyPart) =>
          applyFilters({ ...filters, bodyPart: toggleValue(filters.bodyPart, value) })
        }
        onToggleEquipment={(value: string) =>
          applyFilters({ ...filters, equipment: toggleValue(filters.equipment, value) })
        }
        onOriginChange={(value) => applyFilters({ ...filters, custom: value })}
        onReset={() => {
          setDraftQuery("");
          applyFilters(EMPTY_FILTERS);
        }}
      />

      {exercises.isPending && (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ExerciseCardSkeleton key={index} />
          ))}
        </div>
      )}

      {exercises.isError && (
        <Alert variant="destructive">
          <AlertTitle>Le catalogue n’a pas pu être chargé.</AlertTitle>
          <AlertDescription>{exercises.error.message}</AlertDescription>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-fit"
            onClick={() => void exercises.refetch()}
          >
            Réessayer
          </Button>
        </Alert>
      )}

      {exercises.isSuccess && items.length === 0 && <EmptyState filters={filters} />}

      {items.length > 0 && (
        <>
          {/* Annoncé au lecteur d'écran : sans cela, filtrer ne produit aucun retour audible. */}
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {items.length} exercice{items.length > 1 ? "s" : ""} affiché
            {items.length > 1 ? "s" : ""}
            {exercises.hasNextPage ? " — la liste continue" : ""}
          </p>

          {/*
            `min-w-0` sur le `<li>` : un élément de grille vaut `min-width: auto`
            par défaut, donc il refuse de descendre sous la largeur de son
            contenu. Le `truncate` de la carte ne s'applique jamais, le nom
            d'exercice pousse la colonne, et c'est la page entière qui défile
            latéralement sur mobile — un échec du critère WCAG 1.4.10.
          */}
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((exercise) => (
              <li key={exercise.id} className="min-w-0">
                <ExerciseCard exercise={exercise} />
              </li>
            ))}
          </ul>

          {exercises.hasNextPage && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void exercises.fetchNextPage()}
              disabled={exercises.isFetchingNextPage}
              className="w-full"
            >
              {exercises.isFetchingNextPage && <Spinner data-icon="inline-start" />}
              Charger la suite
            </Button>
          )}

          {attributions.map((attribution) => (
            <p key={attribution} className="text-xs text-muted-foreground">
              {attribution}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
