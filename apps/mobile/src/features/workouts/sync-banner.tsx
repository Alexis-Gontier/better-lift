import { Pressable, StyleSheet, Text, View } from "react-native";

import { retryQueueNow, useSyncQueue } from "./use-workout-sync";

/**
 * « Séance en attente d'envoi ».
 *
 * ## Pourquoi elle existe
 *
 * Une séance mise en file est **enregistrée du point de vue de l'utilisateur** :
 * il a appuyé sur ✓ et quitté l'écran de saisie. S'il ne la retrouve ni dans son
 * historique ni nulle part ailleurs, il croira l'avoir perdue et la ressaisira.
 * La bannière est la seule preuve qu'elle existe encore.
 *
 * Elle ne propose « Réessayer » que pour rendre l'attente supportable : la file
 * part toute seule au retour du réseau, le bouton n'est là que pour ceux qui
 * n'aiment pas attendre sans rien faire — et pour dire tout de suite ce qui
 * coince quand une séance est refusée.
 */
export function SyncBanner() {
  const queue = useSyncQueue();

  if (queue.length === 0) {
    return null;
  }

  const blocked = queue.filter((entry) => entry.blocked);
  const waiting = queue.length - blocked.length;

  return (
    <View style={[styles.card, blocked.length > 0 && styles.cardBlocked]}>
      <Text style={styles.title}>
        {waiting > 0
          ? `${waiting} séance${waiting > 1 ? "s" : ""} en attente d'envoi`
          : `${blocked.length} séance${blocked.length > 1 ? "s" : ""} refusée${blocked.length > 1 ? "s" : ""}`}
      </Text>

      <Text style={styles.hint}>
        {blocked.length > 0
          ? // Le message de l'API est repris tel quel : c'est lui qui dit
            // quelque chose d'utile, là où « échec de l'envoi » n'apprendrait
            // rien.
            (blocked[0]?.lastError ?? "L'API a refusé la séance.")
          : "Elle part toute seule au retour du réseau. Rien n'est perdu, même si l'app se ferme."}
      </Text>

      {/* Les titres disent de quelles séances il s'agit : sans eux, « 2 séances
          en attente » laisserait imaginer n'importe quoi. */}
      {queue.map((entry) => (
        <Text key={entry.input.id} style={styles.entry} numberOfLines={1}>
          · {entry.input.title}
          {entry.attempts > 0
            ? ` — ${entry.attempts} tentative${entry.attempts > 1 ? "s" : ""}`
            : ""}
        </Text>
      ))}

      <Pressable onPress={retryQueueNow} style={styles.retry} accessibilityRole="button">
        <Text style={styles.retryLabel}>Réessayer maintenant</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1d2620",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2f4436",
    padding: 14,
    gap: 4,
  },
  cardBlocked: { backgroundColor: "#241d1d", borderColor: "#4a2f2f" },
  title: { color: "#f2f4f6", fontSize: 15, fontWeight: "600" },
  hint: { color: "#9aa3ad", fontSize: 13 },
  entry: { color: "#6d7680", fontSize: 12, marginTop: 2 },
  retry: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a323b",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryLabel: { color: "#7ad6a5", fontSize: 14, fontWeight: "500" },
});
