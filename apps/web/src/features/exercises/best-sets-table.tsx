import { formaterCharge, type HistoriqueExercice, meilleuresParReps } from "@better-lift/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";
import { RecordBadge } from "./record-badge";

const kg = (v: number) => formaterCharge(v, UNIT_SYSTEM);
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/**
 * Les meilleures séries par reps (D203), depuis toujours : la période ne s'y applique pas.
 * « Réalisé » est un record, « Estimé » ce que le meilleur 1RM laisse viser.
 */
export function BestSetsTable({ history }: { history: HistoriqueExercice }) {
  const rows = meilleuresParReps(history);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meilleures séries par reps</CardTitle>
        <CardDescription>
          Depuis toujours. « Estimé » : ce que ton meilleur 1RM laisse viser (formule d'Epley).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reps</TableHead>
              <TableHead>Réalisé</TableHead>
              <TableHead>Estimé</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.reps}>
                <TableCell className="font-bold">{r.reps}</TableCell>
                <TableCell>
                  {r.realise ? (
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{kg(r.realise.chargeKg)}</span>
                      <RecordBadge label="record" />
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.estimeKg === null ? "—" : kg(r.estimeKg)}
                </TableCell>
                <TableCell className={r.realise ? "" : "text-muted-foreground"}>
                  {r.realise ? DATE.format(new Date(r.realise.date)) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
