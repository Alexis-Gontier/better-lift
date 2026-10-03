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
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../../lib/theme";
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
 * Une routine, façon opengym : ce qu'elle travaille d'abord, ses exercices
 * ensuite, et Démarrer toujours sous le pouce. Le crayon ouvre l'édition (D82).
 */
export default function DetailRoutine() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const routine = useQuery(optionsRoutine(id));
  const { routine: demarrer, ouverture } = useDemarrer();
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
        titre={r.nom}
        action={
          <Pressable
            onPress={modifier}
            style={styles.crayon}
            accessibilityRole="button"
            accessibilityLabel="Modifier la routine"
          >
            <Pencil size={22} color={couleurs.encre} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.resume}>
          {pluriel(r.exercices.length, "exercice")} · {pluriel(nbSeries, "série")} · ~{minutes} min
        </Text>

        <CarteMuscles exercices={r.exercices} />

        {r.exercices.length === 0 ? (
          <Pressable onPress={modifier} style={styles.invite} accessibilityRole="button">
            <Text style={styles.inviteTexte}>Ajoute des exercices à cette routine</Text>
          </Pressable>
        ) : null}

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

      {/* L'action de l'écran, fixée sous le pouce : l'aplat lime (D28). */}
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
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  crayon: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  contenu: { padding: espace.l, gap: espace.m, paddingBottom: espace.xl },
  resume: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1 },
  invite: {
    minHeight: CIBLE,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTexte: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    padding: espace.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  vignette: { width: 56, height: 56, borderRadius: 8, backgroundColor: couleurs.surface3 },
  sansImage: { alignItems: "center", justifyContent: "center" },
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
    // Le bouton central de la barre d'onglets déborde de 30 px au-dessus d'elle :
    // sans cette marge, il mordrait sur Démarrer.
    paddingBottom: espace.l + 30,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
    backgroundColor: couleurs.canevas,
  },
  demarrer: {
    minHeight: CIBLE + 8,
    borderRadius: 12,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  demarrerTexte: { color: couleurs.surAction, fontSize: taille.courant + 1, fontWeight: "700" },
}));
