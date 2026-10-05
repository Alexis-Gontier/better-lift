import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appuyable } from "../components/ui/appuyable";
import { Logo } from "../components/ui/logo";
import { authClient } from "../lib/auth-client";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../lib/theme";

// La création de compte reste sur le web : ici, on ne fait qu'entrer.
type GenreRefus = "identifiants" | "reseau";

const MESSAGES: Record<GenreRefus, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  reseau: "Le serveur ne répond pas. Vérifie ta connexion, puis réessaie.",
};

/**
 * L'accroche en haut, le formulaire en bas : le bouton tombe sous le pouce, et
 * le clavier remonte le tout plutôt que de le recouvrir.
 */
export default function Connexion() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [refus, setRefus] = useState<GenreRefus | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champMotDePasse = useRef<TextInput>(null);
  const { refetch: relireSession } = authClient.useSession();

  async function seConnecter() {
    setEnCours(true);
    setRefus(null);
    try {
      const { error } = await authClient.signIn.email({ email, password: motDePasse });
      if (error) {
        setRefus("identifiants");
        return;
      }
      // La session se relit AVANT de quitter l'écran : sinon la garde des
      // onglets la lit encore absente et renvoie ici, sur un formulaire vide.
      await relireSession();
      router.replace("/");
    } catch {
      setRefus("reseau");
    } finally {
      setEnCours(false);
    }
  }

  const champInvalide = refus === "identifiants" ? styles.champInvalide : null;

  return (
    <SafeAreaView style={styles.ecran}>
      <KeyboardAvoidingView style={styles.ecran} behavior="padding">
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          <View style={styles.marque}>
            <Logo taille={26} />
            <Text style={styles.nom}>better-lift</Text>
          </View>

          <View style={styles.zoneAccroche}>
            <Text style={styles.accroche}>Le carnet,{"\n"}sans le carnet.</Text>
          </View>

          <View style={styles.formulaire}>
            <Text style={styles.titre} accessibilityRole="header">
              Connexion
            </Text>
            <Text style={styles.sousTitre}>Reprends là où tu t'étais arrêté.</Text>

            <Text style={styles.libelle} nativeID="libelle-email">
              Adresse e-mail
            </Text>
            <TextInput
              style={[styles.champ, champInvalide]}
              aria-labelledby="libelle-email"
              placeholder="toi@exemple.fr"
              placeholderTextColor={couleurs.encreAttenuee}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              // Le clavier enchaîne sur le mot de passe.
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => champMotDePasse.current?.focus()}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.libelle} nativeID="libelle-mdp">
              Mot de passe
            </Text>
            <View>
              <TextInput
                ref={champMotDePasse}
                style={[styles.champ, styles.champMdp, champInvalide]}
                aria-labelledby="libelle-mdp"
                placeholderTextColor={couleurs.encreAttenuee}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry={!visible}
                returnKeyType="go"
                value={motDePasse}
                onChangeText={setMotDePasse}
                onSubmitEditing={seConnecter}
              />
              <Appuyable
                style={styles.oeil}
                onPress={() => setVisible((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={
                  visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
                }
                accessibilityState={{ selected: visible }}
                hitSlop={4}
              >
                {visible ? (
                  <EyeOff size={20} color={couleurs.encreTertiaire} />
                ) : (
                  <Eye size={20} color={couleurs.encreTertiaire} />
                )}
              </Appuyable>
            </View>

            {refus ? (
              <Text style={styles.erreur} accessibilityRole="alert">
                {MESSAGES[refus]}
              </Text>
            ) : null}

            <Appuyable
              style={[styles.bouton, enCours && styles.boutonAttente]}
              onPress={seConnecter}
              disabled={enCours}
              accessibilityRole="button"
            >
              <Text style={styles.boutonTexte}>{enCours ? "Connexion…" : "Se connecter"}</Text>
            </Appuyable>

            <Text style={styles.note}>Pas de compte ? Il se crée depuis le web.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { flexGrow: 1, padding: espace.xl },
  marque: { flexDirection: "row", alignItems: "center", gap: espace.s },
  nom: { color: couleurs.encre, fontSize: 15, fontWeight: "600" },
  // Le seul élément fort de l'écran : il pousse le formulaire vers le bas.
  zoneAccroche: { flex: 1, justifyContent: "center", paddingVertical: 40 },
  accroche: {
    color: couleurs.encre,
    fontSize: 40,
    lineHeight: 42,
    fontWeight: "600",
    letterSpacing: -1.2,
  },
  formulaire: { gap: espace.s },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "600" },
  sousTitre: { color: couleurs.encreTertiaire, fontSize: taille.courant, marginBottom: espace.m },
  libelle: { color: couleurs.encre, fontSize: 14, fontWeight: "500", marginTop: espace.s },
  champ: {
    minHeight: CIBLE + 4,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface1,
    color: couleurs.encre,
    fontSize: taille.courant,
    paddingHorizontal: 14,
  },
  champMdp: { paddingRight: CIBLE + 4 },
  champInvalide: { borderColor: couleurs.dangerEncre },
  oeil: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: CIBLE + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  erreur: { color: couleurs.dangerEncre, fontSize: 14, marginTop: espace.xs },
  bouton: {
    minHeight: CIBLE + 8,
    marginTop: espace.l,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonAttente: { opacity: 0.6 },
  boutonTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "700" },
  note: {
    color: couleurs.encreAttenuee,
    fontSize: taille.petit,
    textAlign: "center",
    marginTop: espace.m,
  },
}));
