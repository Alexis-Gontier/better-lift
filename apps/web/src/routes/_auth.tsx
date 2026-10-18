import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useProto } from "@/components/proto/use-proto";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_auth")({
  staticData: {
    proto: {
      variants: [
        { value: "a", label: "Centré" },
        { value: "b", label: "Deux colonnes" },
      ],
      states: true,
    },
  },
  component: AuthLayout,
});

/** Le nom en texte, sans logo tant que l'identité n'est pas choisie (D229). */
function Brand() {
  return <span className="font-semibold text-sm tracking-tight">better-lift</span>;
}

/** Hors coquille : formulaire centré seul (a), ou formulaire et panneau illustré (b). */
function AuthLayout() {
  const { variant } = useProto();

  if (variant === "b") {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <Brand />
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <Outlet />
            </div>
          </div>
        </div>
        <div className="hidden bg-muted p-10 lg:flex">
          <Zone
            title="Illustration"
            hint="Photo de salle ou visuel de l'identité, à choisir avec le style"
            className="flex-1"
          />
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <Brand />
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 md:p-8">
        <Outlet />
      </div>
    </main>
  );
}
