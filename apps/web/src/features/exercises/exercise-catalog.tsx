"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useExercises } from "@better-lift/api-client";
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
      <div className="space-y-3 rounded-xl bg-surface-raised p-5">
        <p className="font-medium">Aucun exercice personnalisé pour l’instant.</p>
        <p className="text-sm text-ink-muted">
          Utile quand le catalogue ne connaît pas un mouvement de votre salle, ou une variante que
          vous êtes seul à faire.
        </p>
        <Link
          href="/exercises/new"
          className="inline-block rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-surface"
        >
          Créer un exercice
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl bg-surface-raised p-5">
      <p className="font-medium">Aucun exercice ne correspond.</p>
      <p className="text-sm text-ink-muted">
        {hasActiveFilters(filters)
          ? "Essayer avec moins de filtres, ou une autre orthographe."
          : "Le catalogue semble vide : vérifier que le seed a bien été joué."}
      </p>
    </div>
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
    <div className="space-y-6">
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
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ExerciseCardSkeleton key={index} />
          ))}
        </div>
      )}

      {exercises.isError && (
        <div className="space-y-3 rounded-xl bg-surface-raised p-5">
          <p className="font-medium">Le catalogue n’a pas pu être chargé.</p>
          <p className="text-sm text-ink-muted">{exercises.error.message}</p>
          <button
            type="button"
            onClick={() => void exercises.refetch()}
            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
          >
            Réessayer
          </button>
        </div>
      )}

      {exercises.isSuccess && items.length === 0 && <EmptyState filters={filters} />}

      {items.length > 0 && (
        <>
          {/* Annoncé au lecteur d'écran : sans cela, filtrer ne produit aucun retour audible. */}
          <p aria-live="polite" className="text-sm text-ink-muted">
            {items.length} exercice{items.length > 1 ? "s" : ""} affiché
            {items.length > 1 ? "s" : ""}
            {exercises.hasNextPage ? " — la liste continue" : ""}
          </p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((exercise) => (
              <li key={exercise.id}>
                <ExerciseCard exercise={exercise} />
              </li>
            ))}
          </ul>

          {exercises.hasNextPage && (
            <button
              type="button"
              onClick={() => void exercises.fetchNextPage()}
              disabled={exercises.isFetchingNextPage}
              className="w-full rounded-lg py-2.5 text-sm ring-1 ring-white/15 hover:bg-white/5 disabled:opacity-50"
            >
              {exercises.isFetchingNextPage ? "Chargement…" : "Charger la suite"}
            </button>
          )}

          {attributions.map((attribution) => (
            <p key={attribution} className="text-xs text-ink-muted">
              {attribution}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
