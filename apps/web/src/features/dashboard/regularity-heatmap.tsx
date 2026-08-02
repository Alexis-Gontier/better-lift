"use client";

import { useStatsStreak } from "@better-lift/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@better-lift/ui/components/tooltip";
import { cn } from "@better-lift/ui/lib/utils";

import { heatLevel, toWeekColumns } from "./format";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { plural } from "@/features/workouts/labels";
import { apiClient } from "@/lib/api";

/**
 * Rampe d'intensité, achromatique.
 *
 * L'opacité plutôt que cinq tokens de couleur : la palette n'a pas d'accent, et
 * une rampe d'opacité sur `foreground` reste lisible dans les deux thèmes sans
 * qu'il faille la redéfinir pour chacun.
 */
const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted",
  1: "bg-foreground/25",
  2: "bg-foreground/45",
  3: "bg-foreground/70",
  4: "bg-foreground",
};

/**
 * Lundi, mercredi et vendredi seulement : sept étiquettes de 12 px de haut ne
 * tiennent pas sans se chevaucher. Les lignes vides gardent l'alignement.
 */
const WEEKDAY_LABELS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "" },
  { key: "wed", label: "Mer" },
  { key: "thu", label: "" },
  { key: "fri", label: "Ven" },
  { key: "sat", label: "" },
  { key: "sun", label: "" },
];

function RegularityHeatmapSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Régularité</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-28 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Heatmap de régularité sur douze semaines (doc 05).
 *
 * Signal comportemental fort pour un coût faible. La fenêtre servie par l'API
 * commence toujours un lundi et compte un multiple de sept jours : les colonnes
 * sont pleines et la grille rectangulaire, sans quoi les jours ne s'alignent
 * pas d'une semaine à l'autre.
 */
export function RegularityHeatmap() {
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const streak = useStatsStreak(apiClient, 12);

  if (streak.isPending) {
    return <RegularityHeatmapSkeleton />;
  }

  if (streak.isError || !streak.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Régularité</CardTitle>
          <CardDescription>La régularité n’a pas pu être chargée.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { days, currentWeeks, longestWeeks } = streak.data;
  const columns = toWeekColumns(days);
  const activeDays = days.filter((day) => day.workoutCount > 0).length;

  const dayFormatter = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    // Une date civile est déjà en UTC : la relire dans le fuseau local
    // reculerait d'un jour à l'ouest de Greenwich.
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Régularité</CardTitle>
        <CardDescription>
          {currentWeeks > 0
            ? `${plural(currentWeeks, "semaine")} d’affilée · record : ${longestWeeks}`
            : "Aucune série en cours"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/*
          `overflow-x-auto` : douze colonnes de 12 px tiennent partout, mais la
          carte peut rétrécir sous une sidebar dépliée sur un petit portable.
          Le débordement défile dans son coin plutôt que d'élargir la page.
        */}
        <div className="overflow-x-auto">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 pt-0.5">
              {WEEKDAY_LABELS.map(({ key, label }) => (
                <span
                  key={key}
                  aria-hidden="true"
                  className="h-3 text-[10px] leading-3 text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>

            <div aria-hidden="true" className="flex gap-1">
              {columns.map((week) => (
                <div key={week[0]?.date} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "size-3 rounded-xs",
                            LEVEL_CLASSES[heatLevel(day.workoutCount)],
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {day.workoutCount === 0
                          ? `Aucune séance — ${dayFormatter.format(new Date(`${day.date}T00:00:00Z`))}`
                          : `${plural(day.workoutCount, "séance")} — ${dayFormatter.format(new Date(`${day.date}T00:00:00Z`))}`}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/*
          La grille est `aria-hidden` : 84 cases annoncées une à une seraient
          inexploitables. Le résumé qui suit porte la même information sous une
          forme qui s'écoute — c'est l'équivalent textuel qu'impose la doc 05.
        */}
        <p className="mt-4 text-sm text-muted-foreground">
          {activeDays === 0
            ? "Aucune séance sur les douze dernières semaines."
            : `${plural(activeDays, "jour")} avec au moins une séance sur les douze dernières semaines.`}
        </p>
      </CardContent>
    </Card>
  );
}
