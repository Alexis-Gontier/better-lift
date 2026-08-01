"use client";

/**
 * Briques communes aux quatre formulaires d'authentification.
 *
 * Elles restent locales à `features/auth` : la règle du projet veut qu'un
 * composant réutilisé ailleurs parte dans `packages/ui`, mais rien ici n'a
 * encore d'usage hors de ce dossier. Le jour où le reste de l'application aura
 * ses champs de formulaire, c'est shadcn/ui qui les fournira.
 */

const FIELD_CLASSNAME =
  "w-full rounded-lg bg-surface-raised px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent";

export function Field({
  label,
  hint,
  ...input
}: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <input {...input} className={FIELD_CLASSNAME} />
      {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

/**
 * `role="alert"` fait annoncer le message par les lecteurs d'écran sans qu'il
 * faille déplacer le focus — un échec de connexion doit être perçu, pas
 * seulement affiché (WCAG 2.1 AA, doc 05).
 */
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="text-sm text-accent">
      {children}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-surface disabled:opacity-50"
    >
      {pending ? "…" : children}
    </button>
  );
}

export function Separator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted">
      <span className="h-px flex-1 bg-white/10" />
      {children}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
