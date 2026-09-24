import { type ExerciceRoutine, meilleureSerie, type RoutineDetail } from "@better-lift/shared";
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
import { useQuery } from "@tanstack/react-query";
import { Ellipsis, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BoutonFermer } from "./bouton-fermer";
import {
  type Brouillon,
  brouillonValide,
  nouvelExercice,
  versBrouillon,
  versRoutine,
} from "./brouillon";
import { CarteExercice } from "./carte-exercice";
import { ConfirmerSuppression } from "./confirmer-suppression";
import { optionsPrecedentes } from "./requetes";
import { SelecteurExercice } from "./selecteur-exercice";

/** Le brouillon sans ses clés locales : ce qu'on compare pour savoir s'il a changé. */
const empreinte = (b: Brouillon) =>
  JSON.stringify({ ...b, exercices: b.exercices.map(({ cle: _cle, ...e }) => e) });

export type RoutineEnregistree = { nom: string; exercices: ExerciceRoutine[] };

/**
 * La routine ouverte, TOUJOURS modifiable (plus de mode lecture) : on la lit et
 * on la retouche au même endroit, comme sur Hevy.
 *
 * Il travaille sur une COPIE : rien ne part tant qu'on n'enregistre pas. La
 * barre « Annuler / Enregistrer » n'apparaît qu'une fois la copie différente de
 * la version enregistrée — sinon elle ne dirait rien. Seuls les exercices se
 * glissent (D48) : pas de contexte imbriqué, donc pas le piège de collision du § 13.
 */
export function EditeurRoutine({
  initiale,
  enregistrement,
  erreur,
  onEnregistrer,
  onFermer,
  onSupprimer,
}: {
  /** `null` pour une routine neuve. */
  initiale: RoutineDetail | null;
  enregistrement: boolean;
  /** L'échec du dernier enregistrement : il doit se voir, sinon on croit avoir enregistré. */
  erreur?: string;
  onEnregistrer: (r: RoutineEnregistree) => void;
  /** Ferme la routine (et abandonne une routine neuve). */
  onFermer: () => void;
  onSupprimer?: () => void;
}) {
  const [brouillon, setBrouillon] = useState(() => versBrouillon(initiale));
  // La référence suit la version ENREGISTRÉE : après un enregistrement réussi,
  // `initiale` devient la copie, et la barre disparaît d'elle-même.
  const reference = useMemo(() => empreinte(versBrouillon(initiale)), [initiale]);
  const modifiee = initiale === null || empreinte(brouillon) !== reference;
  const precedentes = useQuery(optionsPrecedentes(brouillon.exercices.map((e) => e.slug)));
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
      <div className="flex items-center gap-2 border-b border-(--line) px-6 py-3">
        <input
          aria-label="Nom de la routine"
          placeholder="Nom de la routine"
          maxLength={120}
          value={brouillon.nom}
          onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
          className="-ml-2 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-semibold tracking-tight outline-none hover:border-(--line) focus-visible:border-(--line) focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        />
        {onSupprimer ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-(--ink-subtle)"
                aria-label="Actions de la routine"
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setConfirmation(true)}
                className="text-destructive-ink"
              >
                <Trash2 aria-hidden="true" />
                Supprimer la routine
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <BoutonFermer onFermer={onFermer} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-8 py-6">
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
                      derniere={meilleureSerie(precedentes.data?.[ex.slug] ?? [])}
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

          <Button
            variant="outline"
            onClick={() => setSelecteur(true)}
            className="h-11 border-dashed text-(--ink-subtle)"
          >
            <Plus aria-hidden="true" />
            Ajouter un exercice
          </Button>
        </div>
      </ScrollArea>

      {erreur ? (
        <p role="alert" className="border-t border-(--line) px-6 pt-3 text-sm text-destructive-ink">
          {erreur}
        </p>
      ) : null}
      {/* La barre n'apparaît qu'avec des changements à enregistrer. */}
      {modifiee ? (
        <div className="flex items-center gap-2 border-t border-(--line) px-6 py-3">
          <span className="text-sm text-(--ink-subtle)">
            {initiale ? "Modifications non enregistrées" : "Nouvelle routine"}
          </span>
          <Button
            variant="outline"
            // Annuler une routine neuve la ferme ; une existante revient à sa
            // version enregistrée.
            onClick={() => (initiale ? setBrouillon(versBrouillon(initiale)) : onFermer())}
            className="ml-auto"
          >
            Annuler
          </Button>
          <Button
            disabled={!valide || enregistrement}
            onClick={() => onEnregistrer(versRoutine(brouillon))}
            className="font-semibold"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      ) : null}

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
