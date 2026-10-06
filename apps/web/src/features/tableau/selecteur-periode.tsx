import { PERIODES, type Periode } from "@better-lift/shared";
import { cn } from "cn";

const LIBELLES: Record<Periode, string> = {
  semaine: "Semaine",
  mois: "Mois",
  trimestre: "3 mois",
  annee: "Année",
};

/** Le sélecteur qui pilote toute la page (D137). La période vit dans l'URL. */
export function SelecteurPeriode({
  periode,
  onChange,
}: {
  periode: Periode;
  onChange: (p: Periode) => void;
}) {
  return (
    <fieldset className="flex rounded-xl bg-(--canvas) p-[3px]">
      <legend className="sr-only">Période</legend>
      {PERIODES.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={p === periode}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold text-(--ink-subtle) outline-none hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
            p === periode && "bg-(--surface-3) text-(--ink)",
          )}
        >
          {LIBELLES[p]}
        </button>
      ))}
    </fieldset>
  );
}
