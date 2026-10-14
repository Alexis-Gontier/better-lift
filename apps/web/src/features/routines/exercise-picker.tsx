import type { ExerciceResume } from "@better-lift/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExerciseFilters, type Sort } from "@/features/exercises/exercise-filters";
import type { Practice } from "@/features/exercises/exercise-grid";
import { useExerciseList } from "@/features/exercises/use-exercise-list";

type Choice = Pick<ExerciceResume, "slug" | "nom">;

/**
 * Choisir un ou plusieurs exercices à ajouter (D215). Mêmes outils que la page Exercices
 * (D210, D211) : onglets Tous / Mes exercices, recherche, filtres Muscle / Équipement repliés,
 * tri « Pertinence » qui met tes exercices en tête. Les cases s'additionnent, l'ajout se fait
 * d'un coup, dans l'ordre des coches. Il flotte, donc il se ferme : c'est un dialogue.
 */
export function ExercisePicker({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (exercises: Choice[]) => void;
}) {
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<string>();
  const [equipment, setEquipment] = useState<string>();
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState<Sort>("relevance");
  // Une liste, pas un ensemble : l'ordre des coches devient l'ordre dans la routine.
  const [chosen, setChosen] = useState<Choice[]>([]);

  const list = useExerciseList({
    q: q.trim() || undefined,
    target,
    equipment,
    mine,
    sort,
    enabled: open,
  });

  const isChosen = (slug: string) => chosen.some((c) => c.slug === slug);
  const toggle = (ex: Choice) =>
    setChosen((c) =>
      c.some((x) => x.slug === ex.slug)
        ? c.filter((x) => x.slug !== ex.slug)
        : [...c, { slug: ex.slug, nom: ex.nom }],
    );

  // Fermer oublie la sélection et les filtres : la prochaine ouverture repart à zéro.
  const close = () => {
    setChosen([]);
    setQ("");
    setTarget(undefined);
    setEquipment(undefined);
    setMine(false);
    setSort("relevance");
    onClose();
  };

  const cards = (exercises: ExerciceResume[]) => (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {exercises.map((ex) => (
        <PickerCard
          key={ex.slug}
          exercise={ex}
          practice={list.practicedMap.get(ex.slug)}
          checked={isChosen(ex.slug)}
          onToggle={() => toggle(ex)}
        />
      ))}
    </ul>
  );

  function content() {
    if (list.pending) return <p className="text-sm text-muted-foreground">Chargement…</p>;
    if (list.error) {
      return <p className="text-sm text-destructive-ink">Le catalogue n'a pas pu être chargé.</p>;
    }
    if (list.exercises.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {mine ? "Aucun de tes exercices ne correspond." : "Aucun exercice ne correspond."}
        </p>
      );
    }
    // Tes exercices en tête, titrés à part, comme sur la page Exercices (D210).
    const head = list.headCount;
    return (
      <div className="flex flex-col gap-4">
        {head > 0 ? (
          <>
            <Heading>Tes exercices · {head}</Heading>
            {cards(list.exercises.slice(0, head))}
            {list.exercises.length > head ? <Heading>Le reste du catalogue</Heading> : null}
            {cards(list.exercises.slice(head))}
          </>
        ) : (
          cards(list.exercises)
        )}
        {list.hasMore ? (
          <Button variant="outline" onClick={list.more} className="w-full text-muted-foreground">
            Afficher plus
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex h-[85vh] flex-col gap-4 bg-secondary-background p-5 sm:max-w-4xl">
        <DialogTitle className="text-base">Ajouter des exercices</DialogTitle>
        <DialogDescription className="sr-only">
          Cherche dans le catalogue, en français ou en anglais, coche un ou plusieurs exercices,
          puis ajoute-les à la routine.
        </DialogDescription>
        <Separator className="-mx-5 w-auto!" />

        <ExerciseFilters
          q={q}
          target={target}
          equipment={equipment}
          mine={mine}
          mineCount={list.practiced.data?.length}
          sort={sort}
          onSearch={setQ}
          onTarget={setTarget}
          onEquipment={setEquipment}
          onClearFilters={() => {
            setTarget(undefined);
            setEquipment(undefined);
          }}
          onMine={setMine}
          onSort={setSort}
        />
        <Separator className="-mx-5 w-auto!" />

        {/* Bord à bord : la barre de défilement longe le bord du dialogue ; la marge passe
            à l'intérieur, pour que la liste défile jusqu'aux filets. */}
        <ScrollArea className="-mx-5 -my-4 min-h-0 flex-1">
          <div className="px-5 py-4">{content()}</div>
        </ScrollArea>

        <Separator className="-mx-5 w-auto!" />
        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {chosen.length === 0
              ? "Coche un ou plusieurs exercices."
              : `${chosen.length} exercice${chosen.length > 1 ? "s" : ""} sélectionné${chosen.length > 1 ? "s" : ""}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={close}>
              Annuler
            </Button>
            <Button
              disabled={chosen.length === 0}
              onClick={() => {
                onAdd(chosen);
                close();
              }}
            >
              Ajouter{chosen.length > 0 ? ` (${chosen.length})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold text-muted-foreground uppercase">{children}</h3>;
}

/**
 * Une carte cochable. Toute la carte coche (un label autour de la case) ; cochée, elle
 * s'enfonce sur la surface en retrait — une sélection, jamais l'orange de l'action (D160).
 */
function PickerCard({
  exercise: ex,
  practice,
  checked,
  onToggle,
}: {
  exercise: ExerciceResume;
  practice?: Practice;
  checked: boolean;
  onToggle: () => void;
}) {
  const id = `choix-${ex.slug}`;
  return (
    <li className="flex">
      <label
        htmlFor={id}
        className={`flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-base border-2 border-border pr-3 transition-all ${
          checked
            ? "translate-x-boxShadowX translate-y-boxShadowY bg-muted"
            : "bg-secondary-background shadow-shadow hover:bg-muted/50"
        }`}
      >
        <span className="size-16 shrink-0 border-r-2 border-border bg-image-bg">
          {ex.image ? (
            <img
              src={ex.image}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
              className="size-full object-contain"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 py-2">
          <span className="line-clamp-2 text-sm leading-tight font-bold">{ex.nom}</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">
              {ex.cible} · {ex.equipement}
            </span>
            {practice ? (
              <span
                className="ml-auto shrink-0 rounded-base border-2 border-main bg-main/15 px-1.5 text-[11px] leading-4 font-bold text-main-ink"
                title={`Pratiqué en ${practice.nbSeances} séance${practice.nbSeances > 1 ? "s" : ""}`}
              >
                ×{practice.nbSeances}
              </span>
            ) : null}
          </span>
        </span>
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={`Choisir ${ex.nom}`}
        />
      </label>
    </li>
  );
}
