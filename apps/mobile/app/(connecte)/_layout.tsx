import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { PreparerHorsLigne } from "@/components/preparer-hors-ligne";
import { authClient } from "@/lib/auth-client";

/**
 * La garde de session (D316) : l'accueil et le Profil exigent un compte, et un
 * seul endroit le vérifie. Plus de barre d'onglets : une pile.
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
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
