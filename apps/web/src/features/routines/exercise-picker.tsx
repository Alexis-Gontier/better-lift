import { type ExerciceResume, GROUPES, type Groupe, LIBELLE_GROUPE } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useState } from "react";
import { ExerciseThumb } from "@/components/exercise-media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { catalogueQuery } from "@/lib/catalogue";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOUS = "tous";

/** Une carte du catalogue : cochée, elle montre son rang d'ajout. */
function PickCard({
  exercise,
  rank,
  disabled,
  onToggle,
}: {
  exercise: ExerciceResume;
  /** Rang dans la sélection (1, 2…), ou 0 si elle n'est pas cochée. */
  rank: number;
  disabled: boolean;
  onToggle: () => void;
}) {
  const checked = rank > 0;
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled && !checked}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:hover:bg-transparent",
        checked && "border-foreground/40 bg-muted/50",
      )}
    >
      <ExerciseThumb name={exercise.nom} src={exercise.image} className="size-12" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium" title={exercise.nom}>
          {exercise.nom}
        </span>
        <span className="truncate text-muted-foreground text-xs">
          {LIBELLE_GROUPE[exercise.groupe]} · {exercise.equipement}
        </span>
      </span>
      {/* Le rang plutôt qu'une coche : les exercices s'ajoutent dans l'ordre où on les coche. */}
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border font-semibold text-xs tabular-nums",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {checked ? rank : null}
      </span>
    </button>
  );
}

/**
 * Ajouter des exercices à une routine (D262) : le catalogue en cartes, la recherche (noms
 * français et anglais, côté serveur) et un filtre par muscle ; on en coche plusieurs, ils
 * s'ajoutent dans l'ordre coché. Ceux déjà dans la routine n'y figurent pas.
 */
export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
  present,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (exercices: ExerciceResume[]) => void;
  /** Les exercices déjà dans la routine. */
  present: readonly string[];
  /** Combien la routine peut encore en recevoir (50 au plus). */
  room: number;
}) {
  const [saisie, setSaisie] = useState("");
  const q = useDebounce(saisie);
  const [groupe, setGroupe] = useState<Groupe | typeof TOUS>(TOUS);
  const [picked, setPicked] = useState<ExerciceResume[]>([]);
  const catalogue = useInfiniteQuery({
    ...catalogueQuery({ q, ...(groupe !== TOUS && { groupe }) }),
    enabled: open,
  });

  const lus = catalogue.data?.pages.flatMap((p) => p.exercices) ?? [];
  const shown = lus.filter((e) => !present.includes(e.slug));
  const full = picked.length >= room;
  // Sans eux, une recherche peut ne rien rendre : le vide dit pourquoi.
  const hiddenMatch = shown.length === 0 && lus.length > 0;

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setPicked([]);
      setSaisie("");
      setGroupe(TOUS);
    }
  }

  const toggle = (e: ExerciceResume) =>
    setPicked((p) =>
      p.some((x) => x.slug === e.slug) ? p.filter((x) => x.slug !== e.slug) : [...p, e],
    );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[min(44rem,calc(100svh-4rem))] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Ajouter des exercices</DialogTitle>
          <DialogDescription className="sr-only">
            Cochez un ou plusieurs exercices du catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b p-4">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            {/* Le nom anglais se cherche aussi : « bench press » trouve le développé couché. */}
            <InputGroupInput
              autoFocus
              aria-label="Rechercher un exercice"
              placeholder="développé, squat, bench press…"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
            />
          </InputGroup>
          <Select value={groupe} onValueChange={(v) => setGroupe(v as Groupe | typeof TOUS)}>
            <SelectTrigger aria-label="Muscle" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value={TOUS}>Tous les muscles</SelectItem>
                {GROUPES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {LIBELLE_GROUPE[g]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="min-h-0 [&_[data-slot=scroll-area-viewport]>div]:block!">
          {catalogue.isPending ? (
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-19 rounded-xl" />
              ))}
            </div>
          ) : catalogue.isError ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyTitle>Le catalogue n'a pas pu se charger</EmptyTitle>
                <EmptyDescription>{catalogue.error.message}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : shown.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyTitle>
                  {hiddenMatch ? "Déjà dans la routine" : "Aucun exercice ne correspond"}
                </EmptyTitle>
                <EmptyDescription>
                  {hiddenMatch
                    ? "Les exercices de la routine ne sont pas proposés à nouveau."
                    : "Essayez un autre mot, ou tous les muscles."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {shown.map((e) => (
                  <PickCard
                    key={e.slug}
                    exercise={e}
                    rank={picked.findIndex((x) => x.slug === e.slug) + 1}
                    disabled={full}
                    onToggle={() => toggle(e)}
                  />
                ))}
              </div>
              {catalogue.hasNextPage && (
                <Button
                  variant="outline"
                  className="self-center"
                  disabled={catalogue.isFetchingNextPage}
                  onClick={() => void catalogue.fetchNextPage()}
                >
                  {catalogue.isFetchingNextPage ? "Chargement…" : "Afficher plus"}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="m-0 items-center p-4 sm:justify-between">
          <span className="text-muted-foreground text-sm" aria-live="polite">
            {picked.length === 0 ? (
              "Cochez un ou plusieurs exercices."
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="size-4" />
                {plural(picked.length, "exercice")} dans l'ordre coché
                {full && " · la routine est pleine (50)"}
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => close(false)}>
              Annuler
            </Button>
            <Button
              disabled={picked.length === 0}
              onClick={() => {
                onPick(picked);
                close(false);
              }}
            >
              {picked.length > 1 ? `Ajouter (${picked.length})` : "Ajouter"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
