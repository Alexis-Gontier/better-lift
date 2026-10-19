import { formaterCharge, PREFERENCES_DEFAUT } from "@better-lift/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ChevronRight, Download } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileEnvoi } from "../../components/file-envoi";
import { Appuyable } from "../../components/ui/appuyable";
import { EnteteRetour } from "../../components/ui/entete-retour";
import { Tuile } from "../../components/ui/tuile";
import { authClient } from "../../lib/auth-client";
import { useConfirmer, useFeuille, useInformer } from "../../lib/confirmation";
import { persister } from "../../lib/hors-ligne";
import {
  chargerExport,
  optionsBilan,
  optionsPreferences,
  useEcrirePreferences,
} from "../../lib/requetes";
import { useSeance } from "../../lib/seance";
import { CHOIX_REPOS, libelleRepos } from "../../lib/temps";
import { affiche, CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { type ChoixTheme, useChoixTheme } from "../../lib/theme-choix";
import { SYSTEME_UNITES } from "../../lib/unites";
import { useVibrations } from "../../lib/vibrations";

const DEPUIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const THEMES: Record<ChoixTheme, string> = { systeme: "Système", sombre: "Sombre", clair: "Clair" };
const libelleObjectif = (n: number | null) =>
  n ? `${n} séance${n > 1 ? "s" : ""} / semaine` : "Aucun";

/**
 * Le profil (D128) : le bilan de toujours, l'entraînement (objectif, repos par
 * défaut — sur le compte, D129), les réglages du téléphone (thème, vibrations),
 * l'export, le compte et la file d'envoi. Aucun aplat : rien ici n'est
 * l'action principale d'une séance (D105).
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
  const bilan = useQuery(optionsBilan());
  const preferences = useQuery(optionsPreferences());
  const ecrire = useEcrirePreferences();
  const [theme, reglerTheme] = useChoixTheme();
  const feuille = useFeuille();
  const informer = useInformer();
  const [exportEnCours, setExportEnCours] = useState(false);
  const prefs = preferences.data ?? PREFERENCES_DEFAUT;

  const choisirObjectif = () =>
    feuille({
      titre: "Objectif hebdomadaire",
      options: [null, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
        libelle: libelleObjectif(n),
        choisie: prefs.objectifHebdo === n,
        onPress: () => ecrire.mutate({ ...prefs, objectifHebdo: n }),
      })),
    });
  const choisirRepos = () =>
    feuille({
      titre: "Repos par défaut",
      options: CHOIX_REPOS.map((sec) => ({
        libelle: sec ? libelleRepos(sec) : "Aucun",
        choisie: prefs.reposDefautSec === sec,
        onPress: () => ecrire.mutate({ ...prefs, reposDefautSec: sec }),
      })),
    });
  const choisirTheme = () =>
    feuille({
      titre: "Thème",
      options: (Object.keys(THEMES) as ChoixTheme[]).map((t) => ({
        libelle: THEMES[t],
        choisie: theme === t,
        onPress: () => reglerTheme(t),
      })),
    });

  // Toutes les séries en CSV, écrites dans le cache puis confiées au partage du
  // système : l'utilisateur choisit où les envoyer (mail, Drive, fichiers).
  const exporter = async () => {
    setExportEnCours(true);
    try {
      const fichier = new File(Paths.cache, "better-lift.csv");
      fichier.write(await chargerExport());
      await Sharing.shareAsync(fichier.uri, {
        mimeType: "text/csv",
        dialogTitle: "Exporter mes séances",
      });
    } catch {
      informer("Export impossible", "Vérifie la connexion, puis réessaie.");
    } finally {
      setExportEnCours(false);
    }
  };

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
      {/* Plus un onglet (D316) : un retour vers l'accueil. */}
      <EnteteRetour titre="Profil" />
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={[styles.carte, styles.bilan]}>
          <Text style={styles.nom} numberOfLines={1}>
            {session?.user.name || session?.user.email || "—"}
          </Text>
          {bilan.data?.depuis ? (
            <Text style={styles.detail}>Depuis {DEPUIS.format(Date.parse(bilan.data.depuis))}</Text>
          ) : null}
          <View style={styles.tuiles}>
            <Tuile libelle="Séances" valeur={bilan.data ? String(bilan.data.nbSeances) : "—"} />
            <Tuile
              libelle="Soulevé au total"
              valeur={bilan.data ? formaterCharge(bilan.data.volumeKg, SYSTEME_UNITES) : "—"}
            />
          </View>
        </View>

        {/* Une séance pas encore arrivée au serveur passe avant les réglages ; sans
            rien en attente, la section n'existe pas (D175). */}
        <FileEnvoi />

        <Section titre="Entraînement">
          <Ligne
            libelle="Objectif"
            detail="Progrès dit les semaines tenues."
            onPress={choisirObjectif}
            inactif={!preferences.data}
          >
            <Text style={styles.valeur}>{libelleObjectif(prefs.objectifHebdo)}</Text>
          </Ligne>
          <Ligne
            libelle="Repos par défaut"
            detail="Pour les exercices sans repos propre."
            onPress={choisirRepos}
            inactif={!preferences.data}
            dernier
          >
            <Text style={styles.valeur}>
              {prefs.reposDefautSec ? libelleRepos(prefs.reposDefautSec) : "Aucun"}
            </Text>
          </Ligne>
        </Section>

        <Section titre="Ce téléphone">
          <Ligne libelle="Thème" detail="Ce téléphone seulement." onPress={choisirTheme}>
            <Text style={styles.valeur}>{THEMES[theme]}</Text>
          </Ligne>
          <Ligne libelle="Vibrations" detail="Série validée, fin du repos." dernier>
            <Switch
              value={vibrations}
              onValueChange={reglerVibrations}
              accessibilityLabel="Vibrations"
              // Un état, ni une action ni un record : l'encre, pas l'orange.
              trackColor={{ true: couleurs.encre, false: couleurs.surface3 }}
              thumbColor={couleurs.surface1}
            />
          </Ligne>
        </Section>

        <Section titre="Données">
          <Ligne
            libelle="Exporter mes séances"
            detail="Toutes les séries, en CSV."
            onPress={() => void exporter()}
            inactif={exportEnCours}
            dernier
          >
            {exportEnCours ? (
              <ActivityIndicator size="small" color={couleurs.encreTertiaire} />
            ) : (
              <Download size={20} color={couleurs.encreSecondaire} />
            )}
          </Ligne>
        </Section>

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
  onPress,
  inactif,
  children,
}: {
  libelle: string;
  detail?: string;
  dernier?: boolean;
  /** Une ligne qui ouvre un choix : appuyable en entier, chevron au bout. */
  onPress?: () => void;
  inactif?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const contenu = (
    <>
      <View style={styles.gauche}>
        <Text style={styles.libelle}>{libelle}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {children}
      {onPress ? <ChevronRight size={18} color={couleurs.encreAttenuee} /> : null}
    </>
  );
  return onPress ? (
    <Appuyable
      onPress={onPress}
      disabled={inactif}
      style={[styles.ligne, !dernier && styles.separe, inactif && styles.inactif]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactif }}
    >
      {contenu}
    </Appuyable>
  ) : (
    <View style={[styles.ligne, !dernier && styles.separe]}>{contenu}</View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
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
  inactif: { opacity: 0.5 },
  bilan: { padding: espace.l, gap: espace.xs },
  nom: { ...affiche, color: couleurs.encre, fontSize: taille.grand + 4 },
  tuiles: { flexDirection: "row", gap: espace.m, marginTop: espace.m },
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
