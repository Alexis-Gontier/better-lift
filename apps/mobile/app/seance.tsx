import {
  ajouterExercice,
  ajouterSerie,
  ajusterRepos,
  arreterRepos,
  avecPrecedents,
  bilanSeance,
  formaterCharge,
  marquerReposSignale,
  modifierNote,
  modifierReposExercice,
  modifierSerie,
  remplacerExercice,
  reposRestant,
  retirerExercice,
  retirerSerie,
  type SeanceEnCours,
  secondesEcoulees,
  validerSerie,
} from "@better-lift/shared";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BandeauRepos } from "../components/seance/bandeau-repos";
import { CarteExercice } from "../components/seance/carte-exercice";
import { attendreChoix } from "../lib/choix-exercices";
import { chargerPrecedents } from "../lib/requetes";
import { useSeance } from "../lib/seance";
import { formaterDuree, useMaintenant } from "../lib/temps";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../lib/theme";
import { SYSTEME_UNITES } from "../lib/unites";

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chiffre}>
      <Text style={styles.chiffreLibelle}>{libelle}</Text>
      <Text style={styles.chiffreValeur}>{valeur}</Text>
    </View>
  );
}

export default function Seance() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const client = useQueryClient();
  const { pret, seance, modifier, abandonner: effacerSeance, recharger } = useSeance();
  const maintenant = useMaintenant();
  // L'écran reste allumé tant que la séance est affichée (D79) : le téléphone
  // posé sur le banc ne doit pas se verrouiller entre deux séries.
  useKeepAwake();

  // Les choix de la modale reviennent APRÈS une attente (les précédents) : ils
  // s'appliquent à la séance du moment, pas à celle de l'ouverture.
  const courante = useRef<SeanceEnCours | null>(seance);
  courante.current = seance;

  // L'écran RELIT le disque à chaque affichage (§ 8) : c'est le même chemin
  // après un démarrage, une reprise, ou un arrêt forcé de l'application.
  useFocusEffect(
    useCallback(() => {
      void recharger();
    }, [recharger]),
  );

  const repos = seance ? reposRestant(seance, maintenant) : null;

  // La fin du repos vibre UNE fois : `signale` est écrit dans le brouillon, donc
  // un redémarrage ne refait pas vibrer un repos déjà annoncé.
  useEffect(() => {
    if (seance?.repos && !seance.repos.signale && repos === 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      modifier(marquerReposSignale(seance));
    }
  }, [repos, seance, modifier]);

  if (!pret) return <SafeAreaView style={styles.ecran} />;

  if (!seance) {
    return (
      <SafeAreaView style={[styles.ecran, styles.centre]}>
        <Text style={styles.pale}>Aucune séance en cours.</Text>
        <Pressable onPress={() => router.replace("/")} style={styles.secondaire}>
          <Text style={styles.secondaireTexte}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const abandonner = () =>
    Alert.alert("Abandonner la séance ?", "Rien ne sera enregistré.", [
      { text: "Continuer", style: "cancel" },
      {
        text: "Abandonner",
        style: "destructive",
        onPress: async () => {
          await effacerSeance();
          router.replace("/");
        },
      },
    ]);

  // D93 : ajouter et remplacer passent par la modale du catalogue.
  const ajouter = () => {
    attendreChoix(async (choix) => {
      const precedents = await chargerPrecedents(
        client,
        choix.map((c) => c.slug),
      );
      const s = courante.current;
      if (!s) return;
      const avec = choix.reduce((acc, c) => ajouterExercice(acc, c.slug, c.nom), s);
      modifier(avecPrecedents(avec, precedents));
    });
    router.push("/choisir-exercices");
  };

  const remplacer = (iE: number) => {
    attendreChoix(async ([c]) => {
      if (!c) return;
      const precedents = await chargerPrecedents(client, [c.slug]);
      const s = courante.current;
      if (!s) return;
      modifier(avecPrecedents(remplacerExercice(s, iE, c.slug, c.nom), precedents));
    });
    router.push("/choisir-exercices?mode=remplacer");
  };

  const bilan = bilanSeance(seance);

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.entete}>
        <View style={styles.titreLigne}>
          <Text style={styles.nom} numberOfLines={1}>
            {seance.nom}
          </Text>
          <Pressable
            onPress={() => router.push("/fin")}
            style={styles.terminer}
            accessibilityRole="button"
          >
            <Text style={styles.terminerTexte}>Terminer</Text>
          </Pressable>
        </View>
        <View style={styles.chiffres}>
          <Chiffre
            libelle="Durée"
            valeur={formaterDuree(secondesEcoulees(seance.debut, maintenant))}
          />
          <Chiffre libelle="Volume" valeur={formaterCharge(bilan.volumeKg, SYSTEME_UNITES)} />
          <Chiffre libelle="Séries" valeur={String(bilan.seriesFaites)} />
        </View>
      </View>

      {/* De la marge en bas : le bandeau de repos ne doit jamais cacher la dernière série. */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
      >
        {seance.exercices.length === 0 ? (
          <Text style={styles.vide}>Ajoute un premier exercice pour commencer.</Text>
        ) : null}
        {seance.exercices.map((e, iE) => (
          <CarteExercice
            key={`${e.slug}-${iE}`}
            exercice={e}
            onModifierSerie={(iS, patch) => modifier(modifierSerie(seance, iE, iS, patch))}
            onValiderSerie={(iS) => modifier(validerSerie(seance, iE, iS, new Date()))}
            onAjouterSerie={() => modifier(ajouterSerie(seance, iE))}
            onRetirerSerie={(iS) => modifier(retirerSerie(seance, iE, iS))}
            onNote={(note) => modifier(modifierNote(seance, iE, note))}
            onRepos={(sec) => modifier(modifierReposExercice(seance, iE, sec))}
            onReorganiser={() => router.push("/reorganiser")}
            onRemplacer={() => remplacer(iE)}
            onRetirer={() => modifier(retirerExercice(seance, iE))}
          />
        ))}
        <View style={styles.pied}>
          <Pressable onPress={ajouter} style={styles.ajouter} accessibilityRole="button">
            <Plus size={18} color={couleurs.encre} strokeWidth={2.4} />
            <Text style={styles.ajouterTexte}>Ajouter un exercice</Text>
          </Pressable>
          <Pressable onPress={abandonner} style={styles.abandon} accessibilityRole="button">
            <Text style={styles.abandonTexte}>Abandonner la séance</Text>
          </Pressable>
        </View>
      </ScrollView>

      {repos !== null ? (
        <BandeauRepos
          restant={repos}
          onPasser={() => modifier(arreterRepos(seance))}
          onAjuster={(delta) => modifier(ajusterRepos(seance, delta, new Date()))}
        />
      ) : null}
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  centre: { alignItems: "center", justifyContent: "center", gap: espace.l },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.courant },
  entete: {
    paddingHorizontal: espace.l,
    paddingTop: espace.s,
    paddingBottom: espace.m,
    gap: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  titreLigne: { flexDirection: "row", alignItems: "center", gap: espace.m },
  nom: { flex: 1, color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
  // L'action principale de l'écran : l'aplat lime (D28), compact (D94).
  terminer: {
    height: 36,
    paddingHorizontal: espace.l,
    borderRadius: 8,
    backgroundColor: couleurs.action,
    justifyContent: "center",
  },
  terminerTexte: { color: couleurs.surAction, fontSize: 15, fontWeight: "700" },
  chiffres: { flexDirection: "row", gap: espace.xl },
  chiffre: { gap: 1 },
  chiffreLibelle: { color: couleurs.encreAttenuee, fontSize: 12 },
  chiffreValeur: {
    color: couleurs.encre,
    fontSize: taille.courant,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  vide: {
    color: couleurs.encreTertiaire,
    fontSize: taille.courant,
    textAlign: "center",
    paddingVertical: espace.xl,
  },
  pied: { padding: espace.m, gap: espace.s },
  ajouter: {
    height: 44,
    borderRadius: 10,
    backgroundColor: couleurs.surface2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
  },
  ajouterTexte: { color: couleurs.encre, fontSize: 15, fontWeight: "600" },
  secondaire: {
    minHeight: CIBLE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espace.l,
  },
  secondaireTexte: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  abandon: { height: 44, alignItems: "center", justifyContent: "center" },
  abandonTexte: { color: couleurs.dangerEncre, fontSize: 15 },
}));
