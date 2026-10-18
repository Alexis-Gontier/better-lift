import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Trophy } from "lucide-react";
import { formatKg, formatShortDay } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import type { RecordEvent } from "@/mocks/record-insights";

/** « 92,5 kg × 5 », ou « 12 reps » sans charge. */
export const setText = (s: { kg: number | null; reps: number }) =>
  s.kg ? `${formatKg(s.kg)} × ${s.reps}` : `${s.reps} reps`;

/** Un record battu : l'exercice, la série, la date ; ouvre sa séance. */
export function RecordRow({ event }: { event: RecordEvent }) {
  return (
    <Link
      to="/history/$id"
      params={{ id: event.sessionId }}
      className="flex items-center gap-3 border-t px-4 py-2.5 transition-colors hover:bg-muted/40"
    >
      <Trophy className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">
        {exerciseBySlug(event.slug)?.name ?? event.slug}
      </span>
      <span className="shrink-0 text-sm tabular-nums">{setText(event)}</span>
      <span className="w-16 shrink-0 text-right text-muted-foreground text-xs">
        {formatShortDay(event.date)}
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
