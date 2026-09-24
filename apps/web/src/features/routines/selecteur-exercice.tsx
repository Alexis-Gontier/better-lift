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
import { optionsCatalogue } from "@/features/exercices/requetes";

/** Radix interdit la valeur vide dans un `Select` : « tous » a sa propre clé. */
const TOUS = "tous";

type Choix = Pick<ExerciceResume, "slug" | "nom">;

/**
 * Choisir un ou plusieurs exercices à ajouter. Le catalogue est cherché pour de
 * bon — en français comme en anglais, sans accents — et filtrable par groupe.
 * Les cases s'additionnent, l'ajout se fait d'un coup, dans l'ordre des coches.
 * Il flotte, donc il se ferme : c'est un dialogue, pas un panneau.
 */
export function SelecteurExercice({
  ouvert,
  onFermer,
  onAjouter,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onAjouter: (exercices: Choix[]) => void;
}) {
  const [q, setQ] = useState("");
  const [groupe, setGroupe] = useState<Groupe | undefined>();
  // Une liste, pas un ensemble : l'ordre des coches devient l'ordre dans la routine.
  const [choisis, setChoisis] = useState<Choix[]>([]);

  const catalogue = useInfiniteQuery({
    ...optionsCatalogue({ q: q.trim() || undefined, groupe }),
    enabled: ouvert,
  });
  const exercices = catalogue.data?.pages.flatMap((p) => p.exercices) ?? [];

  const estChoisi = (slug: string) => choisis.some((c) => c.slug === slug);
  const basculer = (ex: Choix) =>
    setChoisis((c) =>
      c.some((x) => x.slug === ex.slug)
        ? c.filter((x) => x.slug !== ex.slug)
        : [...c, { slug: ex.slug, nom: ex.nom }],
    );

  // Fermer oublie la sélection et la recherche : la prochaine ouverture repart à zéro.
  const fermer = () => {
    setChoisis([]);
    setQ("");
    setGroupe(undefined);
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && fermer()}>
      <DialogContent className="flex h-[80vh] flex-col gap-4 bg-(--surface-1) p-5 sm:max-w-4xl">
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
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-(--ink-faint)"
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
            value={groupe ?? TOUS}
            onValueChange={(v) => setGroupe(v === TOUS ? undefined : (v as Groupe))}
          >
            <SelectTrigger aria-label="Groupe musculaire" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Tous les groupes</SelectItem>
              {GROUPES.map((g) => (
                <SelectItem key={g} value={g}>
                  {LIBELLE_GROUPE[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator className="-mx-5 w-auto!" />

        <ScrollArea className="-mx-1 min-h-0 flex-1">
          {catalogue.isPending ? (
            <p className="px-2 py-3 text-sm text-(--ink-faint)">Chargement…</p>
          ) : catalogue.isError ? (
            <p className="px-2 py-3 text-sm text-destructive-ink">
              Le catalogue n'a pas pu être chargé.
            </p>
          ) : exercices.length === 0 ? (
            <p className="px-2 py-3 text-sm text-(--ink-faint)">Aucun exercice ne correspond.</p>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-2 px-1 sm:grid-cols-2">
                {exercices.map((ex) => {
                  const coche = estChoisi(ex.slug);
                  return (
                    <li key={ex.slug}>
                      {/* Toute la carte coche : un label autour de la case. */}
                      <label
                        htmlFor={`choix-${ex.slug}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                          coche
                            ? "border-(--ink) bg-(--surface-2)"
                            : "border-(--line) hover:border-(--line-strong) hover:bg-(--surface-2)"
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
                            className="grid size-12 shrink-0 place-items-center rounded-md bg-(--surface-3) font-semibold text-(--ink-subtle)"
                          >
                            {ex.nom.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-(--ink)">
                            {ex.nom}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-(--ink-faint)">
                            {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
                          </span>
                        </span>
                        <Checkbox
                          id={`choix-${ex.slug}`}
                          checked={coche}
                          onCheckedChange={() => basculer(ex)}
                          aria-label={`Choisir ${ex.nom}`}
                          className="mr-1"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
              {catalogue.hasNextPage ? (
                <div className="px-1 pt-3">
                  <Button
                    variant="outline"
                    onClick={() => catalogue.fetchNextPage()}
                    disabled={catalogue.isFetchingNextPage}
                    className="w-full text-(--ink-subtle)"
                  >
                    {catalogue.isFetchingNextPage ? "Chargement…" : "Afficher plus"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </ScrollArea>

        <Separator className="-mx-5 w-auto!" />
        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-sm text-(--ink-subtle)">
            {choisis.length === 0
              ? "Coche un ou plusieurs exercices."
              : `${choisis.length} exercice${choisis.length > 1 ? "s" : ""} sélectionné${choisis.length > 1 ? "s" : ""}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fermer}>
              Annuler
            </Button>
            <Button
              disabled={choisis.length === 0}
              onClick={() => {
                onAjouter(choisis);
                fermer();
              }}
              className="font-semibold"
            >
              Ajouter{choisis.length > 0 ? ` (${choisis.length})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
