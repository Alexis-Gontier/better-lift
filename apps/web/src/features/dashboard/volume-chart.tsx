"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useStatsVolume } from "@better-lift/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@better-lift/ui/components/chart";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { formatVolume } from "./format";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileUnits } from "@/features/account/use-profile-units";
import { apiClient } from "@/lib/api";

const CONFIG = {
  volume: { label: "Volume", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Une date civile (`YYYY-MM-DD`) se relit en UTC et **pas** avec `new Date()`
 * nu : `new Date("2026-07-13")` est déjà minuit UTC, mais l'afficher dans le
 * fuseau local peut reculer d'un jour à l'ouest de Greenwich. On force donc la
 * lecture et l'écriture en UTC — il ne s'agit que d'étiqueter une barre.
 */
function shortDate(civilDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${civilDate}T00:00:00Z`));
}

function VolumeChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume par semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-56 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Volume hebdomadaire sur douze semaines (doc 05).
 *
 * Le graphique le plus utile du tableau de bord : c'est lui qui rend visible
 * une décharge involontaire ou une dérive. Les semaines sans séance sont
 * servies à zéro par l'API et **affichées** comme telles — les sauter donnerait
 * une courbe régulière là où il y a un trou.
 */
export function VolumeChart() {
  // Sert d'identifiant au dégradé du remplissage : un `id` en dur collerait
  // si la carte se retrouvait un jour montée deux fois sur le même écran.
  const gradientId = useId();
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const units = useProfileUnits();
  const volume = useStatsVolume(apiClient, { groupBy: "week" });

  if (volume.isPending) {
    return <VolumeChartSkeleton />;
  }

  if (volume.isError || !volume.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volume par semaine</CardTitle>
          <CardDescription>Le graphique n’a pas pu être chargé.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const points = volume.data.data.map((point) => ({
    periodStart: point.periodStart,
    label: shortDate(point.periodStart, intlLocale),
    volume: Number(point.volumeKg),
    workoutCount: point.workoutCount,
  }));

  const total = points.reduce((sum, point) => sum + point.volume, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume par semaine</CardTitle>
        <CardDescription>Douze dernières semaines</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucun volume enregistré sur la période.
          </p>
        ) : (
          <>
            <ChartContainer config={CONFIG} className="h-56 w-full">
              <AreaChart accessibilityLayer data={points} margin={{ left: 4, right: 4 }}>
                {/*
                  Le dégradé descend vers la transparence plutôt qu'un aplat :
                  un remplissage plein jusqu'en bas alourdirait douze semaines
                  de suite, le dégradé garde le tracé — la vraie donnée —
                  lisible par-dessus.
                */}
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-volume)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-volume)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  // Une étiquette sur deux : douze dates sur la largeur d'une
                  // carte se chevauchent et deviennent illisibles.
                  interval={1}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatVolume(String(value), intlLocale, units)}
                    />
                  }
                />
                {/*
                  `isAnimationActive={false}` n'est pas un choix esthétique.
                  Recharts anime son tracé **en JavaScript**, en interpolant le
                  chemin du `path` : le bloc `prefers-reduced-motion` de
                  `globals.css` ne l'atteint pas, puisqu'il ne pilote que des
                  animations CSS. La préférence serait donc ignorée ici, et sur
                  le seul écran qui en compte trois.

                  Accessoirement, ça règle un faux positif tenace : une capture
                  d'écran prise pendant l'animation d'entrée montre un
                  graphique vide alors que la courbe est bien dans le DOM.
                */}
                <Area
                  dataKey="volume"
                  type="monotone"
                  stroke="var(--color-volume)"
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>

            {/*
              Équivalent textuel obligatoire (doc 05) : un graphique seul n'est
              pas lisible au lecteur d'écran. La table porte les mêmes chiffres,
              elle est masquée à l'œil et pas à l'assistance.
            */}
            <table className="sr-only">
              <caption>Volume par semaine, douze dernières semaines</caption>
              <thead>
                <tr>
                  <th scope="col">Semaine du</th>
                  <th scope="col">Volume</th>
                  <th scope="col">Séances</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.periodStart}>
                    <th scope="row">{point.label}</th>
                    <td>{formatVolume(String(point.volume), intlLocale, units)}</td>
                    <td>{point.workoutCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
