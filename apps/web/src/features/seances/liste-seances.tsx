import { formaterCharge, type SeanceFil } from "@better-lift/shared";
import { cn } from "cn";
import { EtatVide } from "@/components/etats/etat-vide";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BadgeRecord } from "@/features/exercices/badge-record";
import { dureeTexte } from "@/features/tableau/calculs";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { grouperParMois } from "./calculs";

type Props = {
  seances: SeanceFil[];
  total: number;
  aSuite: boolean;
  chargeSuite: boolean;
  onSuite: () => void;
  idSelectionne?: string;
  onSelection: (id: string) => void;
};

/** La durée en minutes, arrondie : on lit « 62 min », pas « 61,7 ». */
export const dureeMin = (s: Pick<SeanceFil, "debut" | "fin">) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60000);

const JOUR = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: FUSEAU,
});

/** Le fil des séances (D140) : groupé par mois, chaque entrée se relit sans l'ouvrir. */
export function ListeSeances({
  seances,
  total,
  aSuite,
  chargeSuite,
  onSuite,
  idSelectionne,
  onSelection,
}: Props) {
  return (
    <section aria-label="Séances" className="flex h-full flex-col">
      <header className="px-5 pt-6 pb-2">
        <h2 className="text-[22px] font-extrabold tracking-tight">Séances</h2>
        <p className="text-[13px] text-(--ink-muted)">
          {total} {total > 1 ? "séances" : "séance"}
        </p>
      </header>

      {seances.length === 0 ? (
        <EtatVide
          titre="Aucune séance"
          message="Ton historique se remplira au fil de tes entraînements, sur ton téléphone."
        />
      ) : (
        // Radix enveloppe le contenu dans un `display: table` qui s'élargit au lieu de
        // couper : sans ce `block`, les aperçus débordent sans points de suspension.
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          {grouperParMois(seances, FUSEAU).map((g) => (
            <div key={g.cle}>
              <h3 className="px-5 pt-4 pb-1.5 text-[11px] font-bold tracking-[0.09em] text-(--ink-subtle) uppercase">
                {g.libelle}
              </h3>
              <ul className="flex flex-col gap-1 px-2.5">
                {g.seances.map((s) => (
                  <li key={s.id}>
                    <Entree
                      seance={s}
                      active={s.id === idSelectionne}
                      onClick={() => onSelection(s.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {aSuite ? (
            <div className="px-5 py-4">
              <Button
                variant="outline"
                onClick={onSuite}
                disabled={chargeSuite}
                className="w-full text-(--ink-subtle)"
              >
                {chargeSuite ? "Chargement…" : `Afficher plus — ${seances.length} sur ${total}`}
              </Button>
            </div>
          ) : null}
        </ScrollArea>
      )}
    </section>
  );
}

function Entree({
  seance: s,
  active,
  onClick,
}: {
  seance: SeanceFil;
  active: boolean;
  onClick: () => void;
}) {
  const reste = s.nbExercices - s.apercu.length;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      // La séance ouverte reste visible au défilement par le clavier (↑ ↓).
      ref={(el) => {
        if (active) el?.scrollIntoView({ block: "nearest" });
      }}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
        active ? "bg-(--surface-3)" : "hover:bg-(--surface-2)",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate font-bold">{s.nom}</span>
        {s.nbRecords > 0 ? (
          <span title={`${s.nbRecords} ${s.nbRecords > 1 ? "records" : "record"}`}>
            <BadgeRecord libelle={String(s.nbRecords)} />
          </span>
        ) : null}
      </span>
      <span className="text-[12.5px] text-(--ink-muted)">
        {/* Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66). */}
        {JOUR.format(new Date(s.debut))} · {dureeTexte(dureeMin(s))} ·{" "}
        {formaterCharge(s.volumeKg, SYSTEME_UNITES)} · {s.seriesFaites}{" "}
        {s.seriesFaites > 1 ? "séries" : "série"}
      </span>
      {s.apercu.length > 0 ? (
        <span className="truncate text-[12.5px] text-(--ink-subtle)">
          {s.apercu.map((e) => e.nom).join(", ")}
          {reste > 0 ? ` + ${reste}` : ""}
        </span>
      ) : null}
    </button>
  );
}
