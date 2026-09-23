import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { authClient } from "../lib/auth-client";

// Volontairement brut : le dessin mobile est le lot 6. Cet écran existe pour
// prouver que la connexion passe et que la session tient au redémarrage.
export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function seConnecter() {
    setEnCours(true);
    setErreur(null);
    try {
      const { error } = await authClient.signIn.email({ email, password: motDePasse });
      if (error) {
        setErreur("Adresse ou mot de passe incorrect.");
        return;
      }
      router.replace("/");
    } catch {
      setErreur("API injoignable.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>better-lift</Text>
      <TextInput
        style={styles.champ}
        placeholder="Adresse e-mail"
        placeholderTextColor="#6a717a"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.champ}
        placeholder="Mot de passe"
        placeholderTextColor="#6a717a"
        secureTextEntry
        value={motDePasse}
        onChangeText={setMotDePasse}
      />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
      <Pressable style={styles.bouton} onPress={seConnecter} disabled={enCours}>
        <Text style={styles.boutonTexte}>{enCours ? "…" : "Se connecter"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#08090a" },
  titre: { color: "#f2f3f5", fontSize: 24, fontWeight: "600", marginBottom: 12 },
  champ: {
    borderWidth: 1,
    borderColor: "#24272b",
    borderRadius: 8,
    color: "#f2f3f5",
    fontSize: 16,
    padding: 14,
  },
  erreur: { color: "#e98b85", fontSize: 14 },
  bouton: { backgroundColor: "#a8cf45", borderRadius: 8, padding: 16, alignItems: "center" },
  boutonTexte: { color: "#0b0f04", fontSize: 16, fontWeight: "700" },
});
