import { createFileRoute } from "@tanstack/react-router";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/settings/account")({
  staticData: { crumb: "Compte" },
  component: () => (
    <>
      <Zone title="Profil" hint="Nom, e-mail, fuseau horaire" className="min-h-28" />
      <Zone title="Sécurité" hint="Mot de passe" className="min-h-28" />
      <Zone
        title="Sessions ouvertes"
        hint="Appareils connectés, déconnexion à distance"
        className="min-h-28"
      />
      <Zone title="Zone de danger" hint="Supprimer le compte" className="min-h-28" />
    </>
  ),
});
