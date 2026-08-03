"use client";

import { TrophyIcon } from "lucide-react";
import Link from "next/link";

import { useStatsRecords } from "@better-lift/api-client";
import { Badge } from "@better-lift/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { useProfileLocale } from "@/features/account/use-profile-locale";
import { RECORD_TYPE_LABELS } from "@/features/workouts/labels";
import { RecordValue } from "@/features/workouts/record-value";
import { apiClient } from "@/lib/api";

function RecentRecordsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Records récents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Les derniers records battus (doc 05).
 *
 * Les records sont calculés serveur (règle non négociable n°6) : rien n'est
 * recalculé ici, on affiche ce que l'API a établi dans la transaction de fin
 * de séance.
 */
export function RecentRecords() {
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const records = useStatsRecords(apiClient, { limit: 6, locale });

  if (records.isPending) {
    return <RecentRecordsSkeleton />;
  }

  if (records.isError || !records.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Records récents</CardTitle>
          <CardDescription>Les records n’ont pas pu être chargés.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records récents</CardTitle>
      </CardHeader>
      <CardContent>
        {records.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun record pour l’instant. Ils se calculent tout seuls, à chaque séance enregistrée.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {records.data.map((record) => (
              <li key={record.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <TrophyIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  {/*
                    `min-w-0` sur le conteneur et `truncate` sur le nom : un
                    intitulé d'exercice long pousserait sinon la valeur hors de
                    la carte au lieu d'être coupé.
                  */}
                  <p className="truncate text-sm font-medium">
                    <Link
                      href={`/exercises/${record.exercise.id}`}
                      className="rounded-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {record.exercise.name}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="secondary" className="mr-1.5 font-normal">
                      {RECORD_TYPE_LABELS[record.type]}
                    </Badge>
                    <time dateTime={record.achievedAt}>
                      {dateFormatter.format(new Date(record.achievedAt))}
                    </time>
                  </p>
                </div>

                <span className="shrink-0 text-sm font-medium tabular-nums">
                  <RecordValue type={record.type} value={record.value} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
