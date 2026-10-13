import { cleJour, formatJour, type StatsPeriode } from "@better-lift/shared";
import { cn } from "cn";
import { FUSEAU } from "@/lib/fuseau";
import { grilleAnnee } from "./calculs";
import { Carte } from "./carte";

// Des classes écrites en toutes lettres (Tailwind ne voit pas une classe calculée) :
// `primary` en opacités, une intensité (D192).
const NIVEAUX = [
  "bg-muted",
  "bg-primary/25",
  "bg-primary/50",
  "bg-primary/75",
  "bg-primary",
] as const;
const JOURS = ["L", "", "M", "", "V", "", "D"];
const COLONNES = { gridTemplateColumns: "repeat(52, minmax(0, 1fr))" };

/**
 * La régularité sur 12 mois (D138) : la période choisie en clair, le reste
 * atténué. Un jour entraîné s'ouvre d'un clic sur sa première séance.
 */
export function Calendrier({
  annee,
  debutPeriode,
  finPeriode,
  onOuvrir,
}: {
  annee: StatsPeriode;
  debutPeriode: string;
  finPeriode?: string;
  onOuvrir: (seanceId: string) => void;
}) {
  const aujourdhui = cleJour(new Date().toISOString(), FUSEAU);
  const { colonnes, mois } = grilleAnnee(
    annee.jours,
    annee.premierLundi,
    debutPeriode,
    aujourdhui,
    finPeriode,
  );
  const entraines = colonnes.flat().filter((c) => c.dansPeriode && c.niveau > 0).length;

  return (
    <Carte
      titre="Régularité · 12 mois"
      detail={`${entraines} ${entraines > 1 ? "jours entraînés" : "jour entraîné"} sur la période`}
      className="lg:col-span-12"
    >
      <div className="grid grid-cols-[16px_1fr] gap-x-2 gap-y-1.5">
        <span />
        <div className="grid text-[11px] text-muted-foreground" style={COLONNES}>
          {mois.map((m) => (
            <span key={m.colonne} style={{ gridColumnStart: m.colonne + 1 }}>
              {m.libelle}
            </span>
          ))}
        </div>
        <div className="grid grid-rows-7 gap-[3px] text-[10px] text-muted-foreground">
          {JOURS.map((j, i) => (
            <span key={i} className="flex items-center">
              {j}
            </span>
          ))}
        </div>
        <div
          className="grid grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridAutoColumns: "minmax(0, 1fr)" }}
        >
          {colonnes.flat().map((c) => {
            const classes = cn(
              "aspect-square rounded-[3px]",
              NIVEAUX[c.niveau],
              !c.dansPeriode && "opacity-35",
              c.futur && "invisible",
              c.aujourdhui && "outline-[1.5px] outline-foreground outline-solid",
            );
            const libelle = `${formatJour(`${c.jour}T12:00:00Z`, "UTC")}${
              c.seances.length
                ? ` · ${c.seances.length} séance${c.seances.length > 1 ? "s" : ""}`
                : ""
            }`;
            const premiere = c.seances[0];
            return premiere ? (
              <button
                key={c.jour}
                type="button"
                title={libelle}
                aria-label={libelle}
                onClick={() => onOuvrir(premiere)}
                className={cn(
                  classes,
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
              />
            ) : (
              <span key={c.jour} title={libelle} className={classes} />
            );
          })}
        </div>
      </div>
      <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
        Moins
        {NIVEAUX.map((n) => (
          <span key={n} className={cn("size-[11px] rounded-[3px]", n)} />
        ))}
        Plus
      </p>
    </Carte>
  );
}
