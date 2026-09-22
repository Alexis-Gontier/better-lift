import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001";

export default function Accueil() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch(`${API}/health`);
      if (!res.ok) throw new Error("API injoignable");
      return res.json() as Promise<{ status: string; db: boolean }>;
    },
  });

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>better-lift</Text>
      {isPending && <Text style={styles.texte}>Vérification de l'API…</Text>}
      {isError && <Text style={styles.texte}>API injoignable.</Text>}
      {data && (
        <Text style={styles.texte}>
          API {data.status === "ok" ? "opérationnelle" : "dégradée"} — base{" "}
          {data.db ? "connectée" : "injoignable"}.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#08090a" },
  titre: { color: "#f2f3f5", fontSize: 24, fontWeight: "600", marginBottom: 8 },
  texte: { color: "#b6bcc4", fontSize: 15 },
});
