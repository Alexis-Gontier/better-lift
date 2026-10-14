import {
  defaireGroupe,
  deplacerAvecGroupes,
  type ExerciceBrouillon,
  groupes,
  lierAuSuivant,
  meilleureSerie,
  normaliserGroupes,
  nouvelExercice,
  peutLierAuSuivant,
  type RoutineDetail,
  type RoutineSaisie,
  retirerDuGroupe,
  roleRepos,
  versBrouillon,
} from "@better-lift/shared";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UNIT_SYSTEM } from "@/lib/units";
import { ConfirmDelete } from "./confirm-delete";
import { ExerciseCard } from "./exercise-card";
import { ExercisePicker } from "./exercise-picker";
import { previousOptions } from "./queries";
import { SupersetLabel } from "./superset-label";

/**
 * La routine ouverte, TOUJOURS modifiable (plus de mode lecture) : on la lit et
 * on la retouche au même endroit, comme sur Hevy.
 *
 * Il travaille sur une COPIE : rien ne part tant qu'on n'enregistre pas. La
 * barre « Annuler / Enregistrer » n'apparaît qu'une fois la copie différente de
 * la version enregistrée — sinon elle ne dirait rien. Seuls les exercices se
 * glissent (D48) : pas de contexte imbriqué, donc pas le piège de collision du § 13.
 */
export function RoutineEditor({
  initial,
  erreur: error,
  onDelete,
}: {
  /** `null` pour une routine neuve. */
  initial: RoutineDetail | null;
  saving: boolean;
  /** L'échec du dernier enregistrement : il doit se voir, sinon on croit avoir enregistré. */
  erreur?: string;
  onSave: (r: RoutineSaisie) => void;
  /** Ferme la routine (et abandonne une routine neuve). */
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState(() => versBrouillon(initial, UNIT_SYSTEM));
  const previous = useQuery(previousOptions(draft.exercices.map((e) => e.slug)));
  const [picker, setPicker] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  const sensors = useSensors(
    // 4 px avant de démarrer : sans ce seuil, un simple clic sur la poignée
    // compterait comme un glisser.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Toute retouche de la liste passe par ici : les règles des supersets (D147,
  // D148) s'appliquent à l'état du moment, pas à celui du dernier rendu.
  const update = (f: (xs: ExerciceBrouillon[]) => ExerciceBrouillon[]) =>
    setDraft((b) => ({ ...b, exercices: f(b.exercices) }));

  const drop = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((xs) => {
      const of = xs.findIndex((e) => e.cle === active.id);
      const to = xs.findIndex((e) => e.cle === over.id);
      // D148 : le déplacé quitte son groupe, ou rejoint celui où il tombe.
      return deplacerAvecGroupes(xs, of, to);
    });
  };

  const blocks = groupes(draft.exercices);
  const card = (ex: ExerciceBrouillon, i: number) => (
    <ExerciseCard
      key={ex.cle}
      exercise={ex}
      last={meilleureSerie(previous.data?.[ex.slug] ?? [])}
      rest={roleRepos(draft.exercices, i)}
      canLink={peutLierAuSuivant(draft.exercices, i)}
      inGroup={roleRepos(draft.exercices, i) !== "propre"}
      onLink={() => update((xs) => lierAuSuivant(xs, i))}
      onUnlink={() => update((xs) => retirerDuGroupe(xs, i))}
      onChange={(next) => update((xs) => xs.map((e) => (e.cle === ex.cle ? next : e)))}
      onRemove={() => update((xs) => normaliserGroupes(xs.filter((e) => e.cle !== ex.cle)))}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-5 pb-2">
        <input
          aria-label="Nom de la routine"
          placeholder="Nom de la routine"
          maxLength={120}
          value={draft.nom}
          onChange={(e) => setDraft({ ...draft, nom: e.target.value })}
          className="-ml-2 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-[22px] font-extrabold tracking-tight outline-none hover:border-border focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-6 pt-2 pb-6">
          {draft.exercices.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun exercice pour l'instant. Ajoute le premier ci-dessous.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drop}>
              <SortableContext
                items={draft.exercices.map((e) => e.cle)}
                strategy={verticalListSortingStrategy}
              >
                <ol className="flex flex-col gap-3">
                  {draft.exercices.map((ex, i) => {
                    // Un superset se rend d'un bloc (D151) : étiquette, puis ses
                    // membres derrière le filet. Le SortableContext, lui, garde la
                    // liste plate des clés.
                    const g = blocks.find((b) => b.debut <= i && i <= b.fin);
                    if (!g) return card(ex, i);
                    if (i !== g.debut) return null;
                    return (
                      <li key={`superset-${ex.cle}`}>
                        <SupersetLabel
                          letter={g.lettre}
                          onUndo={() => update((xs) => defaireGroupe(xs, i))}
                        />
                        <ol className="flex flex-col gap-3 border-l-[3px] border-superset pl-3">
                          {draft.exercices
                            .slice(g.debut, g.fin + 1)
                            .map((m, k) => card(m, g.debut + k))}
                        </ol>
                      </li>
                    );
                  })}
                </ol>
              </SortableContext>
            </DndContext>
          )}

          <Button
            variant="outline"
            onClick={() => setPicker(true)}
            className="h-11 border-dashed text-muted-foreground"
          >
            <Plus aria-hidden="true" />
            Ajouter un exercice
          </Button>
        </div>
      </ScrollArea>

      {error ? (
        <p role="alert" className="border-t border-border px-6 py-3 text-sm text-destructive-ink">
          {error}
        </p>
      ) : null}
      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onAdd={(chosen) =>
          setDraft((b) => ({
            ...b,
            exercices: [...b.exercices, ...chosen.map((c) => nouvelExercice(c.slug, c.nom))],
          }))
        }
      />
      {onDelete ? (
        <ConfirmDelete
          name={draft.nom || "cette routine"}
          open={confirmation}
          onClose={() => setConfirmation(false)}
          onConfirm={() => {
            setConfirmation(false);
            onDelete();
          }}
        />
      ) : null}
    </div>
  );
}
