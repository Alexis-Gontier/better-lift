"use client";

import { TrophyIcon } from "lucide-react";
import Link from "next/link";

import { useExerciseRecords } from "@better-lift/api-client";
import { Badge } from "@better-lift/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { useProfileLocale } from "@/features/account/use-profile-locale";
import { RECORD_TYPE_LABELS } from "@/features/workouts/labels";
import { RecordValue } from "@/features/workouts/record-value";
import { apiClient } from "@/lib/api";

/**
 * Records personnels sur un exercice (doc 05, § Fiche exercice).
 *
 * Rien n'est recalculé ici : les records sont établis serveur dans la
 * transaction de fin de séance (règle non négociable n°6). Cette carte ne fait
 * que lire ce que l'API a arrêté — c'est aussi pourquoi elle ne connaît pas le
 * type de l'exercice : `RECORD_TYPE_LABELS` dit déjà de quoi il s'agit.
 */
export function ExerciseRecords({ id }: { id: string }) {
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const records = useExerciseRecords(apiClient, id);

  if (records.isPending) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (records.isError) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Records</CardTitle>
      </CardHeader>
      <CardContent>
        {records.data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun record sur cet exercice. Ils se calculent tout seuls, à la première séance
            enregistrée.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {records.data.data.map((record) => (
              <li key={record.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <TrophyIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Badge variant="secondary" className="mr-1.5 font-normal">
                      {RECORD_TYPE_LABELS[record.type]}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={record.achievedAt}>
                      {dateFormatter.format(new Date(record.achievedAt))}
                    </time>
                    {/*
                      La séance manque quand elle a été supprimée : le record,
                      lui, reste vrai — il a été reconstruit depuis le reste de
                      l'historique (D23). Afficher un lien mort serait pire que
                      de n'en afficher aucun.
                    */}
                    {record.workoutId !== null && (
                      <>
                        {" · "}
                        <Link href={`/workouts/${record.workoutId}`} className="hover:underline">
                          voir la séance
                        </Link>
                      </>
                    )}
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
