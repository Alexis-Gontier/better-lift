// L'invariant D28 : l'action est un aplat, le record un contour — lime en texte
// sur fond teinté, flèche montante. Une seule implémentation, réutilisée partout
// où un record s'affiche, sinon la distinction par la forme dérive écran par écran.
export function BadgeRecord({ kg, reps }: { kg: number; reps: number }) {
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
      {kg} kg × {reps}
    </span>
  );
}
