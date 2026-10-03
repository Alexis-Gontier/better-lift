import { ListeSeances } from "../../components/historique/liste-seances";

/**
 * L'Accueil est le fil des séances (D95), comme celui de Hevy. Démarrer passe
 * par le bouton central, les routines par leur onglet, la file d'envoi par le
 * Profil.
 */
export default function Accueil() {
  return <ListeSeances titre="Accueil" />;
}
