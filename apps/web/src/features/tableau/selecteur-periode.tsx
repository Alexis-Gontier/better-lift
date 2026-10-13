import { PERIODES, type Periode } from "@better-lift/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const LIBELLES: Record<Periode, string> = {
  semaine: "Semaine",
  mois: "Mois",
  trimestre: "3 mois",
  annee: "Année",
};

/**
 * Le sélecteur qui pilote toute la page (D137, D159), et ‹ › pour reculer d'une
 * période (D190). Période et décalage vivent dans l'URL.
 */
export function SelecteurPeriode({
  periode,
  decalage,
  intervalle,
  onChange,
  onDecaler,
}: {
  periode: Periode;
  decalage: number;
  intervalle: string | null;
  onChange: (p: Periode) => void;
  onDecaler: (decalage: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Période précédente"
          onClick={() => onDecaler(decalage + 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-36 text-center text-sm tabular-nums" aria-live="polite">
          {intervalle ?? "…"}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Période suivante"
          disabled={decalage === 0}
          onClick={() => onDecaler(decalage - 1)}
        >
          <ChevronRight />
        </Button>
      </div>
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
    </div>
  );
}
