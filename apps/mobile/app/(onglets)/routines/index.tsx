import { dureeEstimeeSec, type RoutineResume, routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Play, Plus } from "lucide-react-native";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteRoutine } from "../../../components/routines/carte-routine";
import { Appuyable } from "../../../components/ui/appuyable";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { Section } from "../../../components/ui/section";
import { useDemarrer } from "../../../lib/demarrer";
import { optionsRoutine, optionsRoutines, optionsSeances } from "../../../lib/requetes";
import { useSeance } from "../../../lib/seance";
import {
  affiche,
  CIBLE,
  creerStyles,
  espace,
  rayon,
  taille,
  useCouleurs,
} from "../../../lib/theme";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * L'onglet Entraînement (D179), façon Hevy : démarrer en tête — la routine à
 * suivre et son aplat, la séance vide —, puis mes routines. Pendant une séance,
 * la tête ne propose plus que de la reprendre. La carte ouvre la routine.
 */
export default function Entrainement() {
  const styles = useStyles();
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  // Les détails sont en cache (préchargés pour le hors ligne) : noms et durée sans attente.
  const details = useQueries({
    queries: (routines.data ?? []).map((r) => optionsRoutine(r.id)),
  });
  const suivante = routines.data
    ? routineASuivre(routines.data, seances.data?.pages.flatMap((p) => p.seances) ?? [])
    : null;

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <FlatList
        data={routines.data ?? []}
        keyExtractor={(r) => r.id}
        refreshing={routines.isRefetching}
        onRefresh={() => routines.refetch()}
        contentContainerStyle={styles.liste}
        ItemSeparatorComponent={Intervalle}
        ListHeaderComponent={<Tete suivante={suivante} />}
        renderItem={({ item, index }) => (
          <CarteRoutine routine={item} detail={details[index]?.data} />
        )}
        ListEmptyComponent={
          routines.isPending && routines.fetchStatus === "paused" ? (
            <Vide titre="Hors ligne" message="Les routines apparaîtront au retour du réseau." />
          ) : routines.isPending ? (
            <Chargement />
          ) : routines.isError && !routines.data ? (
            <Erreur
              message="Les routines n'ont pas pu se charger."
              onReessayer={() => routines.refetch()}
            />
          ) : (
            <Vide
              titre="Pas encore de routine."
              message="Crée-en une ici avec « Nouvelle », ou sur le web."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

/** Le titre, le bloc Démarrer, puis l'en-tête de « Mes routines ». */
function Tete({ suivante }: { suivante: RoutineResume | null }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  return (
    <View style={styles.tete}>
      <Text style={styles.titre} accessibilityRole="header">
        Entraînement
      </Text>
      <Demarrer suivante={suivante} />
      <View style={styles.enteteRoutines}>
        <Section titre="Mes routines" />
        {/* Le mobile crée ses routines sans le web (D82). Secondaire : l'aplat
            de l'écran est celui de Démarrer. */}
        <Appuyable
          onPress={() => router.push("/routine-edition")}
          style={({ pressed }) => [styles.nouvelle, pressed && styles.appuye]}
          accessibilityRole="button"
        >
          <Plus size={18} color={couleurs.encre} strokeWidth={2.4} />
          <Text style={styles.nouvelleTexte}>Nouvelle</Text>
        </Appuyable>
      </View>
    </View>
  );
}

/**
 * Démarrer (D179, reprend la feuille D120) : la routine à suivre et son aplat —
 * deux appuis pour le cas courant —, puis la séance vide. Une séance en cours
 * remplace tout par « Reprendre » : démarrer n'écrase jamais une séance (§ 8).
 */
function Demarrer({ suivante }: { suivante: RoutineResume | null }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { seance } = useSeance();
  const { vide, routine, ouverture } = useDemarrer();
  // Le détail est en cache (préchargé pour le hors ligne) : la durée vient sans attente.
  const detail = useQuery({ ...optionsRoutine(suivante?.id ?? ""), enabled: !!suivante });
  const minutes = detail.data
    ? Math.max(1, Math.round(dureeEstimeeSec(detail.data.exercices) / 60))
    : null;

  if (seance) {
    return (
      <View style={styles.carte}>
        <Text style={styles.nomCarte} numberOfLines={2}>
          {seance.nom}
        </Text>
        <Text style={styles.pale}>Séance en cours</Text>
        <Appuyable
          style={styles.aplat}
          onPress={() => router.push("/seance")}
          accessibilityRole="button"
        >
          <Play size={18} color={couleurs.surAction} fill={couleurs.surAction} />
          <Text style={styles.aplatTexte}>Reprendre la séance</Text>
        </Appuyable>
      </View>
    );
  }

  return (
    <View style={styles.demarrer}>
      {suivante ? (
        <View style={styles.carte}>
          <Text style={styles.nomCarte} numberOfLines={2}>
            {suivante.nom}
          </Text>
          <Text style={styles.pale}>
            Ta prochaine séance · {pluriel(suivante.nbExercices, "exercice")}
            {minutes ? ` · ≈ ${minutes} min` : ""}
          </Text>
          <Appuyable
            style={styles.aplat}
            onPress={() => void routine(suivante.id)}
            disabled={ouverture !== null}
            accessibilityRole="button"
          >
            {ouverture === suivante.id ? (
              <ActivityIndicator color={couleurs.surAction} />
            ) : (
              <>
                <Play size={18} color={couleurs.surAction} fill={couleurs.surAction} />
                <Text style={styles.aplatTexte} numberOfLines={1}>
                  Commencer {suivante.nom}
                </Text>
              </>
            )}
          </Appuyable>
        </View>
      ) : null}
      <Appuyable
        style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
        onPress={() => void vide()}
        accessibilityRole="button"
      >
        <View style={styles.texte}>
          <Text style={styles.nomLigne}>Séance vide</Text>
          <Text style={styles.pale}>Ajoute tes exercices au fil de la séance.</Text>
        </View>
        <View style={styles.icone}>
          <Plus size={18} color={couleurs.encre} />
        </View>
      </Appuyable>
    </View>
  );
}

function Intervalle() {
  return <View style={{ height: espace.m }} />;
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  liste: { paddingHorizontal: espace.l, paddingBottom: espace.xl },
  tete: { gap: espace.m, paddingBottom: espace.m },
  titre: { ...affiche, color: couleurs.encre, fontSize: taille.titre, paddingTop: espace.l },
  demarrer: { gap: espace.s },
  carte: {
    gap: espace.xs,
    padding: espace.l,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.surface1,
  },
  nomCarte: { ...affiche, color: couleurs.encre, fontSize: 24 },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  aplat: {
    minHeight: 52,
    marginTop: espace.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
    paddingHorizontal: espace.l,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
  },
  aplatTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "800" },
  ligne: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.xs,
    borderRadius: rayon.bouton,
  },
  texte: { flex: 1 },
  nomLigne: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  icone: {
    width: CIBLE - 8,
    height: CIBLE - 8,
    borderRadius: rayon.cellule,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  enteteRoutines: {
    marginTop: espace.l,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nouvelle: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.xs,
    paddingHorizontal: espace.m,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  nouvelleTexte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  appuye: { backgroundColor: couleurs.surface2 },
}));
