import { redirect } from "next/navigation";

/**
 * `/settings` n'affiche rien par elle-même : la doc 05 découpe les réglages en
 * trois sections, et la première fait office d'accueil.
 *
 * Une redirection plutôt qu'un choix à faire — une page qui ne sert qu'à
 * proposer trois liens déjà présents dans les onglets juste au-dessus est un
 * clic pour rien.
 */
export default function SettingsPage() {
  redirect("/settings/profile");
}
