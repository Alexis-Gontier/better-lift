"use client";

import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Card, CardContent } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { cn } from "@better-lift/ui/lib/utils";
import { type StatsRange, type StatsSummary } from "@better-lift/validators";

import {
  formatPercent,
  formatTotalDuration,
  formatVolume,
  relativeChange,
  type Trend,
  trendOf,
} from "./format";
import { useProfileLocale } from "@/features/account/use-profile-locale";

const TREND_ICONS: Record<Trend, typeof TrendingUpIcon> = {
  up: TrendingUpIcon,
  down: TrendingDownIcon,
  flat: MinusIcon,
};

function Delta({ change, locale }: { change: number | null; locale: string }) {
  const trend = trendOf(change);
  const Icon = TREND_ICONS[trend];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        // Achromatique : la palette n'a pas de couleur d'accent, et une baisse
        // de volume n'est de toute façon pas une erreur — une semaine de
        // décharge en produit une, et elle est voulue.
        trend === "flat" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {/*
        Le tiret couvre deux cas distincts et volontairement confondus : aucune
        période précédente (`range=all`), et une période précédente vide. Dans
        les deux, il n'y a rien à comparer.
      */}
      {change === null ? "—" : formatPercent(change, locale)}
    </span>
  );
}

function Kpi({
  label,
  value,
  change,
  locale,
  hint,
}: {
  label: string;
  value: string;
  change?: number | null;
  locale: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {/*
            `tabular-nums` : sans lui, les chiffres n'ont pas la même largeur et
            les quatre cartes ne s'alignent plus dès que l'une passe de 9 à 10.
          */}
          <span className="font-heading text-2xl font-semibold tabular-nums">{value}</span>
          {change !== undefined && <Delta change={change} locale={locale} />}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-24" />
      </CardContent>
    </Card>
  );
}

/** Grille des quatre cartes, partagée par le contenu et son squelette. */
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

export function KpiCardsSkeleton() {
  return (
    <Grid>
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
    </Grid>
  );
}

/**
 * Les quatre chiffres clés de la doc 05, servis par **un seul appel**.
 *
 * Chaque valeur porte sa variation par rapport à la période précédente : un
 * chiffre isolé n'informe pas. `previousPeriod` vient de la même réponse, donc
 * sans second aller-retour.
 */
export function KpiCards({ range, summary }: { range: StatsRange; summary: StatsSummary }) {
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const previous = summary.previousPeriod;

  return (
    <Grid>
      <Kpi
        label="Séances"
        value={new Intl.NumberFormat(intlLocale).format(summary.workoutCount)}
        change={previous ? relativeChange(summary.workoutCount, previous.workoutCount) : null}
        locale={intlLocale}
      />
      <Kpi
        label="Volume total"
        value={formatVolume(summary.totalVolumeKg, intlLocale)}
        change={
          previous
            ? relativeChange(Number(summary.totalVolumeKg), Number(previous.totalVolumeKg))
            : null
        }
        locale={intlLocale}
      />
      <Kpi
        label="Temps"
        value={formatTotalDuration(summary.totalDurationSec)}
        locale={intlLocale}
        hint={
          summary.workoutCount > 0
            ? `${formatTotalDuration(summary.avgDurationSec)} en moyenne`
            : undefined
        }
      />
      <Kpi
        label="Records"
        value={new Intl.NumberFormat(intlLocale).format(summary.prCount)}
        locale={intlLocale}
        hint={`sur ${range === "all" ? "tout l’historique" : "la période"}`}
      />
    </Grid>
  );
}
