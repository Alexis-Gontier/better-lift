import {
  brouillonValide,
  defaireGroupe,
  deplacerAvecGroupes,
  type ExerciceBrouillon,
  empreinte,
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
  versSaisie,
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
import { Ellipsis, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DansEnTete } from "@/components/shell/en-tete-page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SYSTEME_UNITES } from "@/lib/unites";
import { BoutonFermer } from "./bouton-fermer";
import { CarteExercice } from "./carte-exercice";
import { ConfirmerSuppression } from "./confirmer-suppression";
import { EtiquetteSuperset } from "./etiquette-superset";
import { optionsPrecedentes } from "./requetes";
import { SelecteurExercice } from "./selecteur-exercice";

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
  onEnregistrer: (r: RoutineSaisie) => void;
  /** Ferme la routine (et abandonne une routine neuve). */
  onFermer: () => void;
  onSupprimer?: () => void;
}) {
  const [brouillon, setBrouillon] = useState(() => versBrouillon(initiale, SYSTEME_UNITES));
  // La référence suit la version ENREGISTRÉE : après un enregistrement réussi,
  // `initiale` devient la copie, et la barre disparaît d'elle-même.
  const reference = useMemo(() => empreinte(versBrouillon(initiale, SYSTEME_UNITES)), [initiale]);
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

  // Toute retouche de la liste passe par ici : les règles des supersets (D147,
  // D148) s'appliquent à l'état du moment, pas à celui du dernier rendu.
  const modifier = (f: (xs: ExerciceBrouillon[]) => ExerciceBrouillon[]) =>
    setBrouillon((b) => ({ ...b, exercices: f(b.exercices) }));

  const deposer = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    modifier((xs) => {
      const de = xs.findIndex((e) => e.cle === active.id);
      const vers = xs.findIndex((e) => e.cle === over.id);
      // D148 : le déplacé quitte son groupe, ou rejoint celui où il tombe.
      return deplacerAvecGroupes(xs, de, vers);
    });
  };

  const blocs = groupes(brouillon.exercices);
  const carte = (ex: ExerciceBrouillon, i: number) => (
    <CarteExercice
      key={ex.cle}
      exercice={ex}
      derniere={meilleureSerie(precedentes.data?.[ex.slug] ?? [])}
      repos={roleRepos(brouillon.exercices, i)}
      peutLier={peutLierAuSuivant(brouillon.exercices, i)}
      dansGroupe={roleRepos(brouillon.exercices, i) !== "propre"}
      onLier={() => modifier((xs) => lierAuSuivant(xs, i))}
      onDelier={() => modifier((xs) => retirerDuGroupe(xs, i))}
      onChange={(nouveau) => modifier((xs) => xs.map((e) => (e.cle === ex.cle ? nouveau : e)))}
      onRetirer={() => modifier((xs) => normaliserGroupes(xs.filter((e) => e.cle !== ex.cle)))}
    />
  );

  const valide = brouillonValide(brouillon, SYSTEME_UNITES);

  return (
    <div className="flex h-full flex-col">
      {/* Les actions montent dans l'en-tête commun (D157) : enregistrer d'abord, quand il y a
          des changements, puis le menu et la fermeture. */}
      <DansEnTete titre={brouillon.nom || "Nouvelle routine"}>
        {modifiee ? (
          <>
            <span className="text-[13px] text-muted-foreground">
              {initiale ? "Modifications non enregistrées" : "Nouvelle routine"}
            </span>
            <Button
              variant="outline"
              size="sm"
              // Annuler une routine neuve la ferme ; une existante revient à sa
              // version enregistrée.
              onClick={() =>
                initiale ? setBrouillon(versBrouillon(initiale, SYSTEME_UNITES)) : onFermer()
              }
            >
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={!valide || enregistrement}
              onClick={() => onEnregistrer(versSaisie(brouillon, SYSTEME_UNITES))}
              className="font-semibold"
            >
              {enregistrement ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        ) : null}
        {onSupprimer ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Actions de la routine"
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setConfirmation(true)} className="text-destructive">
                <Trash2 aria-hidden="true" />
                Supprimer la routine
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <BoutonFermer onFermer={onFermer} />
      </DansEnTete>
      <div className="px-6 pt-5 pb-2">
        <input
          aria-label="Nom de la routine"
          placeholder="Nom de la routine"
          maxLength={120}
          value={brouillon.nom}
          onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
          className="-ml-2 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-[22px] font-extrabold tracking-tight outline-none hover:border-border focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-6 pt-2 pb-6">
          {brouillon.exercices.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun exercice pour l'instant. Ajoute le premier ci-dessous.
            </p>
          ) : (
            <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={deposer}>
              <SortableContext
                items={brouillon.exercices.map((e) => e.cle)}
                strategy={verticalListSortingStrategy}
              >
                <ol className="flex flex-col gap-3">
                  {brouillon.exercices.map((ex, i) => {
                    // Un superset se rend d'un bloc (D151) : étiquette, puis ses
                    // membres derrière le filet. Le SortableContext, lui, garde la
                    // liste plate des clés.
                    const g = blocs.find((b) => b.debut <= i && i <= b.fin);
                    if (!g) return carte(ex, i);
                    if (i !== g.debut) return null;
                    return (
                      <li key={`superset-${ex.cle}`}>
                        <EtiquetteSuperset
                          lettre={g.lettre}
                          onDefaire={() => modifier((xs) => defaireGroupe(xs, i))}
                        />
                        <ol className="flex flex-col gap-3 border-l-[3px] border-chart-2 pl-3">
                          {brouillon.exercices
                            .slice(g.debut, g.fin + 1)
                            .map((m, k) => carte(m, g.debut + k))}
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
            onClick={() => setSelecteur(true)}
            className="h-11 border-dashed text-muted-foreground"
          >
            <Plus aria-hidden="true" />
            Ajouter un exercice
          </Button>
        </div>
      </ScrollArea>

      {erreur ? (
        <p role="alert" className="border-t border-border px-6 py-3 text-sm text-destructive">
          {erreur}
        </p>
      ) : null}
      <SelecteurExercice
        ouvert={selecteur}
        onFermer={() => setSelecteur(false)}
        onAjouter={(choisis) =>
          setBrouillon((b) => ({
            ...b,
            exercices: [...b.exercices, ...choisis.map((c) => nouvelExercice(c.slug, c.nom))],
          }))
        }
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
