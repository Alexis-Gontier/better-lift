import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useConfirmer, useInformer } from "@/lib/confirmation";
import { useSeance } from "@/lib/seance";

/**
 * Les séances terminées qui n'ont pas encore atteint le serveur : en attente
 * (réseau) ou refusées (données). Rien ne s'affiche quand la file est vide.
 */
export function FileEnvoi() {
  const router = useRouter();
  const { file, envoiEnCours, synchroniser, reprendreRefusee, supprimerRefusee } = useSeance();
  const enAttente = file.filter((e) => e.erreur === null);
  const refusees = file.filter((e) => e.erreur !== null);
  const confirmer = useConfirmer();
  const informer = useInformer();

  return (
    <>
      {enAttente.length > 0 ? (
        <View className="gap-2 rounded-lg border border-border p-3">
          <Text className="text-muted-foreground text-sm">
            {enAttente.length === 1
              ? "1 séance en attente d'envoi"
              : `${enAttente.length} séances en attente d'envoi`}
          </Text>
          <Button
            variant="outline"
            className="self-start"
            onPress={() => void synchroniser()}
            disabled={envoiEnCours}
          >
            <Text>{envoiEnCours ? "Envoi…" : "Réessayer"}</Text>
          </Button>
        </View>
      ) : null}

      {refusees.map((e) => (
        <View key={e.seance.id} className="gap-2 rounded-lg border border-destructive p-3">
          <Text className="text-muted-foreground text-sm">
            « {e.seance.nom} » refusée : {e.erreur}
          </Text>
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              onPress={async () => {
                if (await reprendreRefusee(e.seance.id)) router.push("/seance");
                else informer("Une séance est en cours", "Termine-la avant de reprendre celle-ci.");
              }}
            >
              <Text>Reprendre</Text>
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                confirmer({
                  titre: "Supprimer cette séance ?",
                  message: "Elle ne sera jamais enregistrée.",
                  action: "Supprimer la séance",
                  annuler: "Garder",
                  onConfirmer: () => void supprimerRefusee(e.seance.id),
                })
              }
            >
              <Text className="text-destructive">Supprimer</Text>
            </Button>
          </View>
        </View>
      ))}
    </>
  );
}
