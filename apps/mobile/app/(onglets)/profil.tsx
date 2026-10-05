import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileEnvoi } from "../../components/file-envoi";
import { Appuyable } from "../../components/ui/appuyable";
import { authClient } from "../../lib/auth-client";
import { useConfirmer } from "../../lib/confirmation";
import { persister } from "../../lib/hors-ligne";
import { useSeance } from "../../lib/seance";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { useVibrations } from "../../lib/vibrations";

/**
 * Le compte, les réglages du téléphone et la file d'envoi. Aucun aplat : rien
 * ici n'est l'action principale d'une séance (D105).
 */
export default function Profil() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const client = useQueryClient();
  const { data: session } = authClient.useSession();
  const { file, seance } = useSeance();
  const [vibrations, reglerVibrations] = useVibrations();
  const demander = useConfirmer();
  const enAttente = file.filter((e) => e.erreur === null).length;

  const seDeconnecter = async () => {
    await authClient.signOut();
    // Les clés de cache ne portent pas l'utilisateur : sans ce vidage, le
    // compte suivant verrait un instant les données du précédent.
    client.clear();
    // Le cache gardé sur le disque (D96) part aussi : le compte suivant ne doit
    // jamais voir les routines du précédent, même hors ligne.
    await persister.removeClient();
    router.replace("/connexion");
  };

  // Se déconnecter avec des séances non envoyées : elles restent sur le disque,
  // mais partiraient sous le compte suivant. On prévient.
  const confirmer = () =>
    enAttente > 0 || seance
      ? demander({
          titre: "Se déconnecter ?",
          message:
            "Une séance est en cours ou attend d'être envoyée. Elle restera sur ce téléphone.",
          action: "Se déconnecter",
          annuler: "Rester connecté",
          onConfirmer: () => void seDeconnecter(),
        })
      : void seDeconnecter();

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titre} accessibilityRole="header">
        Profil
      </Text>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Section titre="Compte">
          <Ligne libelle="Adresse">
            <Text style={styles.valeur} numberOfLines={1}>
              {session?.user.email ?? "—"}
            </Text>
          </Ligne>
          <Ligne libelle="Version" dernier>
            <Text style={styles.valeur}>{Constants.expoConfig?.version ?? "—"}</Text>
          </Ligne>
        </Section>

        <Section titre="Réglages">
          <Ligne libelle="Vibrations" detail="Série validée, fin du repos." dernier>
            <Switch
              value={vibrations}
              onValueChange={reglerVibrations}
              accessibilityLabel="Vibrations"
              // Un état, ni une action ni un record : l'encre, pas le lime.
              trackColor={{ true: couleurs.encre, false: couleurs.surface3 }}
              thumbColor={couleurs.surface1}
            />
          </Ligne>
        </Section>

        <Section titre="Envoi">
          <Ligne libelle="En attente" dernier>
            <Text style={styles.valeur}>
              {enAttente === 0 ? "Rien" : `${enAttente} séance${enAttente > 1 ? "s" : ""}`}
            </Text>
          </Ligne>
        </Section>
        {/* Les séances pas encore arrivées au serveur : réessayer, reprendre ou
            supprimer une séance refusée. */}
        <FileEnvoi />

        <Appuyable style={styles.deconnexion} onPress={confirmer} accessibilityRole="button">
          <Text style={styles.dangerTexte}>Se déconnecter</Text>
        </Appuyable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View>
      <Text style={styles.section} accessibilityRole="header">
        {titre}
      </Text>
      <View style={styles.carte}>{children}</View>
    </View>
  );
}

function Ligne({
  libelle,
  detail,
  dernier,
  children,
}: {
  libelle: string;
  detail?: string;
  dernier?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.ligne, !dernier && styles.separe]}>
      <View style={styles.gauche}>
        <Text style={styles.libelle}>{libelle}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  titre: {
    color: couleurs.encre,
    fontSize: taille.titre,
    fontWeight: "700",
    padding: espace.l,
  },
  contenu: { paddingHorizontal: espace.l, paddingBottom: espace.xxl, gap: espace.l },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: espace.s,
  },
  carte: {
    borderRadius: rayon.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  ligne: {
    minHeight: CIBLE + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.l,
    paddingVertical: espace.s,
  },
  separe: { borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
  // Le libellé prend la place libre et pousse la valeur ou l'interrupteur au bord.
  gauche: { flex: 1, minWidth: 96, gap: 2 },
  libelle: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  detail: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  valeur: {
    flexShrink: 1,
    textAlign: "right",
    color: couleurs.encreSecondaire,
    fontSize: taille.courant,
  },
  deconnexion: {
    minHeight: CIBLE,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerTexte: { color: couleurs.dangerEncre, fontSize: taille.courant, fontWeight: "600" },
}));
