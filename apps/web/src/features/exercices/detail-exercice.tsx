import {
  courbeUnRm,
  type ExerciceDetail,
  formaterCharge,
  formatJour,
  type HistoriqueExercice,
  LIBELLE_GROUPE,
  LIBELLE_RECORD,
  type RecordExercice,
} from "@better-lift/shared";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BoutonFermer } from "@/features/routines/bouton-fermer";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { AnimationExercice } from "./animation-exercice";
import { BadgeRecord, formaterSerie } from "./badge-record";
import { courbe } from "./calculs";

const kg = (v: number) => formaterCharge(v, SYSTEME_UNITES);
const DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: FUSEAU,
});

/**
 * La fiche d'un exercice (D141) : une page qui défile — l'exercice, sa
 * progression (1RM estimé et sa courbe), ses records, son historique, ses
 * consignes. `undefined` : en chargement ; `null` : en échec.
 */
export function DetailExercice({
  exercice,
  records,
  historique,
  onFermer,
}: {
  exercice: ExerciceDetail;
  records: RecordExercice[] | null | undefined;
  historique: HistoriqueExercice | null | undefined;
  onFermer: () => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-5 px-8 py-6">
        <header className="flex items-start gap-5">
          <AnimationExercice
            key={exercice.gif ?? exercice.slug}
            gif={exercice.gif}
            nom={exercice.nom}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-extrabold tracking-tight">{exercice.nom}</h2>
            <p className="text-[13px] text-(--ink-subtle)">{exercice.nomAnglais}</p>
            <p className="mt-2 text-[13px] text-(--ink-muted)">
              {LIBELLE_GROUPE[exercice.groupe]} · {exercice.equipement}
            </p>
            <p className="mt-1 text-sm">
              {exercice.cible}
              {exercice.secondaires.length > 0 ? (
                <span className="text-(--ink-subtle)"> · {exercice.secondaires.join(", ")}</span>
              ) : null}
            </p>
          </div>
          <BoutonFermer onFermer={onFermer} />
        </header>

        {historique === undefined ? (
          <Bloc titre="1RM estimé">
            <p className="text-sm text-(--ink-subtle)">Chargement…</p>
          </Bloc>
        ) : historique === null ? (
          <Bloc titre="1RM estimé">
            <p className="text-sm text-(--ink-subtle)">La progression n'a pas pu être chargée.</p>
          </Bloc>
        ) : (
          <Progression historique={historique} />
        )}

        <Records records={records} />
        {historique && historique.length > 0 ? <Historique historique={historique} /> : null}

        {exercice.instructions.length > 0 ? (
          <Bloc titre="Exécution">
            <ol className="flex flex-col gap-2">
              {exercice.instructions.map((etape, i) => (
                <li key={etape} className="flex gap-3 text-sm leading-relaxed">
                  <span className="w-4 shrink-0 text-right font-bold text-(--ink-subtle)">
                    {i + 1}
                  </span>
                  <span>{etape}</span>
                </li>
              ))}
            </ol>
          </Bloc>
        ) : null}
      </div>
    </ScrollArea>
  );
}

function Bloc({
  titre,
  detail,
  children,
}: {
  titre: string;
  detail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-(--surface-2) p-5">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="text-[11px] font-bold tracking-[0.09em] text-(--ink-subtle) uppercase">
          {titre}
        </h3>
        {detail ? <p className="text-xs text-(--ink-muted)">{detail}</p> : null}
      </header>
      {children}
    </section>
  );
}

// Le cadre du dessin : le SVG s'étire en largeur, ses traits gardent leur épaisseur.
const LARGEUR = 600;
const HAUTEUR = 160;

/** Le 1RM estimé et sa courbe, séance par séance (D141). Le dernier point en lime s'il est record. */
function Progression({ historique }: { historique: HistoriqueExercice }) {
  const points = courbeUnRm(historique);
  const c = courbe(points, LARGEUR, HAUTEUR);
  const dernier = points.at(-1);
  const premier = points[0];

  if (!c || !dernier || !premier) {
    return (
      <Bloc titre="1RM estimé">
        <p className="text-sm text-(--ink-subtle)">
          Pas encore de série avec charge : la courbe apparaîtra après ta première séance.
        </p>
      </Bloc>
    );
  }
  const fin = c.xy.at(-1);

  return (
    <Bloc
      titre="1RM estimé"
      detail={`${points.length} ${points.length > 1 ? "séances" : "séance"}`}
    >
      <div className="flex items-baseline gap-3">
        <p className="chiffre text-[44px]">{kg(dernier.valeur)}</p>
        {points.length > 1 ? (
          <p className="text-[13px] text-(--ink-muted)">
            {c.ecartKg === 0
              ? "stable depuis le début"
              : `${c.ecartKg > 0 ? "↗ +" : "↘ −"}${kg(Math.abs(c.ecartKg))} depuis le ${formatJour(premier.date, FUSEAU)}`}
          </p>
        ) : null}
      </div>
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label={`Courbe du 1RM estimé sur ${points.length} séances, de ${kg(premier.valeur)} à ${kg(dernier.valeur)}`}
      >
        <line
          x1="0"
          x2={LARGEUR}
          y1={HAUTEUR / 2}
          y2={HAUTEUR / 2}
          stroke="var(--line)"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={c.xy.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--ink-muted)"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {c.xy.map((p, i) => (
          <circle
            // Deux séances peuvent commencer au même instant : la position fait la clé.
            key={i}
            cx={p.x}
            cy={p.y}
            r={p === fin ? 5 : 3}
            fill={p === fin && c.record ? "var(--accent)" : "var(--ink-muted)"}
            vectorEffect="non-scaling-stroke"
          >
            <title>{`${formatJour(points[i]?.date ?? "", FUSEAU)} : ${kg(points[i]?.valeur ?? 0)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between text-[11px] text-(--ink-subtle)">
        <span>{DATE_COURTE.format(new Date(premier.date))}</span>
        <span>
          min {kg(c.min)} · max {kg(c.max)}
        </span>
        <span>{DATE_COURTE.format(new Date(dernier.date))}</span>
      </div>
    </Bloc>
  );
}

function Records({ records }: { records: RecordExercice[] | null | undefined }) {
  return (
    <Bloc titre="Records">
      {records === undefined ? (
        <p className="text-sm text-(--ink-subtle)">Chargement…</p>
      ) : records === null ? (
        <p className="text-sm text-(--ink-subtle)">Les records n'ont pas pu être chargés.</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-(--ink-subtle)">Aucun record pour l'instant.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {records.map((r) => (
            <li key={r.type} className="rounded-[14px] bg-(--surface-1) px-4 py-3">
              {/* Le record est un CONTOUR (D28) : lime en texte sur fond teinté. */}
              <BadgeRecord libelle={LIBELLE_RECORD[r.type]} />
              <p className="chiffre mt-2 text-[26px]">
                {/* 1RM et volume sont DÉRIVÉS : la valeur, puis la série qui l'a donnée. */}
                {r.type === "UN_RM" || r.type === "VOLUME"
                  ? kg(r.valeur)
                  : formaterSerie(r.chargeKg, r.reps)}
              </p>
              <p className="mt-1 text-xs text-(--ink-subtle)">
                {r.type === "UN_RM" || r.type === "VOLUME"
                  ? `${formaterSerie(r.chargeKg, r.reps)} · `
                  : ""}
                {formatJour(r.date, FUSEAU)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Bloc>
  );
}

/** Chaque séance de l'exercice : ses séries faites, et le meilleur 1RM qu'elles donnent. */
function Historique({ historique }: { historique: HistoriqueExercice }) {
  return (
    <Bloc
      titre="Historique"
      detail={`${historique.length} ${historique.length > 1 ? "séances" : "séance"}`}
    >
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="text-left text-[11px] font-bold tracking-[0.08em] text-(--ink-subtle) uppercase">
            <th className="w-32 py-1.5 font-bold">Date</th>
            <th className="font-bold">Séance</th>
            <th className="font-bold">Séries faites</th>
            <th className="text-right font-bold">1RM estimé</th>
          </tr>
        </thead>
        <tbody>
          {historique.map((s) => {
            const unRm = courbeUnRm([s])[0]?.valeur;
            const faites = s.series.filter((x) => x.faite && x.type !== "ECHAUFFEMENT");
            return (
              <tr key={s.id} className="border-t border-(--line) align-top">
                <td className="py-2.5 whitespace-nowrap text-(--ink-muted)">
                  {DATE_COURTE.format(new Date(s.debut))}
                </td>
                <td className="py-2.5">
                  <Link
                    to="/seances/$id"
                    params={{ id: s.id }}
                    className="font-semibold hover:underline hover:underline-offset-4"
                  >
                    {s.nom}
                  </Link>
                </td>
                <td className="py-2.5 text-(--ink-muted)">
                  {faites.length > 0
                    ? faites.map((x) => formaterSerie(x.chargeKg, x.reps)).join(" · ")
                    : "—"}
                </td>
                <td className="py-2.5 text-right whitespace-nowrap">{unRm ? kg(unRm) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Bloc>
  );
}
