import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, type TextInput, View } from "react-native";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// La création de compte reste sur le web : ici, on ne fait qu'entrer.
type GenreRefus = "identifiants" | "reseau";

const MESSAGES: Record<GenreRefus, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  reseau: "Le serveur ne répond pas. Vérifie ta connexion, puis réessaie.",
};

/**
 * Le logo et le nom (D326), le formulaire en bas : le bouton
 * tombe sous le pouce, et le clavier remonte le tout plutôt que de le recouvrir.
 */
export default function Connexion() {
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
      // La session se relit AVANT de quitter l'écran : sinon la garde la lit
      // encore absente et renvoie ici, sur un formulaire vide.
      await relireSession();
      router.replace("/");
    } catch {
      setRefus("reseau");
    } finally {
      setEnCours(false);
    }
  }

  const invalide = refus === "identifiants";

  return (
    <Ecran className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          contentContainerClassName="grow justify-end gap-6 p-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Le logo occupe le haut, que le formulaire laisse libre ; le clavier le resserre. */}
          <View className="flex-1 items-center justify-center gap-3 py-6">
            <Logo taille={72} />
            <Text className="font-semibold text-xl">better-lift</Text>
          </View>
          <View className="gap-1">
            <Text className="font-semibold text-2xl" accessibilityRole="header">
              Connexion
            </Text>
            <Text className="text-muted-foreground">Pas de compte ? Il se crée depuis le web.</Text>
          </View>
          <View className="gap-2">
            <Label nativeID="libelle-email">Adresse e-mail</Label>
            <Input
              aria-labelledby="libelle-email"
              className={cn("h-12", invalide && "border-destructive")}
              placeholder="toi@exemple.fr"
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
          </View>
          <View className="gap-2">
            <Label nativeID="libelle-mdp">Mot de passe</Label>
            <View>
              <Input
                ref={champMotDePasse}
                aria-labelledby="libelle-mdp"
                className={cn("h-12 pr-12", invalide && "border-destructive")}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry={!visible}
                returnKeyType="go"
                value={motDePasse}
                onChangeText={setMotDePasse}
                onSubmitEditing={seConnecter}
              />
              <Pressable
                onPress={() => setVisible((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={
                  visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
                }
                accessibilityState={{ selected: visible }}
                className="absolute top-0 right-0 bottom-0 w-12 items-center justify-center"
              >
                <Icon as={visible ? EyeOff : Eye} className="size-5 text-muted-foreground" />
              </Pressable>
            </View>
            {refus ? (
              <Text className="text-destructive text-sm" accessibilityRole="alert">
                {MESSAGES[refus]}
              </Text>
            ) : null}
          </View>
          <Button className="h-12" onPress={seConnecter} disabled={enCours}>
            <Text>{enCours ? "Connexion…" : "Se connecter"}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Ecran>
  );
}
