import { Redirect, Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { BarreOnglets } from "@/components/barre-onglets";
import { PreparerHorsLigne } from "@/components/preparer-hors-ligne";
import { authClient } from "@/lib/auth-client";
import { useSeance } from "@/lib/seance";

// Une fois par démarrage de l'application, pas à chaque retour sur les onglets :
// replier la séance pour aller à l'accueil doit y rester.
let repriseFaite = false;

/**
 * L'application rouverte pendant une séance revient sur la séance (D336), pas
 * sur l'accueil : en salle, c'est l'écran qu'on cherche. Le retour mène aux onglets.
 */
function RepriseAuDemarrage() {
  const router = useRouter();
  const { pret, seance } = useSeance();
  useEffect(() => {
    if (!pret || repriseFaite) return;
    repriseFaite = true;
    if (seance) router.push("/seance");
  }, [pret, seance, router]);
  return null;
}

/**
 * La garde de session (D316) : les onglets exigent un compte, et un seul
 * endroit le vérifie. Trois onglets, Routines · Historique · Profil (D319) ; la
 * séance et ses modales vivent sur la pile racine, par-dessus la barre.
 */
export default function Connecte() {
  const { data: session, isPending, error } = authClient.useSession();
  // Un cookie de session est-il gardé sur le téléphone ? `null` tant que le
  // stockage sécurisé n'a pas répondu.
  const [cookieGarde, setCookieGarde] = useState<boolean | null>(null);
  useEffect(() => {
    void authClient.getCookie().then((c) => setCookieGarde(Boolean(c)));
  }, []);

  // Moins d'une seconde en général : rien plutôt qu'un squelette qui clignote (NN/g).
  if (isPending || (error && cookieGarde === null)) {
    return <View className="flex-1 bg-background" />;
  }
  // D100 : une erreur de lecture (hors ligne) ne renvoie pas à la connexion
  // QUAND un cookie de session est gardé sur le téléphone : la séance en cours
  // doit rester joignable en salle. Sans cookie, il n'y a jamais eu de compte
  // ici — une installation neuve ouverte hors ligne va à la connexion.
  if (!session && !(error && cookieGarde)) return <Redirect href="/connexion" />;

  return (
    <>
      {/* Hors ligne (D96) : remplir le cache tant qu'il y a du réseau. */}
      <PreparerHorsLigne />
      <RepriseAuDemarrage />
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarreOnglets {...props} />}>
        {/* L'ordre des onglets est celui de la barre. */}
        <Tabs.Screen name="index" />
        <Tabs.Screen name="historique" />
        <Tabs.Screen name="profil" />
      </Tabs>
    </>
  );
}
