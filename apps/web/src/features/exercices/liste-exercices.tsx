import { type ExerciceResume, GROUPES, type Groupe, LIBELLE_GROUPE } from "@better-lift/shared";
import { Search } from "lucide-react";
import { EtatVide } from "@/components/etats/etat-vide";
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
const TOUS = "tous";

type Props = {
  exercices: ExerciceResume[];
  /** Le total côté serveur : la liste n'en porte que les pages déjà chargées. */
  total: number;
  aSuite: boolean;
  chargeSuite: boolean;
  onSuite: () => void;
  q: string;
  groupe?: Groupe;
  slugSelectionne?: string;
  onRecherche: (v: string) => void;
  onGroupe: (g: Groupe | undefined) => void;
  onSelection: (slug: string) => void;
};

export function ListeExercices({
  exercices,
  total,
  aSuite,
  chargeSuite,
  onSuite,
  q,
  groupe,
  slugSelectionne,
  onRecherche,
  onGroupe,
  onSelection,
}: Props) {
  return (
    <section aria-label="Exercices" className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-(--line) px-4 py-3">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-(--ink-faint)"
          />
          <Input
            type="search"
            aria-label="Rechercher un exercice"
            value={q}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher un exercice…"
            className="pl-8"
          />
        </div>
        <Select
          value={groupe ?? TOUS}
          onValueChange={(v) => onGroupe(v === TOUS ? undefined : (v as Groupe))}
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
        <span className="w-12 text-right font-mono text-xs text-(--ink-subtle)" title="Résultats">
          {total}
        </span>
      </header>

      {/* Le cas vide est le plus facile à oublier, et le premier que l'on
          rencontre en tapant n'importe quoi dans la recherche. */}
      {exercices.length === 0 ? (
        <EtatVide
          titre="Aucun exercice trouvé"
          message={
            q || groupe
              ? `Rien ne correspond${q ? ` à « ${q} »` : ""}. Essaie un autre terme, ou retire les filtres.`
              : "Le catalogue est vide pour l'instant."
          }
        />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul>
            {exercices.map((ex) => (
              <li key={ex.slug}>
                <button
                  type="button"
                  onClick={() => onSelection(ex.slug)}
                  aria-current={ex.slug === slugSelectionne ? "true" : undefined}
                  className={`flex h-[60px] w-full items-center gap-3 border-b border-(--line) px-4 text-left ${
                    ex.slug === slugSelectionne ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
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
                      className="size-10 shrink-0 rounded-md bg-white object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-10 shrink-0 rounded-md bg-(--surface-2)"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-(--ink)">{ex.nom}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-(--ink-faint)">
                      {ex.equipement}
                    </span>
                  </span>
                  <Badge variant="outline" className="shrink-0 font-normal text-(--ink-subtle)">
                    {LIBELLE_GROUPE[ex.groupe]}
                  </Badge>
                </button>
              </li>
            ))}
            {aSuite ? (
              <li className="px-4 py-3">
                <Button
                  variant="outline"
                  onClick={onSuite}
                  disabled={chargeSuite}
                  className="w-full text-(--ink-subtle)"
                >
                  {chargeSuite ? "Chargement…" : `Afficher plus — ${exercices.length} sur ${total}`}
                </Button>
              </li>
            ) : null}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
