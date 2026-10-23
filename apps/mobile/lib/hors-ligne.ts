import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, onlineManager, type Query, QueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState } from "react-native";

/**
 * Ce qui permet de s'entraîner sans réseau (D96–D99).
 *
 * Le BROUILLON et la FILE d'envoi ne passent pas par ici : ils ont leur propre
 * disque (`stockage.ts`, § 8). Ce module ne garde que des LECTURES, pour que
 * démarrer une routine et ajouter un exercice marchent en salle.
 */

export const UNE_SEMAINE = 7 * 24 * 60 * 60 * 1000;

// `gcTime` doit valoir au moins `maxAge` : une requête ramassée avant
// l'écriture sur disque ne serait jamais persistée.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: UNE_SEMAINE } },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "better-lift:cache-requetes",
});

/**
 * Ce qui entre dans le cache persistant (D96) : les routines, le catalogue
 * complet, les précédents. Pas l'historique : il grossit sans fin, et une
 * ligne AsyncStorage Android plafonne vers 2 Mo.
 */
export function gardeHorsLigne(query: Query): boolean {
  // Sur la DONNÉE, pas sur le statut : un rafraîchissement raté hors ligne
  // passe la requête en erreur en gardant sa donnée, et un filtre sur
  // `success` l'effacerait alors du disque à la première écriture.
  if (query.state.data === undefined) return false;
  const [domaine, sorte] = query.queryKey as unknown[];
  return (
    domaine === "routines" ||
    // Le repos par défaut sert en salle, hors ligne compris (D129).
    domaine === "preferences" ||
    (domaine === "exercices" && sorte === "complet") ||
    (domaine === "seances" && sorte === "precedents")
  );
}

/**
 * Le réseau et le premier plan, branchés sur TanStack Query (D99). Sans le
 * premier, `onlineManager` croit toujours être en ligne sous React Native ;
 * sans le second, `focusManager` ne sait jamais que l'app revient au premier
 * plan. `isConnected` plutôt que `isInternetReachable`, qui vaut souvent
 * `null` sur l'émulateur. Appelée UNE fois, au chargement de la racine.
 */
export function brancherReseauEtPremierPlan(): void {
  onlineManager.setEventListener((setOnline) => {
    // L'état de DÉPART aussi : l'écouteur ne parle qu'au premier changement, et
    // d'ici là TanStack Query se croirait en ligne — il tenterait le réseau et
    // passerait des lectures en cache à l'état d'erreur.
    void Network.getNetworkStateAsync().then((etat) => setOnline(Boolean(etat.isConnected)));
    const abonnement = Network.addNetworkStateListener((etat) => {
      setOnline(Boolean(etat.isConnected));
    });
    return () => abonnement.remove();
  });
  focusManager.setEventListener((setFocused) => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      setFocused(etat === "active");
    });
    return () => abonnement.remove();
  });
}

/**
 * Une promesse qui abandonne au bout de `ms` (D98) : un réseau de salle
 * « connecté mais lent » ne doit pas figer un appui. La requête sous-jacente
 * continue ; si elle aboutit, elle remplit le cache pour la fois suivante.
 */
export function avantDelai<T>(promesse: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resoudre, rejeter) => {
    const minuteur = setTimeout(() => rejeter(new Error("Délai dépassé.")), ms);
    promesse.then(
      (v) => {
        clearTimeout(minuteur);
        resoudre(v);
      },
      (e) => {
        clearTimeout(minuteur);
        rejeter(e);
      },
    );
  });
}
