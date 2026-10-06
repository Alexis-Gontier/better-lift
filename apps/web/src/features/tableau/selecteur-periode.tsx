import { PERIODES, type Periode } from "@better-lift/shared";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const LIBELLES: Record<Periode, string> = {
  semaine: "Semaine",
  mois: "Mois",
  trimestre: "3 mois",
  annee: "Année",
};

/** Le sélecteur qui pilote toute la page (D137, D159). La période vit dans l'URL. */
export function SelecteurPeriode({
  periode,
  onChange,
}: {
  periode: Periode;
  onChange: (p: Periode) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Période"
      value={periode}
      // Recliquer la période active la désélectionnerait : une valeur vide est ignorée.
      onValueChange={(v) => {
        if (v) onChange(v as Periode);
      }}
    >
      {PERIODES.map((p) => (
        <ToggleGroupItem key={p} value={p} className="px-3">
          {LIBELLES[p]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
