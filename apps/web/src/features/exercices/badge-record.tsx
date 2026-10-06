import { formaterCharge } from "@better-lift/shared";
import { ArrowUpRight } from "lucide-react";
import { SYSTEME_UNITES } from "@/lib/unites";

// L'invariant D28 : l'action est un aplat, le record un contour — lime en texte
// sur fond teinté, flèche montante. Une seule implémentation, réutilisée partout
// où un record s'affiche, sinon la distinction par la forme dérive écran par écran.
export function BadgeRecord({ libelle }: { libelle: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent-line bg-accent-wash px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-accent-ink">
      <ArrowUpRight aria-hidden="true" className="size-3" />
      {libelle}
    </span>
  );
}

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités (D52). */
export function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return reps === null ? "—" : `${reps} reps`;
  return `${formaterCharge(chargeKg, SYSTEME_UNITES)} × ${reps ?? "—"}`;
}
