"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@better-lift/ui/components/button";
import { Toggle } from "@better-lift/ui/components/toggle";
import { cn } from "@better-lift/ui/lib/utils";
import { type WorkoutSummary } from "@better-lift/validators";

import { type DayKey, dayKeyInZone, monthGrid, monthKeyOf, shiftMonth } from "./calendar";
import { plural } from "./labels";
import { WorkoutCard } from "./workout-card";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileTimezone } from "@/features/account/use-profile-timezone";

/** Lundi en tête : la semaine de travail française, et celle du calendrier ISO. */
const WEEKDAY_ANCHORS = [
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",
  "2026-06-06",
  "2026-06-07",
];

/**
 * Vue calendrier de l'historique (doc 05, § Historique).
 *
 * Une pastille par séance, dans la case du jour où elle a été **vécue** — le
 * bucketing passe par le fuseau du profil, voir `calendar.ts`. Le mois entier
 * arrive en une requête : c'est le parent qui l'a chargé, ce composant ne fait
 * que le disposer.
 *
 * Sélectionner un jour déplie ses séances sous la grille plutôt que d'ouvrir
 * une infobulle : une case de calendrier ne peut pas porter une carte lisible,
 * et une infobulle au survol n'existe pas au clavier ni au doigt.
 */
export function WorkoutCalendar({
  month,
  workouts,
  isPending,
  truncated,
  onMonthChange,
}: {
  month: string;
  workouts: WorkoutSummary[];
  isPending: boolean;
  /**
   * Le mois dépasse la page maximale de l'API — plus de cent séances en trente
   * jours. Le cas ne devrait jamais arriver, mais une grille silencieusement
   * incomplète serait indétectable : mieux vaut le dire que le cacher.
   */
  truncated: boolean;
  onMonthChange: (month: string) => void;
}) {
  const locale = useProfileLocale();
  const timeZone = useProfileTimezone();
  const [selected, setSelected] = useState<DayKey | null>(null);

  /**
   * Seules les séances **du mois affiché** entrent dans la grille.
   *
   * La requête ratisse un jour de plus de chaque côté pour couvrir les fuseaux
   * (voir `monthRange`), et la grille déborde jusqu'à six semaines : sans ce
   * filtre, une séance du 1er août apparaîtrait dans la case de débordement de
   * juillet et serait comptée dans le total du mois. Pire, ce serait
   * inconstant — la marge ne fait qu'un jour, donc la plupart des cases de
   * débordement resteraient vides pendant que deux ou trois porteraient des
   * pastilles, sans qu'aucune règle visible l'explique.
   */
  const byDay = useMemo(() => {
    const map = new Map<DayKey, WorkoutSummary[]>();

    for (const workout of workouts) {
      const key = dayKeyInZone(workout.startedAt, timeZone);

      if (monthKeyOf(key) !== month) {
        continue;
      }

      map.set(key, [...(map.get(key) ?? []), workout]);
    }

    return map;
  }, [workouts, timeZone, month]);

  /** Total du mois, cohérent avec la grille : ce qui est compté est ce qui est montré. */
  const monthCount = useMemo(
    () => [...byDay.values()].reduce((sum, entries) => sum + entries.length, 0),
    [byDay],
  );

  const today = dayKeyInZone(new Date().toISOString(), timeZone);
  const days = useMemo(() => monthGrid(month, today), [month, today]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${month}-01T00:00:00.000Z`),
      ),
    [month, locale],
  );

  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    const long = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });

    return WEEKDAY_ANCHORS.map((anchor) => ({
      short: format.format(new Date(`${anchor}T00:00:00.000Z`)),
      long: long.format(new Date(`${anchor}T00:00:00.000Z`)),
    }));
  }, [locale]);

  const dayFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }),
    [locale],
  );

  /** Les séances du jour sélectionné, ou rien si la sélection a quitté le mois. */
  const selectedWorkouts = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            setSelected(null);
            onMonthChange(shiftMonth(month, -1));
          }}
        >
          <ChevronLeftIcon />
          <span className="sr-only">Mois précédent</span>
        </Button>

        <h2 className="text-lg font-medium first-letter:uppercase" aria-live="polite">
          {monthLabel}
        </h2>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            setSelected(null);
            onMonthChange(shiftMonth(month, 1));
          }}
        >
          <ChevronRightIcon />
          <span className="sr-only">Mois suivant</span>
        </Button>
      </div>

      {/*
        Un vrai tableau, et non une grille de `div` : les jours d'un mois sont
        des données tabulaires, et un lecteur d'écran annonce alors « samedi,
        colonne 6 » sans qu'on ait à réinventer les rôles ARIA.
      */}
      <table className="w-full table-fixed border-separate border-spacing-1">
        {/* « Séances du mois : août » plutôt que « Séances de août » — l'élision
            française n'a pas à être devinée sur douze noms de mois traduits. */}
        <caption className="sr-only">
          Séances du mois : {monthLabel}. Les jours avec séance sont des boutons ; les activer
          affiche le détail sous le calendrier.
        </caption>
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th
                key={weekday.long}
                scope="col"
                className="pb-1 text-xs font-normal text-muted-foreground"
              >
                <span aria-hidden>{weekday.short}</span>
                <span className="sr-only">{weekday.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const dayWorkouts = byDay.get(day.key) ?? [];
                const label = dayFormat.format(new Date(`${day.key}T00:00:00.000Z`));

                return (
                  <td key={day.key} className="p-0 align-top">
                    {dayWorkouts.length === 0 ? (
                      <div
                        className={cn(
                          "flex aspect-square flex-col items-center justify-center rounded-lg text-sm",
                          day.inMonth ? "text-muted-foreground" : "text-muted-foreground/40",
                          day.isToday && "ring-1 ring-ring ring-inset",
                        )}
                      >
                        {day.dayOfMonth}
                      </div>
                    ) : (
                      /*
                        `Toggle` plutôt qu'un `<button aria-pressed>` écrit à
                        la main : c'est le même contrat, mais l'état pressé est
                        porté par `data-state` et stylé par le composant. La
                        hauteur fixe de la variante est écrasée — une case de
                        calendrier est carrée, pas haute de 36 px.
                      */
                      <Toggle
                        pressed={selected === day.key}
                        onPressedChange={(pressed) => setSelected(pressed ? day.key : null)}
                        className={cn(
                          "flex aspect-square h-auto w-full flex-col justify-center gap-1",
                          day.isToday && "ring-1 ring-ring ring-inset",
                        )}
                      >
                        <span aria-hidden className={day.inMonth ? "" : "text-muted-foreground/40"}>
                          {day.dayOfMonth}
                        </span>
                        <span aria-hidden className="flex gap-0.5">
                          {dayWorkouts.map((workout) => (
                            <span key={workout.id} className="size-1.5 rounded-full bg-primary" />
                          ))}
                        </span>
                        <span className="sr-only">
                          {label} — {plural(dayWorkouts.length, "séance")}
                        </span>
                      </Toggle>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Chargement du mois…</p>
      ) : (
        /*
          L'équivalent textuel de la grille : ce que les pastilles disent à
          l'œil, écrit pour qui ne les voit pas — et utile à tout le monde.
        */
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {monthCount === 0
            ? "Aucune séance ce mois-ci."
            : `${plural(monthCount, "séance")} sur ${plural(byDay.size, "jour")}.`}
          {truncated && " Le mois en compte davantage : la vue liste les montre toutes."}
        </p>
      )}

      {selected && selectedWorkouts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dayFormat.format(new Date(`${selected}T00:00:00.000Z`))}
          </h3>
          <ul className="flex flex-col gap-2">
            {selectedWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
