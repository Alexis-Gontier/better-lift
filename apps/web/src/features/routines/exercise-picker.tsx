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
import { fold } from "@/lib/fold";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useExercises } from "@/mocks/exercise-store";
import type { MockExercise } from "@/mocks/exercises";
import type { MockRoutineExercise } from "@/mocks/routines";

const ALL = "tous";

/** Un exercice tout juste ajouté : une série de 10, charge à noter, 1 min 30 de repos. */
export function newRoutineExercise(slug: string): MockRoutineExercise {
  return { slug, sets: [{ kg: null, reps: 10 }], restSeconds: 90 };
}

/** Une carte du catalogue : cochée, elle montre son rang d'ajout. */
function PickCard({
  exercise,
  rank,
  present,
  disabled,
  onToggle,
}: {
  exercise: MockExercise;
  /** Rang dans la sélection (1, 2…), ou 0 si elle n'est pas cochée. */
  rank: number;
  present: boolean;
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
      <ExerciseThumb name={exercise.name} className="size-12" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 font-medium leading-snug" title={exercise.name}>
          {exercise.name}
        </span>
        <span className="truncate text-muted-foreground text-xs">
          {exercise.muscle} · {exercise.equipment}
        </span>
        {present && <span className="text-muted-foreground text-xs">Déjà dans la routine</span>}
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
 * Ajouter des exercices à une routine (D262) : le catalogue en cartes, une recherche sans accents
 * et un filtre par muscle ; on en coche plusieurs, ils s'ajoutent dans l'ordre coché. Ceux déjà
 * dans la routine restent cochables (on peut vouloir deux fois le même) mais le disent.
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
  onPick: (slugs: string[]) => void;
  /** Les exercices déjà dans la routine. */
  present: readonly string[];
  /** Combien la routine peut encore en recevoir (50 au plus). */
  room: number;
}) {
  const exercises = useExercises();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(ALL);
  const [picked, setPicked] = useState<string[]>([]);
  const muscles = [...new Set(exercises.map((e) => e.muscle))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  const q = fold(query.trim());
  const shown = exercises
    .filter(
      (e) =>
        (muscle === ALL || e.muscle === muscle) &&
        (fold(e.name).includes(q) || fold(e.slug.replaceAll("-", " ")).includes(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const full = picked.length >= room;

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setPicked([]);
      setQuery("");
      setMuscle(ALL);
    }
  }

  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <Select value={muscle} onValueChange={setMuscle}>
            <SelectTrigger aria-label="Muscle" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value={ALL}>Tous les muscles</SelectItem>
                {muscles.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="min-h-0 [&_[data-slot=scroll-area-viewport]>div]:block!">
          {shown.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyTitle>Aucun exercice ne correspond</EmptyTitle>
                <EmptyDescription>Essayez un autre mot, ou tous les muscles.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {shown.map((e) => (
                <PickCard
                  key={e.slug}
                  exercise={e}
                  rank={picked.indexOf(e.slug) + 1}
                  present={present.includes(e.slug)}
                  disabled={full}
                  onToggle={() => toggle(e.slug)}
                />
              ))}
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
