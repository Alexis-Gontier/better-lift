import { useState } from "react";

/**
 * Tirer une liste pour la relire. Le rond ne suit que ce geste, jamais une
 * relecture de fond (`isRefetching`) : sous Android, un `refreshing` vrai au
 * montage d'une liste y laissait le rond figé sur la première carte.
 */
export function useTirerPourRafraichir(relire: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    void relire().finally(() => setRefreshing(false));
  };
  return { refreshing, onRefresh };
}
