import {
  type ExerciceFait,
  type ExerciceResume,
  filtrerCatalogue,
  GROUPES,
  type Groupe,
  LIBELLE_GROUPE,
} from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { DragScroll } from "@/components/drag-scroll";
import { ExerciseThumb } from "@/components/exercise-media";
import { listCardClass, listLinkProps } from "@/components/list-detail";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
import { catalogueQuery, EQUIPEMENTS } from "@/lib/catalogue";
import { faitsQuery } from "@/lib/exercices";
import { formatKg, formatShortDay } from "@/lib/format";
import { jourCivil } from "@/lib/locale";

const TOUS = "tous";
type Tri = "nom" | "recent";

type Ligne = ExerciceResume & Partial<Pick<ExerciceFait, "derniereFois" | "meilleur1Rm">>;

/**
 * Le catalogue (D312) : par nom, il se lit page par page, recherche et filtres côté serveur, et
 * chaque ligne reçoit ses chiffres des exercices faits ; « Faits récemment » ne liste que ceux-là,
 * filtrés sur place.
 */
export function ExerciseList() {
  const force = useEtat();
  const [saisie, setSaisie] = useState("");
  const q = useDebounce(saisie);
  const [groupe, setGroupe] = useState<Groupe | typeof TOUS>(TOUS);
  const [equipement, setEquipement] = useState<string>(TOUS);
  const [tri, setTri] = useState<Tri>("nom");

  const filtres = {
    q,
    ...(groupe !== TOUS && { groupe }),
    ...(equipement !== TOUS && { equipement }),
  };
  const catalogue = useInfiniteQuery({ ...catalogueQuery(filtres), enabled: tri === "nom" });
  const faits = useQuery(faitsQuery());
  const parSlug = new Map((faits.data ?? []).map((f) => [f.slug, f]));

  const lignes: Ligne[] =
    tri === "nom"
      ? (catalogue.data?.pages.flatMap((p) => p.exercices) ?? []).map((e) => ({
          ...e,
          ...parSlug.get(e.slug),
        }))
      : filtrerCatalogue(faits.data ?? [], q).filter(
          (e) =>
            (groupe === TOUS || e.groupe === groupe) &&
            (equipement === TOUS || e.equipement === equipement),
        );

  const requete = tri === "nom" ? catalogue : faits;
  const sansFiltre = q.trim() === "" && groupe === TOUS && equipement === TOUS;
  const etat = etatAffiche(force, requete, sansFiltre && lignes.length === 0);
  if (etat === "chargement") return <ExerciseListSkeleton />;
  if (etat === "erreur")
    return (
      <StateError
        title="Les exercices n'ont pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );
  if (etat === "vide") return <ExerciseListEmpty recents={tri === "recent"} />;

  return (
    <>
      <div className="flex flex-col gap-2">
        <InputGroup>
          <InputGroupInput
            placeholder="Rechercher un exercice…"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <DragScroll>
          <div className="flex w-max gap-2">
            <Select value={groupe} onValueChange={(v) => setGroupe(v as Groupe | typeof TOUS)}>
              <SelectTrigger aria-label="Muscle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <Select value={equipement} onValueChange={setEquipement}>
              <SelectTrigger aria-label="Équipement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={TOUS}>Tout équipement</SelectItem>
                  {EQUIPEMENTS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={tri} onValueChange={(v) => setTri(v as Tri)}>
              <SelectTrigger aria-label="Tri">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="nom">Par nom</SelectItem>
                  <SelectItem value="recent">Faits récemment</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </DragScroll>
      </div>

      {lignes.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucun exercice ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot, muscle ou équipement.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        // Une carte par exercice, séparées (D258, comme les routines).
        <div className="flex flex-col gap-2">
          {lignes.map((e) => (
            <ExerciseRow key={e.slug} ligne={e} />
          ))}
          {tri === "nom" && catalogue.hasNextPage && (
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
    </>
  );
}

function ExerciseRow({ ligne: e }: { ligne: Ligne }) {
  return (
    <Card size="sm" className={listCardClass}>
      <Link
        to="/exercises/$slug"
        params={{ slug: e.slug }}
        {...listLinkProps}
        className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3"
      >
        <ExerciseThumb name={e.nom} src={e.image} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium" title={e.nom}>
            {e.nom}
          </span>
          <span className="truncate text-muted-foreground text-xs">
            {LIBELLE_GROUPE[e.groupe]} · {e.equipement}
          </span>
        </div>
        <div className="hidden w-28 shrink-0 flex-col items-end @xl:flex">
          <span className="text-sm tabular-nums">
            {e.meilleur1Rm ? formatKg(Math.round(e.meilleur1Rm)) : "—"}
          </span>
          <span className="text-muted-foreground text-xs">1RM estimé</span>
        </div>
        <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs @2xl:block">
          {e.derniereFois ? formatShortDay(jourCivil(e.derniereFois)) : "Jamais fait"}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </Card>
  );
}

/** La liste pendant le chargement : la recherche, les filtres, puis des cartes d'exercice. */
function ExerciseListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-17 rounded-xl" />
        ))}
      </div>
    </>
  );
}

/** Le catalogue vide (`?etat=vide`), ou aucun exercice fait pour « Faits récemment ». */
function ExerciseListEmpty({ recents }: { recents: boolean }) {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
      {recents
        ? "Aucun exercice fait pour l'instant : ils apparaîtront après la première séance."
        : "Le catalogue est vide pour l'instant."}
    </p>
  );
}
