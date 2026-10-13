import { formaterCharge } from "@better-lift/shared";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SYSTEME_UNITES } from "@/lib/unites";

// L'action est un aplat, le record un contour avec sa flèche montante (D28), dans
// le thème par défaut de shadcn (D192). Une seule implémentation, réutilisée partout
// où un record s'affiche, sinon la distinction par la forme dérive écran par écran.
export function BadgeRecord({ libelle }: { libelle: string }) {
  return (
    <Badge variant="outline" className="gap-1 font-semibold">
      <TrendingUp aria-hidden="true" />
      {libelle}
    </Badge>
  );
}

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités (D52). */
export function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return reps === null ? "—" : `${reps} reps`;
  return `${formaterCharge(chargeKg, SYSTEME_UNITES)} × ${reps ?? "—"}`;
}
