import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageTableau } from "@/components/shell/page-tableau";
import { api } from "../lib/api";

export const Route = createFileRoute("/")({ component: Accueil });

// Écran de contrôle hérité du lot 0. La coquille est montée par chaque route
// depuis la tâche 14 : celle-ci la monte donc aussi, pour garder la navigation.
function Accueil() {
  return (
    <PageTableau titre="Accueil">
      <Sante />
    </PageTableau>
  );
}

function Sante() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.health.$get();
      if (!res.ok) throw new Error("API injoignable");
      return res.json();
    },
  });

  if (isPending) return <p>Vérification de l'API…</p>;
  if (isError) return <p>API injoignable.</p>;

  return (
    <main>
      <h1>better-lift</h1>
      <p>
        API {data.status === "ok" ? "opérationnelle" : "dégradée"} — base{" "}
        {data.db ? "connectée" : "injoignable"}, en ligne depuis {data.uptimeSec} s.
      </p>
    </main>
  );
}
