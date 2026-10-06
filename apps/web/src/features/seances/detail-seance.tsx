import {
  ecartSerie,
  etiquettesSeries,
  formaterCharge,
  LIBELLE_RECORD,
  type SeanceDetail,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MoreHorizontal, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formaterSerie } from "@/features/exercices/badge-record";
import { BoutonFermer } from "@/features/routines/bouton-fermer";
import { ConfirmerSuppression } from "@/features/routines/confirmer-suppression";
import { dureeTexte } from "@/features/tableau/calculs";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { texteEcart } from "./calculs";
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
  const nbRecords = seance.exercices.reduce(
    (n, ex) => n + ex.series.filter((s) => s.records.length > 0).length,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-8 py-6">
          <header className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-[26px] font-extrabold tracking-tight">{seance.nom}</h2>
              <p className="text-[13px] text-(--ink-muted) first-letter:uppercase">
                {JOUR.format(new Date(seance.debut))} · {heure(seance.debut)} → {heure(seance.fin)}
              </p>
            </div>
            {seance.routineId ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/routines/$id" params={{ id: seance.routineId }}>
                  Ouvrir la routine
                </Link>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Plus d'actions"
                >
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
          </header>

          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            <Tuile titre="Durée">{dureeTexte(dureeMin(seance))}</Tuile>
            <Tuile titre="Volume">{formaterCharge(seance.volumeKg, SYSTEME_UNITES)}</Tuile>
            <Tuile titre="Séries">{seance.seriesFaites}</Tuile>
            <Tuile titre="Records">{nbRecords}</Tuile>
          </div>

          {/* La note de la séance (D130). */}
          {seance.note ? (
            <p className="whitespace-pre-line text-(--ink-muted) italic">« {seance.note} »</p>
          ) : null}

          {seance.exercices.map((ex, iE) => (
            <Exercice key={`${ex.slug}-${iE}`} exercice={ex} />
          ))}
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
    <div className="rounded-[14px] bg-(--surface-2) px-4 py-3">
      <p className="text-[11px] font-bold tracking-[0.09em] text-(--ink-subtle) uppercase">
        {titre}
      </p>
      <p className="chiffre mt-1 text-[30px]">{children}</p>
    </div>
  );
}

function Exercice({ exercice: ex }: { exercice: SeanceDetail["exercices"][number] }) {
  const etiquettes = etiquettesSeries(ex.series.map((s) => s.type));
  const faites = ex.series.filter((s) => s.faite).length;

  return (
    <section className="rounded-2xl bg-(--surface-2) px-4 py-3.5">
      <header className="mb-2 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-image-bg">
          {ex.image ? <img src={ex.image} alt="" className="size-full object-contain" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold">{ex.nom}</h3>
          <p className="text-[12.5px] text-(--ink-muted)">
            {faites} {faites > 1 ? "séries faites" : "série faite"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/exercices/$slug" params={{ slug: ex.slug }}>
            Fiche
          </Link>
        </Button>
      </header>
      {/* La note prise en séance (D90). */}
      {ex.note ? (
        <p className="mb-2 text-[13px] whitespace-pre-line text-(--ink-muted)">{ex.note}</p>
      ) : null}

      {/* Largeurs fixes : les colonnes s'alignent d'un exercice à l'autre. */}
      <table className="w-full table-fixed text-[13.5px] whitespace-nowrap">
        <thead>
          <tr className="text-left text-[11px] font-bold tracking-[0.08em] text-(--ink-subtle) uppercase">
            <th className="w-16 py-1.5 font-bold">Série</th>
            <th className="font-bold">Charge × reps</th>
            <th className="font-bold">La fois d'avant</th>
            <th className="font-bold">Écart</th>
            <th className="w-[30%] text-right font-bold">Record</th>
          </tr>
        </thead>
        <tbody>
          {ex.series.map((serie, i) => {
            const precedente = ex.precedentes[i];
            const ecart = serie.faite ? ecartSerie(serie, precedente) : null;
            return (
              <tr
                key={i}
                // Une série non faite reste visible — c'était prévu, pas fait — mais
                // s'efface derrière celles qui comptent.
                className={`border-t border-(--line) ${serie.faite ? "" : "opacity-45"}`}
              >
                <td className="py-2">
                  <span
                    className={`grid h-6 w-8 place-items-center rounded-[7px] bg-(--surface-3) text-xs font-bold ${
                      serie.type === "ECHAUFFEMENT" ? "text-(--ink-subtle)" : ""
                    }`}
                  >
                    {etiquettes[i]}
                  </span>
                </td>
                <td className={serie.records.length > 0 ? "font-bold" : ""}>
                  {formaterSerie(serie.chargeKg, serie.reps)}
                </td>
                <td className="text-(--ink-subtle)">
                  {precedente ? formaterSerie(precedente.chargeKg, precedente.reps) : "—"}
                </td>
                <td
                  className={
                    ecart &&
                    ecart.genre !== "egal" &&
                    (ecart.genre === "charge" ? ecart.deltaKg : ecart.delta) > 0
                      ? "font-bold"
                      : "text-(--ink-subtle)"
                  }
                >
                  {ecart ? texteEcart(ecart) : precedente ? "—" : "nouvelle"}
                </td>
                <td className="text-right">
                  {serie.records.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent-line bg-accent-wash px-2 py-0.5 text-[11px] font-bold text-accent-ink">
                      <ArrowUpRight aria-hidden="true" className="size-3" />
                      {serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
