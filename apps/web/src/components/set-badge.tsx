import { cn } from "@/lib/utils";

/** Une étiquette de série dans sa case, en couleur selon son type (W, 1, F, D). */
export function SetBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border font-semibold text-sm tabular-nums",
        tone,
      )}
    >
      {label}
    </span>
  );
}
