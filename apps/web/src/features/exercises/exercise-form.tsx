import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { filled } from "@/features/routines/routine-editor";
import type { MockExercise } from "@/mocks/exercises";

/**
 * Ce qui se modifie d'une fiche (D264) : la note épinglée. Le catalogue ne se renomme pas, et il
 * n'y a pas d'exercice personnel (D286).
 */
export type ExerciseDraft = { note: string };

export const toExerciseDraft = (e: MockExercise): ExerciseDraft => ({ note: e.note ?? "" });

/** 1 si la note change, 0 sinon. */
export const exerciseChangeCount = (draft: ExerciseDraft, saved: MockExercise): number =>
  Number(draft.note.trim() !== (saved.note ?? "").trim());

/** La fiche enregistrée à partir du brouillon ; une note vide disparaît. */
export function fromExerciseDraft(draft: ExerciseDraft, saved: MockExercise): MockExercise {
  const note = draft.note.trim();
  const { note: _note, ...rest } = saved;
  return { ...rest, ...(note ? { note } : {}) };
}

type OnChange = (update: (d: ExerciseDraft) => ExerciseDraft) => void;

/** La note épinglée : un réglage de machine, une consigne. Elle suit l'exercice partout (D241). */
export function ExerciseNote({ draft, onChange }: { draft: ExerciseDraft; onChange: OnChange }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Note épinglée</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          aria-label="Note épinglée"
          placeholder="Réglage de machine, consigne…"
          className={filled}
          value={draft.note}
          onChange={(e) => onChange((d) => ({ ...d, note: e.target.value }))}
        />
      </CardContent>
    </Card>
  );
}
