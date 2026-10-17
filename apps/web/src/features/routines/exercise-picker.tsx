import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { mockExercises } from "@/mocks/exercises";
import type { MockRoutineExercise } from "@/mocks/routines";

/** Un exercice tout juste ajouté : une série de 10, charge à noter, 1 min 30 de repos. */
export function newRoutineExercise(slug: string): MockRoutineExercise {
  return { slug, sets: [{ kg: null, reps: 10 }], restSeconds: 90 };
}

/** La recherche dans le catalogue pour ajouter un exercice à une routine. */
export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (slug: string) => void;
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ajouter un exercice"
      description="Rechercher dans le catalogue"
    >
      {/* Le `CommandDialog` de Nova n'enveloppe pas `<Command>` : on le pose soi-même. */}
      <Command>
        <CommandInput placeholder="Rechercher un exercice…" />
        <CommandList>
          <CommandEmpty>Aucun exercice.</CommandEmpty>
          <CommandGroup heading="Catalogue">
            {mockExercises.map((ex) => (
              <CommandItem
                key={ex.slug}
                value={`${ex.name} ${ex.muscle}`}
                onSelect={() => {
                  onPick(ex.slug);
                  onOpenChange(false);
                }}
              >
                {ex.name}
                <span className="ml-auto text-muted-foreground text-xs">{ex.muscle}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
