import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ListChecks, type LucideIcon, Trophy, WifiOff } from "lucide-react";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { FormulaireConnexion } from "@/features/auth/formulaire-connexion";
import { chargerSession } from "@/lib/auth-session";

const recherche = z.object({ redirect: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/connexion")({
  validateSearch: recherche,
  component: PageConnexion,
});

// Trois phrases qui disent à quoi sert l'app, pas pourquoi l'acheter : personne
// n'a à la choisir, elle a 2 ou 3 comptes.
const POINTS: { icone: LucideIcon; titre: string; texte: string }[] = [
  {
    icone: ListChecks,
    titre: "Tes routines, prêtes avant la salle",
    texte: "Construites au calme sur le web. Au téléphone, il ne reste qu'à saisir.",
  },
  {
    icone: Trophy,
    titre: "Les records se calculent seuls",
    texte: "Charge, volume, 1RM estimé : rien à noter, rien à comparer à la main.",
  },
  {
    icone: WifiOff,
    titre: "Hors ligne en salle",
    texte: "La séance tient sur le téléphone et part dès que le réseau revient.",
  },
];

function PageConnexion() {
  const { redirect, etat } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const force = etatForceRendu(etat, "L'API est injoignable.", () =>
    navigate({ to: "/connexion", search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.35fr_1fr]">
      {/* L'accroche : absente sous `lg`, où le formulaire occupe tout l'écran. */}
      <section
        aria-label="better-lift en bref"
        className="hidden items-center border-r border-(--line) bg-(--surface-1) px-16 lg:flex"
      >
        <div className="mx-auto w-full max-w-xl">
          <h2 className="text-6xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
            Le carnet,
            <br />
            sans le carnet.
          </h2>
          <div aria-hidden="true" className="mt-10 mb-10 h-px w-12 bg-(--line-strong)" />
          <ul className="flex flex-col gap-7">
            {POINTS.map(({ icone: Icone, titre, texte }) => (
              <li key={titre} className="flex gap-3.5">
                <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-(--ink-subtle)" />
                <div>
                  <p className="text-sm font-semibold">{titre}</p>
                  <p className="mt-1 text-sm text-(--ink-subtle)">{texte}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="flex flex-col px-6 py-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="size-5 rounded-md bg-primary" />
          <span className="text-sm font-semibold tracking-tight">better-lift</span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {force ?? (
            <FormulaireConnexion
              onSucces={async () => {
                // Relire la session PUIS invalider : sans l'invalidation, le
                // `beforeLoad` de `_protege` relirait l'ancien contexte et
                // renverrait aussitôt vers /connexion.
                await chargerSession();
                await router.invalidate();
                await navigate({ to: redirect ?? "/seances" });
              }}
            />
          )}
        </div>

        <p className="text-xs text-(--ink-faint)">Un carnet privé, pour quelques comptes.</p>
      </main>
    </div>
  );
}
