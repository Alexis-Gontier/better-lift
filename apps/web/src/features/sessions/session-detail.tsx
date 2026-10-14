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
import { InHeader } from "@/components/shell/page-header";
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
import { formatSet, RecordBadge } from "@/features/exercises/record-badge";
import { CloseButton } from "@/features/routines/close-button";
import { ConfirmDelete } from "@/features/routines/confirm-delete";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";
import { deltaText, durationText } from "./calculations";
import { durationMin } from "./session-list";

const DAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const HOUR = new Intl.DateTimeFormat("fr-FR", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});
const hour = (iso: string) => HOUR.format(new Date(iso)).replace(":", " h ");

/**
 * Le relevé comparé (D123, D140) : chaque série face à la même position de la
 * séance précédente de l'exercice — TOUTES ses séries, pas les seules faites.
 */
export function SessionDetail({
  session,
  onClose,
  onDelete,
}: {
  session: SeanceDetail;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const blocks = groupes(session.exercices);
  const recordCount = session.exercices.reduce(
    (n, ex) => n + ex.series.filter((s) => s.records.length > 0).length,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      {/* Les actions du détail montent dans l'en-tête commun (D157). */}
      <InHeader title={session.nom}>
        {session.routineId ? (
          <Button variant="outline" size="sm" asChild>
            <Link to="/routines/$id" params={{ id: session.routineId }}>
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
              onSelect={() => setConfirm(true)}
              className="text-destructive-ink focus:text-destructive-ink"
            >
              <Trash2 aria-hidden="true" className="text-destructive-ink" />
              Supprimer la séance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CloseButton onClose={onClose} />
      </InHeader>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-[13px] text-foreground first-letter:uppercase">
            {DAY.format(new Date(session.debut))} · {hour(session.debut)} → {hour(session.fin)}
          </p>

          {/* Les chiffres en tuiles jointives (D160) : une carte, des filets. */}
          <Card className="grid grid-cols-2 gap-0 divide-x py-0 xl:grid-cols-4">
            <Tile title="Durée">{durationText(durationMin(session))}</Tile>
            <Tile title="Volume">{formaterCharge(session.volumeKg, UNIT_SYSTEM)}</Tile>
            <Tile title="Séries">{session.seriesFaites}</Tile>
            <Tile title="Records">{recordCount}</Tile>
          </Card>

          {/* La note de la séance (D130). */}
          {session.note ? (
            <p className="whitespace-pre-line text-foreground italic">« {session.note} »</p>
          ) : null}

          {session.exercices.map((ex, iE) => {
            // Un superset fait en séance se relit d'un bloc (D153) : étiquette,
            // puis ses exercices derrière le filet. Lecture seule.
            const g = blocks.find((b) => b.debut <= iE && iE <= b.fin);
            if (!g) return <Exercise key={`${ex.slug}-${iE}`} exercise={ex} />;
            if (iE !== g.debut) return null;
            return (
              <div key={`superset-${ex.slug}-${iE}`}>
                <p className="mb-1.5 text-xs font-bold text-superset">Superset {g.lettre}</p>
                <div className="flex flex-col gap-3 border-l-[3px] border-superset pl-3">
                  {session.exercices.slice(g.debut, g.fin + 1).map((m, k) => (
                    <Exercise key={`${m.slug}-${g.debut + k}`} exercise={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <ConfirmDelete
        name={session.nom}
        description="La séance disparaît de l'historique, avec ses records. Ce n'est pas réversible."
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onDelete();
        }}
      />
    </div>
  );
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[13px] text-muted-foreground">{title}</p>
      <p className="chiffre mt-1 text-[30px]">{children}</p>
    </div>
  );
}

function Exercise({ exercise: ex }: { exercise: SeanceDetail["exercices"][number] }) {
  const labels = etiquettesSeries(ex.series.map((s) => s.type));
  const done = ex.series.filter((s) => s.faite).length;

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-image-bg">
          {ex.image ? <img src={ex.image} alt="" className="size-full object-contain" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold">{ex.nom}</h3>
          <p className="text-[12.5px] text-foreground">
            {done} {done > 1 ? "séries faites" : "série faite"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/exercises/$slug" params={{ slug: ex.slug }}>
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
            {ex.series.map((set, i) => {
              const previous = ex.precedentes[i];
              const delta = set.faite ? ecartSerie(set, previous) : null;
              return (
                <TableRow
                  key={i}
                  // Une série non faite reste visible — c'était prévu, pas fait — mais
                  // s'efface derrière celles qui comptent.
                  className={set.faite ? "hover:bg-transparent" : "opacity-45 hover:bg-transparent"}
                >
                  <TableCell className="px-0">
                    <span
                      className={`grid h-6 w-8 place-items-center rounded-[7px] bg-muted text-xs font-bold ${
                        set.type === "ECHAUFFEMENT" ? "text-muted-foreground" : ""
                      }`}
                    >
                      {labels[i]}
                    </span>
                  </TableCell>
                  <TableCell className={set.records.length > 0 ? "font-bold" : ""}>
                    {formatSet(set.chargeKg, set.reps)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {previous ? formatSet(previous.chargeKg, previous.reps) : "—"}
                  </TableCell>
                  <TableCell
                    className={
                      delta &&
                      delta.genre !== "egal" &&
                      (delta.genre === "charge" ? delta.deltaKg : delta.delta) > 0
                        ? "font-bold"
                        : "text-muted-foreground"
                    }
                  >
                    {delta ? deltaText(delta) : previous ? "—" : "nouvelle"}
                  </TableCell>
                  <TableCell className="px-0 text-right">
                    {set.records.length > 0 ? (
                      <RecordBadge label={set.records.map((r) => LIBELLE_RECORD[r]).join(" · ")} />
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
