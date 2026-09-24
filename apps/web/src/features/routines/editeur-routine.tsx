import type { ExerciceRoutine, RoutineDetail } from "@better-lift/shared";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { BoutonFermer } from "./bouton-fermer";
import { brouillonValide, nouvelExercice, versBrouillon, versRoutine } from "./brouillon";
import { CarteExercice } from "./carte-exercice";
import { ConfirmerSuppression } from "./confirmer-suppression";
import { SelecteurExercice } from "./selecteur-exercice";

export type RoutineEnregistree = { nom: string; exercices: ExerciceRoutine[] };

/**
 * L'éditeur de routine, dans le panneau détail (D49).
 *
 * Il travaille sur une COPIE : rien ne part tant qu'on n'enregistre pas, et
 * « Annuler » jette la copie. Seuls les exercices se glissent (D48) : pas de
 * contexte imbriqué, donc pas le piège de collision du § 13.
 */
export function EditeurRoutine({
  initiale,
  enregistrement,
  erreur,
  onEnregistrer,
  onAnnuler,
  onSupprimer,
}: {
  /** `null` pour une routine neuve. */
  initiale: RoutineDetail | null;
  enregistrement: boolean;
  /** L'échec du dernier enregistrement : il doit se voir, sinon on croit avoir enregistré. */
  erreur?: string;
  onEnregistrer: (r: RoutineEnregistree) => void;
  onAnnuler: () => void;
  onSupprimer?: () => void;
}) {
  const [brouillon, setBrouillon] = useState(() => versBrouillon(initiale));
  const [selecteur, setSelecteur] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const capteurs = useSensors(
    // 4 px avant de démarrer : sans ce seuil, un simple clic sur la poignée
    // compterait comme un glisser.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const deposer = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setBrouillon((b) => {
      const de = b.exercices.findIndex((e) => e.cle === active.id);
      const vers = b.exercices.findIndex((e) => e.cle === over.id);
      return { ...b, exercices: arrayMove(b.exercices, de, vers) };
    });
  };

  const valide = brouillonValide(brouillon);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-(--line) px-5 py-3">
        <input
          aria-label="Nom de la routine"
          placeholder="Nom de la routine"
          maxLength={120}
          value={brouillon.nom}
          onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-base font-semibold tracking-tight outline-none hover:border-(--line) focus-visible:border-(--line) focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        />
        <BoutonFermer onFermer={onAnnuler} />
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-auto px-5 py-4">
        {brouillon.exercices.length === 0 ? (
          <p className="rounded-md border border-dashed border-(--line) px-4 py-6 text-center text-sm text-(--ink-faint)">
            Aucun exercice pour l'instant. Ajoute le premier ci-dessous.
          </p>
        ) : (
          <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={deposer}>
            <SortableContext
              items={brouillon.exercices.map((e) => e.cle)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="flex flex-col gap-3">
                {brouillon.exercices.map((ex) => (
                  <CarteExercice
                    key={ex.cle}
                    exercice={ex}
                    onChange={(nouveau) =>
                      setBrouillon((b) => ({
                        ...b,
                        exercices: b.exercices.map((e) => (e.cle === ex.cle ? nouveau : e)),
                      }))
                    }
                    onRetirer={() =>
                      setBrouillon((b) => ({
                        ...b,
                        exercices: b.exercices.filter((e) => e.cle !== ex.cle),
                      }))
                    }
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}

        <button
          type="button"
          onClick={() => setSelecteur(true)}
          className="rounded-md border border-dashed border-(--line) py-2.5 text-sm text-(--ink-subtle) hover:bg-(--surface-2) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
        >
          + exercice
        </button>
      </div>

      {erreur ? (
        <p role="alert" className="border-t border-(--line) px-5 pt-3 text-sm text-destructive-ink">
          {erreur}
        </p>
      ) : null}
      <div className="flex items-center gap-2 border-t border-(--line) px-5 py-3">
        {onSupprimer ? (
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            className="rounded-md px-3 py-2 text-sm text-destructive-ink hover:bg-(--surface-2) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
          >
            Supprimer
          </button>
        ) : null}
        <button
          type="button"
          onClick={onAnnuler}
          className="ml-auto rounded-md border border-(--line) px-3 py-2 text-sm text-(--ink) hover:bg-(--surface-2) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!valide || enregistrement}
          onClick={() => onEnregistrer(versRoutine(brouillon))}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <SelecteurExercice
        ouvert={selecteur}
        onFermer={() => setSelecteur(false)}
        onChoisir={(slug, nom) => {
          setBrouillon((b) => ({ ...b, exercices: [...b.exercices, nouvelExercice(slug, nom)] }));
          setSelecteur(false);
        }}
      />
      {onSupprimer ? (
        <ConfirmerSuppression
          nom={brouillon.nom || "cette routine"}
          ouvert={confirmation}
          onFermer={() => setConfirmation(false)}
          onConfirmer={() => {
            setConfirmation(false);
            onSupprimer();
          }}
        />
      ) : null}
    </div>
  );
}
