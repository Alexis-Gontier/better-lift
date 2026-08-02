"use client";

import Link from "next/link";

import { ApiClientError, useExercise } from "@better-lift/api-client";

import { ExerciseMedia, MediaAttribution } from "./exercise-media";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { resolveMediaUrl } from "./media";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );
}

/**
 * Fiche d'un exercice (doc 05, § Fiche exercice).
 *
 * Historique personnel, records et courbe de progression viendront avec les
 * séances : ils n'ont aucune donnée à afficher tant que `POST /v1/workouts`
 * n'existe pas. Ce qui est ici est ce que l'API sait déjà servir.
 */
export function ExerciseDetail({ id }: { id: string }) {
  const locale = useProfileLocale();
  const exercise = useExercise(apiClient, id, locale);

  if (exercise.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-40 animate-pulse rounded-xl bg-white/5" />
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
      <div className="space-y-3 rounded-xl bg-surface-raised p-5">
        <p className="font-medium">
          {missing ? "Cet exercice n’est plus au catalogue." : "Fiche indisponible."}
        </p>
        <p className="text-sm text-ink-muted">
          {missing ? "Il a pu être archivé depuis la création du lien." : exercise.error.message}
        </p>
        <Link
          href="/exercises"
          className="inline-block rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const data = exercise.data;
  const hasMedia = Boolean(resolveMediaUrl(data.animationUrl ?? data.thumbnailUrl));

  return (
    <article className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
        <p className="text-ink-muted">
          {BODY_PART_LABELS[data.bodyPart]} · {equipmentLabel(data.equipment)}
        </p>
      </header>

      <div className="space-y-2">
        <ExerciseMedia
          url={data.animationUrl ?? data.thumbnailUrl}
          name={data.name}
          className="aspect-square w-full max-w-xs rounded-xl"
        />
        {hasMedia && <MediaAttribution attribution={data.attribution} />}
      </div>

      <section className="rounded-xl bg-surface-raised p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Muscles
        </h2>
        <dl className="divide-y divide-white/5">
          <Fact label="Muscle cible" value={data.target} />
          <Fact
            label="Muscles secondaires"
            value={data.secondaryMuscles.length ? data.secondaryMuscles.join(", ") : "—"}
          />
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Instructions
        </h2>
        {data.instructions.length > 0 ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {data.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-muted">Aucune instruction disponible dans cette langue.</p>
        )}
      </section>
    </article>
  );
}
