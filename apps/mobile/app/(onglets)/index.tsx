import { Redirect } from "expo-router";

/**
 * `/` reste une adresse valide (ouverture de l'app, connexion, fin de séance) :
 * Routines est l'écran d'arrivée depuis le retrait de l'Accueil (D178).
 */
export default function Arrivee() {
  return <Redirect href="/routines" />;
}
