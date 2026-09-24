import { formaterCharge } from "@better-lift/shared";
import { ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SYSTEME_UNITES } from "@/lib/unites";

// L'invariant D28 : l'action est un aplat, le record un contour — lime en texte
// sur fond teinté, flèche montante. Une seule implémentation, réutilisée partout
// où un record s'affiche, sinon la distinction par la forme dérive écran par écran.
export function BadgeRecord({ libelle }: { libelle: string }) {
  return (
    <Badge className="gap-1 rounded border-transparent bg-(--accent-wash) px-1.5 font-mono text-[11.5px] font-normal text-accent-ink">
      <ArrowUp aria-hidden="true" strokeWidth={2.4} />
      {libelle}
    </Badge>
  );
}

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités (D52). */
export function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return reps === null ? "—" : `${reps} reps`;
  return `${formaterCharge(chargeKg, SYSTEME_UNITES)} × ${reps ?? "—"}`;
}
