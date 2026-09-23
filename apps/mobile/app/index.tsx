import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { authClient } from "../lib/auth-client";

export default function Accueil() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/connexion");
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <View style={styles.ecran}>
        <Text style={styles.texte}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>better-lift</Text>
      <Text style={styles.texte}>Connecté : {session?.user.email}</Text>
      <Pressable
        style={styles.bouton}
        onPress={async () => {
          await authClient.signOut();
          router.replace("/connexion");
        }}
      >
        <Text style={styles.boutonTexte}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#08090a",
  },
  titre: { color: "#f2f3f5", fontSize: 24, fontWeight: "600" },
  texte: { color: "#b6bcc4", fontSize: 15 },
  bouton: {
    borderWidth: 1,
    borderColor: "#24272b",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  boutonTexte: { color: "#b6bcc4", fontSize: 15 },
});
