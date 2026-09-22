import { Link } from "@tanstack/react-router";

const ENTREES = [
  { to: "/seances", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercices", label: "Exercices" },
] as const;

export function NavLaterale() {
  return (
    <nav aria-label="Navigation principale" className="flex h-full flex-col gap-0.5 p-2.5">
      <div className="flex items-center gap-2 px-2 pb-4 pt-1.5">
        <span
          aria-hidden="true"
          className="size-5.5 rounded-md"
          style={{ background: "var(--accent)" }}
        />
        <span className="text-sm font-semibold tracking-tight">better-lift</span>
      </div>

      {ENTREES.map((entree) => (
        <Link
          key={entree.to}
          to={entree.to}
          className="rounded-md px-2.5 py-2 text-sm text-(--ink-muted) hover:bg-(--surface-3)"
          activeProps={{
            className:
              "rounded-md px-2.5 py-2 text-sm font-medium text-(--ink) bg-(--surface-3) shadow-[inset_2px_0_0_var(--accent)]",
          }}
        >
          {entree.label}
        </Link>
      ))}
    </nav>
  );
}
