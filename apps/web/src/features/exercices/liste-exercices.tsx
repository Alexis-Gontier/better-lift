import { type ExerciceResume, GROUPES, type Groupe, LIBELLE_GROUPE } from "@better-lift/shared";
import { Search } from "lucide-react";
import { EtatVide } from "@/components/etats/etat-vide";
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
      <header className="flex flex-col gap-2.5 px-5 pt-6 pb-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-tight">Exercices</h2>
          <p className="text-[13px] text-(--ink-muted)">
            {total} {total > 1 ? "exercices" : "exercice"}
          </p>
        </div>
        <div className="relative">
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
            className="rounded-[10px] pl-8"
          />
        </div>
        <Select
          value={groupe ?? TOUS}
          onValueChange={(v) => onGroupe(v === TOUS ? undefined : (v as Groupe))}
        >
          <SelectTrigger aria-label="Groupe musculaire" className="w-full rounded-[10px]">
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
        // Radix enveloppe le contenu dans un `display: table` : sans ce `block`, les
        // noms longs débordent au lieu de se couper.
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <ul className="flex flex-col gap-0.5 px-2.5">
            {exercices.map((ex) => (
              <li key={ex.slug}>
                <button
                  type="button"
                  onClick={() => onSelection(ex.slug)}
                  aria-current={ex.slug === slugSelectionne ? "true" : undefined}
                  ref={(el) => {
                    if (ex.slug === slugSelectionne) el?.scrollIntoView({ block: "nearest" });
                  }}
                  className={`flex h-[60px] w-full items-center gap-3 rounded-xl px-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) ${
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
                      className="size-10 shrink-0 rounded-[10px] bg-image-bg object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-10 shrink-0 rounded-[10px] bg-(--surface-2)"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-(--ink)">{ex.nom}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-(--ink-subtle)">
                      {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {aSuite ? (
              <li className="px-2.5 py-3">
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
