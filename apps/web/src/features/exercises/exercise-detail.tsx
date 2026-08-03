"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiClientError, useArchiveExercise, useExercise } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Badge } from "@better-lift/ui/components/badge";
import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";

import { ExerciseHistory } from "./exercise-history";
import { ExerciseMedia, MediaAttribution } from "./exercise-media";
import { ExerciseRecords } from "./exercise-records";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { resolveMediaUrl } from "./media";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Actions réservées aux exercices personnalisés.
 *
 * L'archivage demande une confirmation **en place**, en deux temps, plutôt
 * qu'une `confirm()` du navigateur : celle-ci est bloquante, non stylable, et
 * certains navigateurs la suppriment purement et simplement dans les iframes.
 * Deux clics volontaires suffisent à écarter le geste accidentel, qui est le
 * seul risque réel — l'opération reste réversible en base, l'exercice n'étant
 * qu'archivé.
 */
function CustomExerciseActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const archive = useArchiveExercise(apiClient);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/exercises/${id}/edit`}>Modifier</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
          Archiver
        </Button>
      </div>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Archiver « {name} » ?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Il disparaît du catalogue et des sélecteurs. Les séances déjà enregistrées le gardent.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {archive.isError && (
          <Alert variant="destructive">
            <AlertDescription>{archive.error.message}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={archive.isPending}
            onClick={() =>
              archive.mutate(id, {
                // La fiche répond désormais 404 : y rester afficherait une
                // erreur pour une opération pourtant réussie.
                onSuccess: () => router.push("/exercises?custom=true"),
              })
            }
          >
            {archive.isPending && <Spinner data-icon="inline-start" />}
            Confirmer l’archivage
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

/**
 * Fiche d'un exercice (doc 05, § Fiche exercice).
 *
 * Records et historique personnel sont deux requêtes **à part**, servies par
 * `/v1/exercises/:id/{records,history}` : elles dépendent des séances, pas du
 * catalogue, et leurs caches n'ont donc ni la même durée de vie ni les mêmes
 * invalidations. Elles montent après la fiche plutôt que de la retarder.
 *
 * La courbe de progression reste en V2.
 */
export function ExerciseDetail({ id }: { id: string }) {
  const locale = useProfileLocale();
  const exercise = useExercise(apiClient, id, locale);

  if (exercise.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (exercise.isError) {
    /**
     * Un 404 n'est pas une panne : l'exercice a été archivé, ou l'identifiant
     * vient d'un lien périmé. Le dire ainsi évite d'inviter à « réessayer » une
     * requête qui échouera identiquement.
     */
    const missing = exercise.error instanceof ApiClientError && exercise.error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>
          {missing ? "Cet exercice n’est plus au catalogue." : "Fiche indisponible."}
        </AlertTitle>
        <AlertDescription>
          {missing ? "Il a pu être archivé depuis la création du lien." : exercise.error.message}
        </AlertDescription>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/exercises">Retour au catalogue</Link>
        </Button>
      </Alert>
    );
  }

  const data = exercise.data;
  const hasMedia = Boolean(resolveMediaUrl(data.animationUrl ?? data.thumbnailUrl));

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          {data.isCustom && <Badge variant="secondary">Personnalisé</Badge>}
        </div>
        <p className="text-muted-foreground">
          {BODY_PART_LABELS[data.bodyPart]} · {equipmentLabel(data.equipment)}
        </p>
      </header>

      {data.isCustom && <CustomExerciseActions id={data.id} name={data.name} />}

      <div className="flex flex-col gap-2">
        <ExerciseMedia
          url={data.animationUrl ?? data.thumbnailUrl}
          name={data.name}
          className="aspect-square w-full max-w-xs rounded-xl"
        />
        {hasMedia && <MediaAttribution attribution={data.attribution} />}
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Muscles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <Fact label="Muscle cible" value={data.target} />
            <Fact
              label="Muscles secondaires"
              value={data.secondaryMuscles.length ? data.secondaryMuscles.join(", ") : "—"}
            />
          </dl>
        </CardContent>
      </Card>

      <ExerciseRecords id={data.id} />

      <ExerciseHistory id={data.id} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Instructions
        </h2>
        {data.instructions.length > 0 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {data.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune instruction disponible dans cette langue.
          </p>
        )}
      </section>
    </article>
  );
}
