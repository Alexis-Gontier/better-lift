import type { ReactNode } from "react";

export function EtatVide({
  titre,
  message,
  action,
}: {
  titre: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-base font-medium text-(--ink)">{titre}</p>
      <p className="max-w-sm text-sm text-(--ink-subtle)">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
