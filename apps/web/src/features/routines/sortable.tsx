"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

import { cn } from "@better-lift/ui/lib/utils";

/**
 * Carte d'exercice réordonnable, avec sa **poignée dédiée**.
 *
 * Rendre toute la carte saisissable rendrait la sélection de texte impossible
 * (doc 05) — or une carte d'exercice est faite de champs qu'on veut pouvoir
 * corriger. Seule la poignée porte donc les écouteurs de glissement.
 *
 * Le glisser-déposer ne porte **que** sur les exercices, pas sur les séries à
 * l'intérieur d'une carte : réordonner deux valeurs saisies dans un tableau de
 * quelques lignes est un geste de précision que personne ne demandait, et il
 * coûtait une poignée par ligne. L'ordre des séries suit désormais l'ordre de
 * saisie.
 *
 * La poignée est un `<button>` : elle reçoit le focus au clavier, et
 * `dnd-kit` y branche Espace pour saisir, les flèches pour déplacer, Entrée
 * pour déposer. C'est l'alternative clavier exigée par l'objectif WCAG 2.1 AA,
 * et elle ne coûte rien de plus que de ne pas la casser.
 */
export function SortableRow({
  id,
  label,
  className = "",
  children,
}: {
  id: string;
  /** Annoncé par le lecteur d'écran à la prise de la poignée. */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // L'élément saisi passe au-dessus et s'allège : sans ce retour, on ne
      // sait pas ce qu'on déplace.
      className={cn(className, isDragging && "relative z-10 opacity-60")}
    >
      {/*
        `overflow-hidden` n'est pas décoratif : sans lui, le fond de la
        poignée déborde des coins arrondis du cadre.

        La poignée est le **flanc gauche de la carte**, dans le cadre, pas à
        côté, séparée par un filet et étirée sur toute sa hauteur : la carte
        fait plusieurs centaines de pixels, et viser un carré de 28 px posé à
        côté de son titre est un geste de précision pour une action qui n'en
        demande pas. Le contenu perd alors son propre cadre — c'est celui-ci
        qui le porte — d'où le `rounded-none border-0` attendu sur la `Card`
        enfant.
      */}
      <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-card">
        {/*
          `touch-none` est indispensable et non décoratif : sans lui, le
          navigateur mobile prend le geste pour un défilement et le glissement
          ne démarre jamais.
        */}
        <button
          type="button"
          aria-label={`Déplacer ${label}`}
          className={cn(
            "flex w-8 shrink-0 cursor-grab touch-none items-center justify-center border-r border-border bg-muted/40 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:cursor-grabbing",
          )}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
