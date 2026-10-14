import { type ExerciceResume, GROUPES, type Groupe, LIBELLE_GROUPE } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { catalogOptions } from "@/features/exercises/queries";

/** Radix interdit la valeur vide dans un `Select` : « tous » a sa propre clé. */
const ALL = "tous";

type Choice = Pick<ExerciceResume, "slug" | "nom">;

/**
 * Choisir un ou plusieurs exercices à ajouter. Le catalogue est cherché pour de
 * bon — en français comme en anglais, sans accents — et filtrable par groupe.
 * Les cases s'additionnent, l'ajout se fait d'un coup, dans l'ordre des coches.
 * Il flotte, donc il se ferme : c'est un dialogue, pas un panneau.
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
  const [group, setGroup] = useState<Groupe | undefined>();
  // Une liste, pas un ensemble : l'ordre des coches devient l'ordre dans la routine.
  const [chosen, setChosen] = useState<Choice[]>([]);

  const catalog = useInfiniteQuery({
    ...catalogOptions({ q: q.trim() || undefined, groupe: group }),
    enabled: open,
  });
  const exercises = catalog.data?.pages.flatMap((p) => p.exercices) ?? [];

  const isChosen = (slug: string) => chosen.some((c) => c.slug === slug);
  const toggle = (ex: Choice) =>
    setChosen((c) =>
      c.some((x) => x.slug === ex.slug)
        ? c.filter((x) => x.slug !== ex.slug)
        : [...c, { slug: ex.slug, nom: ex.nom }],
    );

  // Fermer oublie la sélection et la recherche : la prochaine ouverture repart à zéro.
  const close = () => {
    setChosen([]);
    setQ("");
    setGroup(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex h-[80vh] flex-col gap-4 bg-secondary-background p-5 sm:max-w-4xl">
        <DialogTitle className="text-base">Ajouter des exercices</DialogTitle>
        <DialogDescription className="sr-only">
          Cherche dans le catalogue, en français ou en anglais, coche un ou plusieurs exercices,
          puis ajoute-les à la routine.
        </DialogDescription>
        {/* Trois filets, bord à bord : titre, recherche, liste, actions. */}
        <Separator className="-mx-5 w-auto!" />

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              type="search"
              aria-label="Rechercher un exercice"
              placeholder="développé, squat, bench press…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={group ?? ALL}
            onValueChange={(v) => setGroup(v === ALL ? undefined : (v as Groupe))}
          >
            <SelectTrigger aria-label="Groupe musculaire" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les groupes</SelectItem>
              {GROUPES.map((g) => (
                <SelectItem key={g} value={g}>
                  {LIBELLE_GROUPE[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator className="-mx-5 w-auto!" />

        {/* Bord à bord, comme les filets : la barre de défilement longe le bord du
            dialogue et le haut du filet ; la marge passe À L'INTÉRIEUR, pour que la
            liste défile jusqu'aux filets au lieu de s'arrêter avant. */}
        <ScrollArea className="-mx-5 -my-4 min-h-0 flex-1">
          <div className="py-4">
            {catalog.isPending ? (
              <p className="px-5 py-3 text-sm text-muted-foreground">Chargement…</p>
            ) : catalog.isError ? (
              <p className="px-5 py-3 text-sm text-destructive-ink">
                Le catalogue n'a pas pu être chargé.
              </p>
            ) : exercises.length === 0 ? (
              <p className="px-5 py-3 text-sm text-muted-foreground">
                Aucun exercice ne correspond.
              </p>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-2 px-5 sm:grid-cols-2">
                  {exercises.map((ex) => {
                    const checked = isChosen(ex.slug);
                    return (
                      <li key={ex.slug}>
                        {/* Toute la carte coche : un label autour de la case. */}
                        <label
                          htmlFor={`choix-${ex.slug}`}
                          className={`flex cursor-pointer items-center gap-3 rounded-base border-2 p-2.5 transition-colors ${
                            checked ? "border-border bg-main/20" : "border-border hover:bg-muted"
                          }`}
                        >
                          {ex.image ? (
                            <img
                              src={ex.image}
                              alt=""
                              width={48}
                              height={48}
                              loading="lazy"
                              decoding="async"
                              className="size-12 shrink-0 rounded-md bg-white object-contain"
                            />
                          ) : (
                            // Sans image, l'initiale — comme la capture de référence.
                            <span
                              aria-hidden="true"
                              className="grid size-12 shrink-0 place-items-center rounded-md bg-muted font-semibold text-muted-foreground"
                            >
                              {ex.nom.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {ex.nom}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
                            </span>
                          </span>
                          <Checkbox
                            id={`choix-${ex.slug}`}
                            checked={checked}
                            onCheckedChange={() => toggle(ex)}
                            aria-label={`Choisir ${ex.nom}`}
                            className="mr-1"
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {catalog.hasNextPage ? (
                  <div className="px-5 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => catalog.fetchNextPage()}
                      disabled={catalog.isFetchingNextPage}
                      className="w-full text-muted-foreground"
                    >
                      {catalog.isFetchingNextPage ? "Chargement…" : "Afficher plus"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
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
              className="font-semibold"
            >
              Ajouter{chosen.length > 0 ? ` (${chosen.length})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
