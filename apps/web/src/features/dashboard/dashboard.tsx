"use client";

import { ClipboardListIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useStatsSummary } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@better-lift/ui/components/select";
import { type StatsRange, statsRangeSchema } from "@better-lift/validators";

import { RANGE_LABELS, RANGE_OPTIONS } from "./format";
import { KpiCards, KpiCardsSkeleton } from "./kpi-cards";
import { MuscleDistribution } from "./muscle-distribution";
import { RecentRecords } from "./recent-records";
import { RecentWorkouts } from "./recent-workouts";
import { RegularityHeatmap } from "./regularity-heatmap";
import { VolumeChart } from "./volume-chart";
import { apiClient } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

const DEFAULT_RANGE: StatsRange = "30d";

/**
 * La période vit dans l'URL, comme au catalogue et à l'historique (doc 05) :
 * un tableau de bord filtré se partage et se remet en marque-page. `replace`
 * et non `push` — changer de fenêtre n'est pas une étape de navigation, et
 * empiler cinq entrées ferait du bouton retour un piège.
 */
function useRange(): [StatsRange, (next: StatsRange) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsed = statsRangeSchema.safeParse(searchParams.get("periode"));
  const range = parsed.success ? parsed.data : DEFAULT_RANGE;

  return [
    range,
    (next) => {
      const params = new URLSearchParams(searchParams);

      if (next === DEFAULT_RANGE) {
        params.delete("periode");
      } else {
        params.set("periode", next);
      }

      const query = params.toString();
      router.replace(query ? `/dashboard?${query}` : "/dashboard", { scroll: false });
    },
  ];
}

/**
 * Le tout premier écran que voit un inscrit.
 *
 * Il n'affiche **pas** des cartes à zéro : quatre « 0 » et trois graphiques
 * vides ne disent pas quoi faire, ils donnent l'impression que l'app est
 * cassée. La doc 05 impose explicitement cette variante « premiers pas ».
 */
function FirstSteps() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClipboardListIcon />
        </EmptyMedia>
        <EmptyTitle>Rien à afficher — pour l’instant</EmptyTitle>
        <EmptyDescription>
          Le tableau de bord se remplit tout seul à partir de vos séances. Commencez par préparer
          une routine : c’est la liste d’exercices que vous suivrez en salle.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/routines/new">
              <PlusIcon data-icon="inline-start" />
              Créer une routine
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/exercises">Parcourir les exercices</Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

export function Dashboard() {
  const [range, setRange] = useRange();
  const session = useSession();
  const summary = useStatsSummary(apiClient, range);

  const firstName = session.data?.user.name?.trim().split(/\s+/)[0];

  /**
   * Un seul appel décide de l'écran affiché. On attend délibérément le résumé
   * avant de monter les blocs : les afficher puis les remplacer par l'état vide
   * ferait clignoter cinq squelettes pour rien chez un nouvel inscrit.
   *
   * `range=all` est la bonne question à poser ici — quelqu'un qui n'a pas
   * touché l'app depuis deux mois a un historique, il n'est pas un débutant.
   */
  const lifetime = useStatsSummary(apiClient, "all");
  const isNewcomer = lifetime.isSuccess && lifetime.data.workoutCount === 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ce que disent vos séances, en un coup d’œil.
          </p>
        </div>

        {!isNewcomer && (
          <Select value={range} onValueChange={(value) => setRange(value as StatsRange)}>
            <SelectTrigger className="w-36" aria-label="Période observée">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {RANGE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {isNewcomer ? (
        <FirstSteps />
      ) : (
        <>
          {/*
            Chaque bloc charge ses propres données et porte ses propres états.
            Ils ne se bloquent donc pas mutuellement (doc 05) : la heatmap peut
            arriver après les cartes sans les retenir.
          */}
          {summary.isPending || !summary.data ? (
            <KpiCardsSkeleton />
          ) : (
            <KpiCards range={range} summary={summary.data} />
          )}

          <VolumeChart />

          <div className="grid gap-6 lg:grid-cols-2">
            <MuscleDistribution range={range} />
            <RecentWorkouts />
            <RegularityHeatmap />
            <RecentRecords />
          </div>
        </>
      )}
    </div>
  );
}
