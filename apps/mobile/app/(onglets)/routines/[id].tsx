import { dureeEstimeeSec, resumeSeries } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Dumbbell, Pencil } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteMuscles } from "../../../components/routines/carte-muscles";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur } from "../../../components/ui/etats";
import { useDemarrer } from "../../../lib/demarrer";
import { optionsRoutine } from "../../../lib/requetes";
import { useSeance } from "../../../lib/seance";
import { CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

/** « 90 s », « 2 min », « 2 min 30 » : ce qu'on lit d'un coup d'œil. */
function formaterRepos(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  const reste = sec % 60;
  return reste ? `${min} min ${String(reste).padStart(2, "0")}` : `${min} min`;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine : son titre, ce qu'elle travaille, ses exercices, et Démarrer
 * sous le pouce — l'aplat de l'écran (D105), absent pendant une séance, que le
 * bandeau reprend (D107). « Modifier » ouvre l'édition (D82).
 */
export default function DetailRoutine() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const routine = useQuery(optionsRoutine(id));
  const { routine: demarrer, ouverture } = useDemarrer();
  const { seance } = useSeance();
  const modifier = () => router.push({ pathname: "/routine-edition", params: { id } });

  if (routine.isPending || (routine.isError && !routine.data)) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {routine.isPending ? (
          <Chargement />
        ) : (
          <Erreur
            message="Cette routine n'a pas pu être chargée."
            onReessayer={() => routine.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const r = routine.data;
  const nbSeries = r.exercices.reduce((n, e) => n + e.series.length, 0);
  const minutes = Math.max(1, Math.round(dureeEstimeeSec(r.exercices) / 60));

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour
        titre=""
        action={
          <Pressable
            onPress={modifier}
            style={styles.modifier}
            accessibilityRole="button"
            accessibilityLabel="Modifier la routine"
          >
            <Pencil size={18} color={couleurs.encreSecondaire} />
            <Text style={styles.modifierTexte}>Modifier</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.nomRoutine}>{r.nom}</Text>
        <Text style={styles.resume}>
          {pluriel(r.exercices.length, "exercice")} · {pluriel(nbSeries, "série")} · ≈ {minutes} min
        </Text>

        <CarteMuscles exercices={r.exercices} />

        {r.exercices.length === 0 ? (
          <Pressable onPress={modifier} style={styles.invite} accessibilityRole="button">
            <Text style={styles.inviteTexte}>Ajoute des exercices à cette routine</Text>
          </Pressable>
        ) : null}

        {r.exercices.length > 0 ? <Text style={styles.section}>Exercices</Text> : null}
        {r.exercices.map((ex, i) => (
          // L'index entre dans la clé : le même exercice peut figurer deux fois.
          <View key={`${ex.slug}-${i}`} style={styles.carte}>
            {ex.image ? (
              <Image
                source={{ uri: ex.image }}
                style={styles.vignette}
                contentFit="cover"
                cachePolicy="disk"
              />
            ) : (
              <View style={[styles.vignette, styles.sansImage]}>
                <Dumbbell size={22} color={couleurs.encreAttenuee} />
              </View>
            )}
            <View style={styles.texte}>
              <Text style={styles.exercice} numberOfLines={2}>
                {ex.nom}
              </Text>
              <Text style={styles.series}>{resumeSeries(ex.series, SYSTEME_UNITES)}</Text>
              {ex.reposSec ? (
                <Text style={styles.repos}>Repos {formaterRepos(ex.reposSec)}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* L'action de l'écran, fixée sous le pouce : l'aplat lime (D105). */}
      {seance ? null : (
        <View style={styles.pied}>
          <Pressable
            style={[styles.demarrer, ouverture !== null && { opacity: 0.6 }]}
            disabled={ouverture !== null || r.exercices.length === 0}
            onPress={() => void demarrer(r.id)}
            accessibilityRole="button"
          >
            <Text style={styles.demarrerTexte}>
              {ouverture !== null ? "Ouverture…" : "Démarrer la routine"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  modifier: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: espace.s,
  },
  modifierTexte: { color: couleurs.encreSecondaire, fontSize: 15, fontWeight: "600" },
  contenu: { padding: espace.l, gap: espace.m, paddingBottom: espace.xl },
  nomRoutine: { color: couleurs.encre, fontSize: 30, lineHeight: 34, fontWeight: "700" },
  resume: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1, marginTop: -espace.s },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: espace.s,
  },
  invite: {
    minHeight: CIBLE,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTexte: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  // Une ligne à filet, pas une carte : la page se lit comme le carnet de séance.
  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingVertical: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  // Fond blanc : les images du dataset sont dessinées sur blanc.
  vignette: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#ffffff" },
  sansImage: { alignItems: "center", justifyContent: "center", backgroundColor: couleurs.surface3 },
  texte: { flex: 1, gap: 2 },
  exercice: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  series: {
    color: couleurs.encreSecondaire,
    fontSize: taille.petit + 1,
    fontVariant: ["tabular-nums"],
  },
  repos: { color: couleurs.encreAttenuee, fontSize: taille.petit },
  pied: {
    padding: espace.l,
    paddingTop: espace.m,
    paddingBottom: espace.l,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
    backgroundColor: couleurs.canevas,
  },
  demarrer: {
    minHeight: CIBLE + 8,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  demarrerTexte: { color: couleurs.surAction, fontSize: taille.courant + 1, fontWeight: "700" },
}));
