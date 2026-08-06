"use client";

import { useStatsStreak } from "@better-lift/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
} from "@better-lift/ui/components/contribution-graph";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@better-lift/ui/components/tooltip";

import { heatLevel } from "./format";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { plural } from "@/features/workouts/labels";
import { apiClient } from "@/lib/api";

/** Libellés de la légende « Moins … Plus », le seul texte du registre à traduire ici. */
const LEGEND_LABELS: Record<"fr" | "en", { less: string; more: string }> = {
  fr: { less: "Moins", more: "Plus" },
  en: { less: "Less", more: "More" },
};

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
 * Heatmap de régularité sur douze semaines (doc 05), via le `contribution-graph`
 * de Kibo UI plutôt qu'une grille CSS maison.
 *
 * La fenêtre servie par l'API commence toujours un lundi et compte un multiple
 * de sept jours : `weekStart={1}` aligne le regroupement du composant sur cette
 * même convention, sans quoi la première colonne serait incomplète.
 *
 * Les couleurs du registre (`fill-muted`, `fill-muted-foreground/20`…20/40/60/80)
 * sont déjà achromatiques par défaut — rien à écarter ici, contrairement au
 * logo (doc 05, sidebar).
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
  const activeDays = days.filter((day) => day.workoutCount > 0).length;

  const dayFormatter = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    // Une date civile est déjà en UTC : la relire dans le fuseau local
    // reculerait d'un jour à l'ouest de Greenwich.
    timeZone: "UTC",
  });

  /**
   * Le registre livre ses libellés de mois en anglais et en dur
   * (`DEFAULT_MONTH_LABELS`) : on les régénère depuis la locale du profil
   * plutôt que de les recopier à la main, pour rester correct en anglais
   * comme en français sans entretenir deux listes.
   */
  const monthFormatter = new Intl.DateTimeFormat(intlLocale, { month: "short", timeZone: "UTC" });
  const months = Array.from({ length: 12 }, (_, index) =>
    monthFormatter.format(new Date(Date.UTC(2024, index, 1))),
  );

  const activities = days.map((day) => ({
    date: day.date,
    count: day.workoutCount,
    level: heatLevel(day.workoutCount),
  }));

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
          `aria-hidden` sur le graphe entier, poignées de survol comprises :
          c'est le même parti pris que l'ancienne grille CSS — 84 cases (et
          leurs infobulles à la souris) annoncées une à une seraient
          inexploitables au clavier. Le résumé texte juste en dessous porte
          l'équivalent qu'exige la doc 05.
        */}
        <ContributionGraph
          aria-hidden="true"
          data={activities}
          weekStart={1}
          labels={{ months, legend: LEGEND_LABELS[locale] }}
        >
          <ContributionGraphCalendar>
            {({ activity, dayIndex, weekIndex }) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ContributionGraphBlock
                    activity={activity}
                    dayIndex={dayIndex}
                    weekIndex={weekIndex}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {activity.count === 0
                    ? `Aucune séance — ${dayFormatter.format(new Date(`${activity.date}T00:00:00Z`))}`
                    : `${plural(activity.count, "séance")} — ${dayFormatter.format(new Date(`${activity.date}T00:00:00Z`))}`}
                </TooltipContent>
              </Tooltip>
            )}
          </ContributionGraphCalendar>

          <ContributionGraphFooter>
            <ContributionGraphLegend />
          </ContributionGraphFooter>
        </ContributionGraph>

        <p className="mt-4 text-sm text-muted-foreground">
          {activeDays === 0
            ? "Aucune séance sur les douze dernières semaines."
            : `${plural(activeDays, "jour")} avec au moins une séance sur les douze dernières semaines.`}
        </p>
      </CardContent>
    </Card>
  );
}
