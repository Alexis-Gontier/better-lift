import {
  ecartSerie,
  etiquettesSeries,
  formaterCharge,
  groupes,
  LIBELLE_RECORD,
  type SeanceDetail,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { DansEnTete } from "@/components/shell/en-tete-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeRecord, formaterSerie } from "@/features/exercices/badge-record";
import { BoutonFermer } from "@/features/routines/bouton-fermer";
import { ConfirmerSuppression } from "@/features/routines/confirmer-suppression";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { dureeTexte, texteEcart } from "./calculs";
import { dureeMin } from "./liste-seances";

const JOUR = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: FUSEAU,
});
const HEURE = new Intl.DateTimeFormat("fr-FR", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: FUSEAU,
});
const heure = (iso: string) => HEURE.format(new Date(iso)).replace(":", " h ");

/**
 * Le relevé comparé (D123, D140) : chaque série face à la même position de la
 * séance précédente de l'exercice — TOUTES ses séries, pas les seules faites.
 */
export function DetailSeance({
  seance,
  onFermer,
  onSupprimer,
}: {
  seance: SeanceDetail;
  onFermer: () => void;
  onSupprimer: () => void;
}) {
  const [confirmer, setConfirmer] = useState(false);
  const blocs = groupes(seance.exercices);
  const nbRecords = seance.exercices.reduce(
    (n, ex) => n + ex.series.filter((s) => s.records.length > 0).length,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      {/* Les actions du détail montent dans l'en-tête commun (D157). */}
      <DansEnTete titre={seance.nom}>
        {seance.routineId ? (
          <Button variant="outline" size="sm" asChild>
            <Link to="/routines/$id" params={{ id: seance.routineId }}>
              Ouvrir la routine
            </Link>
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-8" aria-label="Plus d'actions">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => setConfirmer(true)}
              className="text-destructive-ink focus:text-destructive-ink"
            >
              <Trash2 aria-hidden="true" className="text-destructive-ink" />
              Supprimer la séance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BoutonFermer onFermer={onFermer} />
      </DansEnTete>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-[13px] text-foreground first-letter:uppercase">
            {JOUR.format(new Date(seance.debut))} · {heure(seance.debut)} → {heure(seance.fin)}
          </p>

          {/* Les chiffres en tuiles jointives (D160) : une carte, des filets. */}
          <Card className="grid grid-cols-2 gap-0 divide-x py-0 xl:grid-cols-4">
            <Tuile titre="Durée">{dureeTexte(dureeMin(seance))}</Tuile>
            <Tuile titre="Volume">{formaterCharge(seance.volumeKg, SYSTEME_UNITES)}</Tuile>
            <Tuile titre="Séries">{seance.seriesFaites}</Tuile>
            <Tuile titre="Records">{nbRecords}</Tuile>
          </Card>

          {/* La note de la séance (D130). */}
          {seance.note ? (
            <p className="whitespace-pre-line text-foreground italic">« {seance.note} »</p>
          ) : null}

          {seance.exercices.map((ex, iE) => {
            // Un superset fait en séance se relit d'un bloc (D153) : étiquette,
            // puis ses exercices derrière le filet. Lecture seule.
            const g = blocs.find((b) => b.debut <= iE && iE <= b.fin);
            if (!g) return <Exercice key={`${ex.slug}-${iE}`} exercice={ex} />;
            if (iE !== g.debut) return null;
            return (
              <div key={`superset-${ex.slug}-${iE}`}>
                <p className="mb-1.5 text-xs font-bold text-superset">Superset {g.lettre}</p>
                <div className="flex flex-col gap-3 border-l-[3px] border-superset pl-3">
                  {seance.exercices.slice(g.debut, g.fin + 1).map((m, k) => (
                    <Exercice key={`${m.slug}-${g.debut + k}`} exercice={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <ConfirmerSuppression
        nom={seance.nom}
        description="La séance disparaît de l'historique, avec ses records. Ce n'est pas réversible."
        ouvert={confirmer}
        onFermer={() => setConfirmer(false)}
        onConfirmer={() => {
          setConfirmer(false);
          onSupprimer();
        }}
      />
    </div>
  );
}

function Tuile({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[13px] text-muted-foreground">{titre}</p>
      <p className="chiffre mt-1 text-[30px]">{children}</p>
    </div>
  );
}

function Exercice({ exercice: ex }: { exercice: SeanceDetail["exercices"][number] }) {
  const etiquettes = etiquettesSeries(ex.series.map((s) => s.type));
  const faites = ex.series.filter((s) => s.faite).length;

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-image-bg">
          {ex.image ? <img src={ex.image} alt="" className="size-full object-contain" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold">{ex.nom}</h3>
          <p className="text-[12.5px] text-foreground">
            {faites} {faites > 1 ? "séries faites" : "série faite"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/exercices/$slug" params={{ slug: ex.slug }}>
            Fiche
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {/* La note prise en séance (D90). */}
        {ex.note ? (
          <p className="mb-2 text-[13px] whitespace-pre-line text-foreground">{ex.note}</p>
        ) : null}

        {/* Largeurs fixes : les colonnes s'alignent d'un exercice à l'autre. */}
        <Table className="table-fixed text-[13.5px]">
          <TableHeader>
            <TableRow className="text-xs hover:bg-transparent">
              <TableHead className="h-8 w-16 px-0 text-muted-foreground">Série</TableHead>
              <TableHead className="h-8 text-muted-foreground">Charge × reps</TableHead>
              <TableHead className="h-8 text-muted-foreground">La fois d'avant</TableHead>
              <TableHead className="h-8 text-muted-foreground">Écart</TableHead>
              <TableHead className="h-8 w-[30%] px-0 text-right text-muted-foreground">
                Record
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ex.series.map((serie, i) => {
              const precedente = ex.precedentes[i];
              const ecart = serie.faite ? ecartSerie(serie, precedente) : null;
              return (
                <TableRow
                  key={i}
                  // Une série non faite reste visible — c'était prévu, pas fait — mais
                  // s'efface derrière celles qui comptent.
                  className={
                    serie.faite ? "hover:bg-transparent" : "opacity-45 hover:bg-transparent"
                  }
                >
                  <TableCell className="px-0">
                    <span
                      className={`grid h-6 w-8 place-items-center rounded-[7px] bg-muted text-xs font-bold ${
                        serie.type === "ECHAUFFEMENT" ? "text-muted-foreground" : ""
                      }`}
                    >
                      {etiquettes[i]}
                    </span>
                  </TableCell>
                  <TableCell className={serie.records.length > 0 ? "font-bold" : ""}>
                    {formaterSerie(serie.chargeKg, serie.reps)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {precedente ? formaterSerie(precedente.chargeKg, precedente.reps) : "—"}
                  </TableCell>
                  <TableCell
                    className={
                      ecart &&
                      ecart.genre !== "egal" &&
                      (ecart.genre === "charge" ? ecart.deltaKg : ecart.delta) > 0
                        ? "font-bold"
                        : "text-muted-foreground"
                    }
                  >
                    {ecart ? texteEcart(ecart) : precedente ? "—" : "nouvelle"}
                  </TableCell>
                  <TableCell className="px-0 text-right">
                    {serie.records.length > 0 ? (
                      <BadgeRecord
                        libelle={serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
