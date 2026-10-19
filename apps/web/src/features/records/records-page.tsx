import {
  type ExerciceFait,
  normaliserRecherche,
  type RecordExercice,
  type TypeRecord,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Trophy } from "lucide-react";
import { useState } from "react";
import { ExerciseThumb } from "@/components/exercise-media";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { faitsQuery } from "@/lib/exercices";
import { formatKg, formatLoad, formatShortDay } from "@/lib/format";
import { jourCivil } from "@/lib/locale";

/** Les colonnes, dans l'ordre des records de `shared` ; chacune dit comment lire sa valeur. */
const COLONNES: { type: TypeRecord; titre: string; valeur: (r: RecordExercice) => string }[] = [
  { type: "CHARGE", titre: "Charge max", valeur: (r) => `${formatLoad(r.chargeKg)} × ${r.reps}` },
  { type: "UN_RM", titre: "1RM estimé", valeur: (r) => formatKg(Math.round(r.valeur)) },
  // Le meilleur volume est celui d'une série : « 80 kg × 5 » se lit mieux que « 400 kg ».
  {
    type: "VOLUME",
    titre: "Meilleure série",
    valeur: (r) => `${formatLoad(r.chargeKg)} × ${r.reps}`,
  },
  { type: "REPS", titre: "Répétitions", valeur: (r) => `${r.reps} rép.` },
];

/** Le dernier record battu sur un exercice : la page s'ouvre sur ce qui vient de bouger. */
const dernierRecord = (e: ExerciceFait) =>
  e.records.reduce((d, r) => (r.date > d ? r.date : d), "");

/**
 * Les records (D314) : une ligne par exercice fait, ses records actuels, chacun daté de la séance
 * qui l'a établi. Le dernier battu d'abord ; une ligne mène à la fiche. Tout vient des exercices
 * faits (D312), dérivés à la lecture (D65).
 */
export function RecordsPage() {
  const force = useEtat();
  const requete = useQuery(faitsQuery());
  const [saisie, setSaisie] = useState("");

  const exercices = (requete.data ?? [])
    .filter((e) => e.records.length > 0)
    .sort((a, b) => dernierRecord(b).localeCompare(dernierRecord(a)));
  const etat = etatAffiche(force, requete, exercices.length === 0);
  if (etat === "chargement") return <RecordsSkeleton />;
  if (etat === "erreur")
    return (
      <StateError
        title="Les records n'ont pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );
  if (etat === "vide") return <RecordsEmpty />;

  // Une colonne sans aucune valeur s'efface : « Répétitions » n'a de sens qu'au poids du corps.
  const colonnes = COLONNES.filter((c) =>
    exercices.some((e) => e.records.some((r) => r.type === c.type)),
  );
  const q = normaliserRecherche(saisie);
  const visibles = exercices.filter((e) => !q || normaliserRecherche(e.recherche).includes(q));

  return (
    <>
      <InputGroup className="max-w-sm">
        <InputGroupInput
          placeholder="Rechercher un exercice…"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <Card size="sm" className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Exercice</TableHead>
              {colonnes.map((c) => (
                <TableHead key={c.type}>{c.titre}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={colonnes.length + 1} className="py-6 text-center">
                  <span className="text-muted-foreground">Aucun exercice ne correspond.</span>
                </TableCell>
              </TableRow>
            )}
            {visibles.map((e) => (
              <TableRow key={e.slug}>
                <TableCell className="pl-4">
                  <Link
                    to="/exercises/$slug"
                    params={{ slug: e.slug }}
                    className="flex max-w-72 items-center gap-3 font-medium hover:underline"
                  >
                    <ExerciseThumb name={e.nom} src={e.image} className="hidden size-8 sm:flex" />
                    <span className="truncate" title={e.nom}>
                      {e.nom}
                    </span>
                  </Link>
                </TableCell>
                {colonnes.map((c) => {
                  const r = e.records.find((x) => x.type === c.type);
                  return (
                    <TableCell key={c.type} className="tabular-nums">
                      {r ? (
                        <span className="flex flex-col">
                          <span>{c.valeur(r)}</span>
                          <span className="text-muted-foreground text-xs">
                            {formatShortDay(jourCivil(r.date))}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/** Pendant le chargement : la recherche, puis le tableau à sa forme réelle. */
function RecordsSkeleton() {
  return (
    <>
      <Skeleton className="h-9 max-w-sm rounded-lg" />
      <Card size="sm" className="gap-0 py-0">
        <Skeleton className="m-3 h-5 w-2/3 rounded" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-t px-4 py-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        ))}
      </Card>
    </>
  );
}

/** Aucun record : d'où ils viennent. */
function RecordsEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Trophy />
        </EmptyMedia>
        <EmptyTitle>Pas encore de record</EmptyTitle>
        <EmptyDescription>
          Ils naissent avec les séances faites sur le téléphone : charge max, 1RM estimé, meilleure
          série, et répétitions au poids du corps.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
