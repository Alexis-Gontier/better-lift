import { formaterCharge } from "@better-lift/shared";
import { SYSTEME_UNITES } from "@/lib/unites";

// L'invariant D28 : l'action est un aplat, le record un contour — lime en texte
// sur fond teinté, flèche montante. Une seule implémentation, réutilisée partout
// où un record s'affiche, sinon la distinction par la forme dérive écran par écran.
export function BadgeRecord({ libelle }: { libelle: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-(--accent-wash) px-1.5 py-0.5 font-mono text-[11.5px] text-accent-ink">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {libelle}
    </span>
  );
}

/** « 85 kg × 5 », ou « 12 reps » au poids du corps. La charge passe par les unités (D52). */
export function formaterSerie(chargeKg: number | null, reps: number | null): string {
  if (chargeKg === null) return reps === null ? "—" : `${reps} reps`;
  return `${formaterCharge(chargeKg, SYSTEME_UNITES)} × ${reps ?? "—"}`;
}
