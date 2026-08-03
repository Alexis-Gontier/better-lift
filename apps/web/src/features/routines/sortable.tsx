"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

import { Button } from "@better-lift/ui/components/button";
import { cn } from "@better-lift/ui/lib/utils";

/**
 * Un seul `DndContext` couvre l'éditeur, exercices **et** séries — imbriquer
 * deux contextes rend le routage des événements dépendant de l'ordre de
 * montage. Les identifiants sont donc préfixés pour dire à quelle liste
 * appartient l'élément saisi, et `parseDndId` les relit à la dépose.
 */
export function exerciseDndId(key: string): string {
  return `ex:${key}`;
}

export function setDndId(exerciseKey: string, setKey: string): string {
  return `set:${exerciseKey}:${setKey}`;
}

export type DndTarget =
  | { kind: "exercise"; key: string }
  | { kind: "set"; exerciseKey: string; setKey: string };

export function parseDndId(id: string): DndTarget | null {
  const [prefix, ...rest] = id.split(":");

  if (prefix === "ex" && rest[0]) {
    return { kind: "exercise", key: rest[0] };
  }

  if (prefix === "set" && rest[0] && rest[1]) {
    return { kind: "set", exerciseKey: rest[0], setKey: rest[1] };
  }

  return null;
}

/**
 * Ligne réordonnable, avec sa **poignée dédiée**.
 *
 * Rendre toute la ligne saisissable rendrait la sélection de texte impossible
 * (doc 05) — or une ligne de série est faite de champs qu'on veut pouvoir
 * corriger. Seule la poignée porte donc les écouteurs de glissement.
 *
 * La même poignée est un `<button>` : elle reçoit le focus au clavier, et
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
      <div className="flex items-start gap-2">
        {/*
          `touch-none` est indispensable et non décoratif : sans lui, le
          navigateur mobile interprète le geste comme un défilement et le
          glissement ne démarre jamais.
        */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Déplacer ${label}`}
          className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon />
        </Button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
