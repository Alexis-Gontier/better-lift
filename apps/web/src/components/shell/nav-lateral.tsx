import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { chargerSession } from "@/lib/auth-session";
import { appliquerTheme, type Theme, themeInitial } from "@/lib/theme";

const ENTREES = [
  { to: "/seances", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercices", label: "Exercices" },
] as const;

export function NavLaterale() {
  const [theme, setTheme] = useState<Theme>(() => themeInitial());
  const navigate = useNavigate();
  const router = useRouter();

  async function seDeconnecter() {
    await authClient.signOut();
    // Relire puis invalider, dans cet ordre : une deconnexion qui ne rafraichit
    // pas le contexte laisse l'ancienne session a l'ecran, et la garde continue
    // de laisser passer.
    await chargerSession();
    await router.invalidate();
    await navigate({ to: "/connexion" });
  }

  function basculerTheme() {
    const suivant: Theme = theme === "dark" ? "light" : "dark";
    appliquerTheme(suivant);
    setTheme(suivant);
  }

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

      <div className="mt-auto flex flex-col gap-0.5">
        <button
          type="button"
          onClick={basculerTheme}
          aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-(--ink-muted) hover:bg-(--surface-3) hover:text-(--ink)"
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" className="size-4" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
          {theme === "dark" ? "Thème clair" : "Thème sombre"}
        </button>

        <button
          type="button"
          onClick={seDeconnecter}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-(--ink-muted) hover:bg-(--surface-3) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Se déconnecter
        </button>
      </div>
    </nav>
  );
}
