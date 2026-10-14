import { type ExerciceResume, GROUPES, type Groupe, LIBELLE_GROUPE } from "@better-lift/shared";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Radix interdit la valeur vide dans un `Select` : « tous » a sa propre clé. */
const ALL = "tous";

type Props = {
  exercises: ExerciceResume[];
  /** Le total côté serveur : la liste n'en porte que les pages déjà chargées. */
  total: number;
  hasMore: boolean;
  loadMore: boolean;
  onMore: () => void;
  q: string;
  group?: Groupe;
  selectedSlug?: string;
  onSearch: (v: string) => void;
  onGroup: (g: Groupe | undefined) => void;
  onSelect: (slug: string) => void;
};

export function ExerciseList({
  exercises,
  total,
  hasMore,
  loadMore,
  onMore,
  q,
  group,
  selectedSlug,
  onSearch,
  onGroup,
  onSelect,
}: Props) {
  return (
    <section aria-label="Exercices" className="flex h-full flex-col">
      {/* Le titre est dans l'en-tête commun (D157) ; ici, la recherche et le groupe (D160). */}
      <header className="flex flex-col gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Rechercher un exercice"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Rechercher un exercice…"
              className="h-8 pl-8"
            />
          </div>
          <Badge variant="outline" title={`${total} ${total > 1 ? "exercices" : "exercice"}`}>
            {total}
          </Badge>
        </div>
        <Select
          value={group ?? ALL}
          onValueChange={(v) => onGroup(v === ALL ? undefined : (v as Groupe))}
        >
          <SelectTrigger aria-label="Groupe musculaire" size="sm" className="w-full">
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
      </header>

      {/* Le cas vide est le plus facile à oublier, et le premier que l'on
          rencontre en tapant n'importe quoi dans la recherche. */}
      {exercises.length === 0 ? (
        <EmptyState
          title="Aucun exercice trouvé"
          message={
            q || group
              ? `Rien ne correspond${q ? ` à « ${q} »` : ""}. Essaie un autre terme, ou retire les filtres.`
              : "Le catalogue est vide pour l'instant."
          }
        />
      ) : (
        // Radix enveloppe le contenu dans un `display: table` : sans ce `block`, les
        // noms longs débordent au lieu de se couper.
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <ul className="flex flex-col">
            {exercises.map((ex) => (
              <li key={ex.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(ex.slug)}
                  aria-current={ex.slug === selectedSlug ? "true" : undefined}
                  ref={(el) => {
                    if (ex.slug === selectedSlug) el?.scrollIntoView({ block: "nearest" });
                  }}
                  className={`flex h-[60px] w-full items-center gap-3 border-b px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    // La sélection est une surface et un liseré d'encre, jamais le bleu d'action (D160).
                    ex.slug === selectedSlug
                      ? "bg-muted shadow-[inset_2px_0_0_var(--foreground)]"
                      : "hover:bg-secondary-background"
                  }`}
                >
                  {/* L'image FIXE de l'exercice (D46, jamais copiée) : ~6 Ko, là où le GIF
                      pèse cent fois plus et s'anime par centaines. Fond blanc : les
                      visuels du dataset sont dessinés sur blanc. `lazy` : seules les
                      lignes visibles la chargent. Sans image, une case garde l'alignement. */}
                  {ex.image ? (
                    <img
                      src={ex.image}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="size-10 shrink-0 rounded-[10px] bg-image-bg object-contain"
                    />
                  ) : (
                    <span aria-hidden="true" className="size-10 shrink-0 rounded-[10px] bg-muted" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{ex.nom}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                      {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {hasMore ? (
              <li className="px-2.5 py-3">
                <Button
                  variant="outline"
                  onClick={onMore}
                  disabled={loadMore}
                  className="w-full text-muted-foreground"
                >
                  {loadMore ? "Chargement…" : `Afficher plus — ${exercises.length} sur ${total}`}
                </Button>
              </li>
            ) : null}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
