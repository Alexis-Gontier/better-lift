"use client";

import Link from "next/link";

import { ApiClientError, useExercise } from "@better-lift/api-client";

import { ExerciseForm } from "./exercise-form";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Chargement de l'exercice avant édition.
 *
 * Le cas qui mérite l'attention est celui d'un exercice **du catalogue** : le
 * `GET` réussit, puisqu'il est visible de tous, et un formulaire pré-rempli
 * s'afficherait sans problème apparent — pour échouer en 403 à l'enregistrement,
 * après la saisie. On refuse donc tout de suite, avant que quiconque ait tapé
 * quoi que ce soit.
 */
export function ExerciseEdit({ id }: { id: string }) {
  const locale = useProfileLocale();
  const exercise = useExercise(apiClient, id, locale);

  if (exercise.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-10 animate-pulse rounded-lg bg-white/5" />
        <div className="h-40 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  if (exercise.isError) {
    const missing = exercise.error instanceof ApiClientError && exercise.error.status === 404;

    return (
      <Refusal
        title={missing ? "Cet exercice n’est plus au catalogue." : "Fiche indisponible."}
        detail={missing ? "Il a pu être archivé depuis." : exercise.error.message}
      />
    );
  }

  if (!exercise.data.isCustom) {
    return (
      <Refusal
        title="Le catalogue commun n’est pas modifiable."
        detail="Créer un exercice personnalisé permet d’en faire sa propre version."
        action={{ href: "/exercises/new", label: "Créer un exercice" }}
      />
    );
  }

  return <ExerciseForm exercise={exercise.data} />;
}

function Refusal({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: { href: "/exercises/new" | "/exercises"; label: string };
}) {
  return (
    <div className="space-y-3 rounded-xl bg-surface-raised p-5">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-ink-muted">{detail}</p>
      <Link
        href={action?.href ?? "/exercises"}
        className="inline-block rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
      >
        {action?.label ?? "Retour au catalogue"}
      </Link>
    </div>
  );
}
