"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { useRoutines, useWorkouts } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import { FieldLabel } from "@better-lift/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@better-lift/ui/components/select";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import { ToggleGroup, ToggleGroupItem } from "@better-lift/ui/components/toggle-group";
import { type WorkoutSummary } from "@better-lift/validators";

import { currentMonthKey, dayKeyInZone, monthKeyOf } from "./calendar";
import {
  HISTORY_PERIODS,
  type HistoryFilters,
  type HistoryPeriod,
  PERIOD_LABELS,
  parseHistoryFilters,
  serializeHistoryFilters,
  toWorkoutListQuery,
} from "./history-filters";
import { plural } from "./labels";
import { WorkoutCalendar } from "./workout-calendar";
import { WorkoutCard } from "./workout-card";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileTimezone } from "@/features/account/use-profile-timezone";
import { apiClient } from "@/lib/api";

/**
 * Valeur sentinelle du filtre « toutes les routines ».
 *
 * Un `Select` de Radix réserve la chaîne vide à l'absence de sélection : un
 * `SelectItem value=""` lève une erreur, et remettre `""` réafficherait le
 * placeholder. Le préfixe `__` écarte la collision avec un identifiant réel.
 */
const ALL_ROUTINES = "__all__";

/**
 * Historique des séances (doc 05, § Historique).
 *
 * Deux vues sur la **même** route d'API : la liste remonte une fenêtre
 * glissante et pagine par curseur, le calendrier tire un mois d'un coup. Les
 * bornes se calculent dans `history-filters.ts`, ce composant n'a qu'à câbler.
 *
 * L'état vit dans l'URL, comme au catalogue : « mes séances de mars » doit
 * pouvoir se mettre en favori, et « précédent » doit défaire un filtre.
 */
export function WorkoutHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useProfileLocale();
  const timeZone = useProfileTimezone();

  const filters = useMemo(
    () => parseHistoryFilters(new URLSearchParams(searchParams.toString()), timeZone),
    [searchParams, timeZone],
  );

  const applyFilters = useCallback(
    (next: HistoryFilters) => {
      const serialized = serializeHistoryFilters(next, currentMonthKey(timeZone));

      // `replace` et `scroll: false` : changer de vue ou de mois n'est pas une
      // nouvelle page, et remonter en haut après avoir fait défiler la liste
      // serait vécu comme un bug.
      router.replace(`/workouts${serialized ? `?${serialized}` : ""}`, { scroll: false });
    },
    [router, timeZone],
  );

  const query = useMemo(() => toWorkoutListQuery(filters), [filters]);
  const workouts = useWorkouts(apiClient, query);
  const routines = useRoutines(apiClient);

  const items = useMemo(
    () => workouts.data?.pages.flatMap((page) => page.data) ?? [],
    [workouts.data],
  );

  if (workouts.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>L’historique n’a pas pu être chargé.</AlertTitle>
        <AlertDescription>{workouts.error.message}</AlertDescription>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-fit"
          onClick={() => void workouts.refetch()}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/*
          `ToggleGroup type="single"` règle ce que la version écrite à la main
          ne réglait pas : Radix rend un vrai `radiogroup` et câble la
          navigation aux flèches avec un tabindex glissant. C'est précisément
          ce qui manquait à un `<button aria-pressed>`, qui s'annonce coché
          sans se piloter au clavier.

          `onValueChange` peut recevoir "" : cliquer l'élément déjà actif le
          désélectionne. Ici la vue est obligatoire, donc on ignore le vide
          plutôt que de retomber sur un écran sans liste ni calendrier.
        */}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Vue de l’historique"
          value={filters.view}
          onValueChange={(view) => {
            if (view === "list" || view === "calendar") {
              applyFilters({ ...filters, view });
            }
          }}
        >
          <ToggleGroupItem value="list">Liste</ToggleGroupItem>
          <ToggleGroupItem value="calendar">Calendrier</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="history-routine" className="text-sm text-muted-foreground">
            Routine
          </FieldLabel>
          {/*
            `Select` de Radix n'a pas d'équivalent de `<option value="">` : la
            chaîne vide est réservée à « aucune sélection » et ferait revenir
            le placeholder au lieu de sélectionner « Toutes ». D'où une valeur
            sentinelle, retraduite en `undefined` dans les filtres.
          */}
          <Select
            value={filters.routineId ?? ALL_ROUTINES}
            onValueChange={(routineId) =>
              applyFilters({
                ...filters,
                routineId: routineId === ALL_ROUTINES ? undefined : routineId,
              })
            }
          >
            <SelectTrigger id="history-routine" size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_ROUTINES}>Toutes</SelectItem>
                {(routines.data ?? []).map((routine) => (
                  <SelectItem key={routine.id} value={routine.id}>
                    {routine.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/*
        La période ne s'affiche qu'en vue liste : le calendrier a son propre
        déplacement dans le temps, et deux commandes concurrentes pour la même
        chose laisseraient croire qu'elles se combinent.
      */}
      {filters.view === "list" && (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Période"
          value={filters.period}
          onValueChange={(period) => {
            // Même garde que pour la vue : une période est toujours définie.
            if (HISTORY_PERIODS.includes(period as HistoryPeriod)) {
              applyFilters({ ...filters, period: period as HistoryPeriod });
            }
          }}
          className="flex-wrap"
        >
          {HISTORY_PERIODS.map((period: HistoryPeriod) => (
            <ToggleGroupItem key={period} value={period}>
              {PERIOD_LABELS[period]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      {filters.view === "calendar" ? (
        <WorkoutCalendar
          month={filters.month}
          workouts={items}
          isPending={workouts.isPending}
          truncated={workouts.hasNextPage}
          onMonthChange={(month) => applyFilters({ ...filters, month })}
        />
      ) : (
        <WorkoutListView
          workouts={items}
          filters={filters}
          isPending={workouts.isPending}
          hasNextPage={workouts.hasNextPage}
          isFetchingNextPage={workouts.isFetchingNextPage}
          onLoadMore={() => void workouts.fetchNextPage()}
          locale={locale}
          timeZone={timeZone}
        />
      )}
    </div>
  );
}

/**
 * Liste antéchronologique, coupée par mois.
 *
 * Les intertitres ne sont pas décoratifs : sans eux, une page de vingt séances
 * ne donne aucun repère temporel, et il faut lire chaque date pour savoir où
 * l'on est. Le découpage se fait sur les éléments déjà chargés — un mois peut
 * donc s'étaler sur deux pages, et son titre n'apparaît qu'une fois.
 */
function WorkoutListView({
  workouts,
  filters,
  isPending,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  locale,
  timeZone,
}: {
  workouts: WorkoutSummary[];
  filters: HistoryFilters;
  isPending: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  locale: string;
  timeZone: string;
}) {
  const groups = useMemo(() => {
    const byMonth = new Map<string, WorkoutSummary[]>();

    for (const workout of workouts) {
      const key = monthKeyOf(dayKeyInZone(workout.startedAt, timeZone));

      byMonth.set(key, [...(byMonth.get(key) ?? []), workout]);
    }

    const format = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    return [...byMonth].map(([month, entries]) => ({
      month,
      label: format.format(new Date(`${month}-01T00:00:00.000Z`)),
      entries,
    }));
  }, [workouts, locale, timeZone]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return <EmptyHistory filters={filters} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {plural(workouts.length, "séance")} affichée{workouts.length > 1 ? "s" : ""}
        {hasNextPage ? " — l’historique continue" : ""}
      </p>

      {groups.map((group) => (
        <section key={group.month} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground first-letter:uppercase">
            {group.label}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.entries.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </ul>
        </section>
      ))}

      {hasNextPage && (
        <Button
          type="button"
          variant="outline"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          className="w-full"
        >
          {isFetchingNextPage && <Spinner data-icon="inline-start" />}
          Charger la suite
        </Button>
      )}
    </div>
  );
}

/**
 * Deux vides à ne pas confondre, comme au catalogue.
 *
 * Un historique vide parce qu'on n'a jamais rien enregistré appelle une
 * explication : c'est le premier écran d'un inscrit, il doit dire par où
 * commencer. Un historique vide parce qu'on a filtré sur mars appelle
 * l'inverse — conseiller de créer une routine serait à côté du sujet.
 *
 * **L'état des filtres ne permet pas de trancher.** L'écran s'ouvre sur « 3
 * mois », donc un débutant tomberait sur « aucune séance sur cette période »,
 * exactement le message qui n'aide pas. D'où une seconde requête, sans aucune
 * borne et limitée à une ligne, qui pose la seule question qui compte : cet
 * utilisateur a-t-il déjà enregistré quelque chose ? Elle ne part que dans le
 * cas vide, et une seule fois — TanStack la garde en cache.
 */
function EmptyHistory({ filters }: { filters: HistoryFilters }) {
  const bounded = filters.routineId !== undefined || filters.period !== "all";
  const anyWorkout = useWorkouts(apiClient, { limit: 1 });

  // Tant que la réponse n'est pas là, on ne dit rien plutôt que de dire faux :
  // le message s'afficherait puis changerait sous les yeux du lecteur.
  if (bounded && anyWorkout.isPending) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  const hasHistory = (anyWorkout.data?.pages[0]?.data.length ?? 0) > 0;

  if (bounded && hasHistory) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Aucune séance sur cette période.</EmptyTitle>
          <EmptyDescription>Élargir la période, ou retirer le filtre de routine.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Aucune séance enregistrée.</EmptyTitle>
        <EmptyDescription>
          L’historique se remplit tout seul : chaque séance terminée sur le téléphone atterrit ici,
          avec son volume, ses séries et ses records.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/routines">Voir mes routines</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
