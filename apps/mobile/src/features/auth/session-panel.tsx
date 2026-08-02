import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useMe } from "@better-lift/api-client";

import { apiClient } from "@/lib/api";
import { signIn, signOut, useSession } from "@/lib/auth-client";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Pendant mobile du panneau web (doc 09, risque 2).
 *
 * `useSession()` lit la session stockée par le plugin Expo ; `useMe()` passe
 * par `GET /v1/me` avec le jeton en `Authorization: Bearer`. La seconde est
 * celle qui compte : elle prouve que la **même** instance sert le mobile sans
 * cookie, là où le web est servi par cookie.
 */
export function SessionPanel() {
  const queryClient = useQueryClient();
  const session = useSession();
  const me = useMe(apiClient);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSignIn() {
    setError(null);
    setPending(true);

    const result = await signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Échec de la connexion.");
      return;
    }

    await queryClient.invalidateQueries();
  }

  if (session.isPending) {
    return <ActivityIndicator color="#7ad6a5" />;
  }

  /**
   * Le garde porte sur `user`, pas seulement sur `data` : Better Auth peut
   * rendre une session présente mais sans utilisateur — jeton périmé, session
   * partiellement rechargée depuis SecureStore. Tester `data` seul laissait
   * passer ce cas, et l'écran plantait sur `data.user.email`.
   */
  if (!session.data?.user) {
    return (
      <View style={styles.stack}>
        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          placeholderTextColor="#7b8794"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#7b8794"
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={() => void onSignIn()} disabled={pending}>
          <Text style={styles.buttonLabel}>{pending ? "…" : "Se connecter"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Row label="Session (client)" value={session.data.user.email} />
      {/* Le garde ci-dessus a déjà écarté l'absence d'utilisateur. */}
      <Row
        label="Session (via l’API)"
        value={me.isPending ? "…" : (me.data?.email ?? `échec : ${me.error?.message ?? ""}`)}
      />

      <Pressable
        style={styles.buttonGhost}
        onPress={() =>
          void signOut().then(async () => {
            await queryClient.invalidateQueries();
          })
        }
      >
        <Text style={styles.buttonGhostLabel}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 16,
    paddingVertical: 6,
  },
  rowLabel: { color: "#9aa5b1", fontSize: 14 },
  rowValue: { color: "#f2f4f6", fontVariant: ["tabular-nums"], flexShrink: 1 },
  input: {
    backgroundColor: "#171c22",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f2f4f6",
  },
  error: { color: "#f2777a", fontSize: 13 },
  button: {
    backgroundColor: "#7ad6a5",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  buttonLabel: { color: "#101418", fontWeight: "600" },
  buttonGhost: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a323b",
  },
  buttonGhostLabel: { color: "#f2f4f6" },
});
