import {
  dureeEstimeeSec,
  formaterCharge,
  formatJour,
  type RoutineResume,
  resumeSemaine,
  routineASuivre,
  type SeanceResume,
} from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LigneSeance } from "../../components/historique/ligne-seance";
import { Chargement, Erreur, Vide } from "../../components/ui/etats";
import { useDemarrer } from "../../lib/demarrer";
import { FUSEAU } from "../../lib/fuseau";
import { optionsRoutine, optionsRoutines, optionsSeances } from "../../lib/requetes";
import { useSeance } from "../../lib/seance";
import { CIBLE, creerStyles, espace, polices, rayon, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"] as const;

/**
 * L'Accueil (D110) répond aux trois questions qu'on se pose en ouvrant l'app :
 * où en est la semaine, quelle routine vient ensuite, ce qui s'est passé
 * dernièrement. Il porte le seul aplat de l'écran — démarrer (D105) — qui
 * disparaît pendant une séance : le bandeau la reprend (D107).
 */
export default function Accueil() {
  const styles = useStyles();
  const seances = useInfiniteQuery(optionsSeances());
  const routines = useQuery(optionsRoutines());
  const liste = seances.data?.pages.flatMap((p) => p.seances) ?? [];

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <FlatList
        data={liste}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <LigneSeance seance={item} />}
        // Tirer pour rafraîchir : une séance envoyée depuis un autre appareil.
        refreshing={seances.isRefetching && !seances.isFetchingNextPage}
        onRefresh={() => seances.refetch()}
        onEndReached={() => seances.hasNextPage && seances.fetchNextPage()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.contenu}
        ListHeaderComponent={
          <View>
            <Text style={styles.titre}>Accueil</Text>
            {liste.length > 0 ? <Semaine seances={liste} /> : null}
            <ASuivre routines={routines.data ?? null} seances={liste} />
            {liste.length > 0 ? <Text style={styles.section}>Dernières séances</Text> : null}
          </View>
        }
        ListEmptyComponent={
          // Hors ligne, la requête se met en pause au lieu d'échouer :
          // l'historique n'est pas gardé sur le téléphone (D96).
          seances.isPending && seances.fetchStatus === "paused" ? (
            <Vide titre="Hors ligne" message="Tes séances s'afficheront au retour du réseau." />
          ) : seances.isPending ? (
            <Chargement />
          ) : seances.isError ? (
            <Erreur
              message="L'historique n'a pas pu se charger."
              onReessayer={() => seances.refetch()}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

/** « Cette semaine » : séances, volume, et les sept jours dans le fuseau. */
function Semaine({ seances }: { seances: readonly SeanceResume[] }) {
  const styles = useStyles();
  const s = resumeSemaine(seances, new Date(), FUSEAU);
  return (
    <View style={styles.bloc}>
      <Text style={styles.section}>Cette semaine</Text>
      <View style={styles.chiffreLigne}>
        <Text style={styles.chiffre}>{s.seances}</Text>
        <Text style={styles.chiffreSous}>
          {s.seances > 1 ? "séances" : "séance"} · {formaterCharge(s.volumeKg, SYSTEME_UNITES)}
        </Text>
      </View>
      <View style={styles.jours}>
        {JOURS.map((lettre, i) => (
          <View key={`${lettre}-${i}`} style={styles.jour}>
            <View
              style={[
                styles.case,
                s.jours[i] && styles.caseEntrainee,
                i === s.aujourdhui && styles.caseAujourdhui,
              ]}
              accessibilityLabel={s.jours[i] ? "Jour entraîné" : "Jour sans séance"}
            />
            <Text style={[styles.lettre, i === s.aujourdhui && styles.lettreAujourdhui]}>
              {lettre}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * « À suivre » : la routine qui suit la dernière faite (D110), avec l'aplat
 * pour la démarrer. Sans routine, l'aplat démarre une séance tout court.
 */
function ASuivre({
  routines,
  seances,
}: {
  routines: readonly RoutineResume[] | null;
  seances: readonly SeanceResume[];
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { seance } = useSeance();
  const demarrer = useDemarrer();
  const suivante = routines ? routineASuivre(routines, seances) : null;
  // Le détail est déjà en cache (préchargé pour le hors ligne) : la durée vient sans attente.
  const detail = useQuery({ ...optionsRoutine(suivante?.id ?? ""), enabled: !!suivante });
  // Pendant une séance, le bandeau la reprend : pas d'aplat ici (D105, D107).
  if (seance) return null;

  if (!suivante) {
    return (
      <View style={styles.bloc}>
        <Text style={styles.premiere}>Ta première séance t'attend.</Text>
        <Text style={styles.premiereSous}>
          Démarre une routine préparée sur le web, ou une séance vide que tu remplis au fil de
          l'eau.
        </Text>
        <Pressable
          onPress={() => router.push("/demarrer")}
          style={({ pressed }) => [styles.aplat, pressed && styles.aplatAppuye]}
          accessibilityRole="button"
        >
          <Play size={20} color={couleurs.surAction} strokeWidth={2.4} />
          <Text style={styles.aplatTexte}>Démarrer une séance</Text>
        </Pressable>
      </View>
    );
  }

  const derniere = seances.find((s) => s.routineId === suivante.id);
  const minutes = detail.data
    ? Math.max(1, Math.round(dureeEstimeeSec(detail.data.exercices) / 60))
    : null;
  const enCours = demarrer.ouverture === suivante.id;

  return (
    <View style={[styles.bloc, styles.carte]}>
      <Text style={[styles.section, styles.sectionCarte]}>À suivre</Text>
      <Text style={styles.routine} numberOfLines={2}>
        {suivante.nom}
      </Text>
      <Text style={styles.meta}>
        {suivante.nbExercices} exercice{suivante.nbExercices > 1 ? "s" : ""} · {suivante.nbSeries}{" "}
        série{suivante.nbSeries > 1 ? "s" : ""}
        {minutes ? ` · ≈ ${minutes} min` : ""}
      </Text>
      {derniere ? (
        <Text style={styles.metaPale}>Dernière fois : {formatJour(derniere.debut, FUSEAU)}</Text>
      ) : null}
      <Pressable
        onPress={() => void demarrer.routine(suivante.id)}
        disabled={demarrer.ouverture !== null}
        style={({ pressed }) => [styles.aplat, (pressed || enCours) && styles.aplatAppuye]}
        accessibilityRole="button"
      >
        <Play size={20} color={couleurs.surAction} strokeWidth={2.4} />
        <Text style={styles.aplatTexte} numberOfLines={1}>
          Démarrer {suivante.nom}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/demarrer")}
        style={styles.tertiaire}
        accessibilityRole="button"
      >
        <Text style={styles.tertiaireTexte}>Autre routine ou séance vide</Text>
      </Pressable>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { paddingBottom: espace.xl },
  titre: {
    color: couleurs.encre,
    fontSize: taille.titre,
    fontWeight: "700",
    paddingHorizontal: espace.l,
    paddingTop: espace.l,
    paddingBottom: espace.s,
  },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: espace.l,
    marginTop: espace.l,
    marginBottom: espace.s,
  },
  bloc: { marginBottom: espace.s },
  // Dans la carte, l'étiquette suit la marge de la carte.
  sectionCarte: { paddingHorizontal: 0, marginBottom: espace.xs },
  chiffreLigne: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: espace.s,
    paddingHorizontal: espace.l,
  },
  // Le chiffre héros de l'écran (D103).
  chiffre: {
    color: couleurs.encre,
    fontSize: 64,
    lineHeight: 64,
    fontFamily: polices.condense,
    fontVariant: ["tabular-nums"],
  },
  chiffreSous: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  jours: {
    flexDirection: "row",
    gap: espace.xs,
    paddingHorizontal: espace.l,
    marginTop: espace.m,
  },
  jour: { flex: 1, alignItems: "center", gap: espace.xs },
  case: {
    alignSelf: "stretch",
    height: 32,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface2,
  },
  // Les jours entraînés en encre secondaire : pas de lime hors action et record.
  caseEntrainee: { backgroundColor: couleurs.encreSecondaire },
  caseAujourdhui: { borderWidth: 2, borderColor: couleurs.encre },
  lettre: { color: couleurs.encreAttenuee, fontSize: 11, fontWeight: "600" },
  lettreAujourdhui: { color: couleurs.encre, fontWeight: "800" },
  carte: {
    marginHorizontal: espace.l,
    marginTop: espace.m,
    paddingBottom: espace.l,
    paddingHorizontal: espace.l,
    borderRadius: rayon.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
    gap: espace.xs,
  },
  routine: {
    color: couleurs.encre,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
  },
  meta: { color: couleurs.encreSecondaire, fontSize: 14 },
  metaPale: { color: couleurs.encreTertiaire, fontSize: 13 },
  aplat: {
    minHeight: CIBLE + 4,
    marginTop: espace.m,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
    paddingHorizontal: espace.l,
  },
  aplatAppuye: { opacity: 0.85 },
  aplatTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "700" },
  tertiaire: { minHeight: CIBLE, alignItems: "center", justifyContent: "center" },
  tertiaireTexte: { color: couleurs.encreSecondaire, fontSize: 15, fontWeight: "600" },
  premiere: {
    color: couleurs.encre,
    fontSize: taille.grand + 4,
    fontWeight: "700",
    paddingHorizontal: espace.l,
    marginTop: espace.m,
  },
  premiereSous: {
    color: couleurs.encreSecondaire,
    fontSize: 15,
    paddingHorizontal: espace.l,
    marginTop: espace.xs,
  },
}));
