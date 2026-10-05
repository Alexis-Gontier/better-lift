import {
  dureeEstimeeSec,
  formatJour,
  LIBELLE_ZONE,
  type RoutineResume,
  routineASuivre,
  type SeanceResume,
  zonesTravaillees,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { Text, View } from "react-native";
import { useDemarrer } from "../../lib/demarrer";
import { FUSEAU } from "../../lib/fuseau";
import { optionsRoutine } from "../../lib/requetes";
import { useSeance } from "../../lib/seance";
import { creerStyles, espace, rayon, taille } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";
import { BoutonContour } from "../ui/bouton-contour";
import { Section } from "../ui/section";

/**
 * « À suivre » (D119) : la routine qui suit la dernière faite. Neutre : l'aplat
 * de l'écran est le rond central (D105) ; « Lancer » est en contour (D118). La
 * carte ouvre la routine.
 */
export function ASuivre({
  routines,
  seances,
}: {
  routines: readonly RoutineResume[] | null;
  seances: readonly SeanceResume[];
}) {
  const styles = useStyles();
  const router = useRouter();
  const { seance } = useSeance();
  const { routine, ouverture } = useDemarrer();
  const suivante = routines ? routineASuivre(routines, seances) : null;
  // Le détail est déjà en cache (préchargé pour le hors ligne) : muscles et durée viennent sans attente.
  const detail = useQuery({ ...optionsRoutine(suivante?.id ?? ""), enabled: !!suivante });
  // Pendant une séance, le bandeau la reprend (D107).
  if (seance) return null;

  if (!suivante) {
    return (
      <View style={styles.premiere}>
        <Text style={styles.premiereTitre}>Ta première séance t'attend.</Text>
        <Text style={styles.premiereSous}>
          Le bouton Démarrer, en bas, lance une routine ou une séance vide.
        </Text>
      </View>
    );
  }

  const derniere = seances.find((s) => s.routineId === suivante.id);
  const zones = detail.data
    ? zonesTravaillees(detail.data.exercices)
        .filter((z) => z.niveau === "principal")
        .slice(0, 3)
        .map((z) => LIBELLE_ZONE[z.zone])
    : [];
  const minutes = detail.data
    ? Math.max(1, Math.round(dureeEstimeeSec(detail.data.exercices) / 60))
    : null;
  const resume = [zones.join(" · "), minutes ? `≈ ${minutes} min` : ""].filter(Boolean).join(" — ");

  return (
    <Appuyable
      onPress={() => router.push(`/routines/${suivante.id}`)}
      style={({ pressed }) => [styles.carte, pressed && styles.appuyee]}
      accessibilityRole="button"
      accessibilityHint="Ouvre la routine"
    >
      <Section titre="À suivre" />
      <Text style={styles.nom} numberOfLines={2}>
        {suivante.nom}
      </Text>
      {resume ? <Text style={styles.resume}>{resume}</Text> : null}
      {derniere ? (
        <Text style={styles.pale}>Dernière fois : {formatJour(derniere.debut, FUSEAU)}</Text>
      ) : null}
      <View style={styles.actions}>
        <BoutonContour
          libelle="Lancer"
          icone={Play}
          occupe={ouverture === suivante.id}
          onPress={() => void routine(suivante.id)}
        />
      </View>
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    gap: espace.xs,
    padding: espace.l,
    borderRadius: rayon.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  appuyee: { backgroundColor: couleurs.surface2 },
  nom: { color: couleurs.encre, fontSize: 30, lineHeight: 34, fontWeight: "700" },
  resume: { color: couleurs.encreSecondaire, fontSize: 14 },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  actions: { flexDirection: "row", marginTop: espace.m },
  premiere: { gap: espace.xs },
  premiereTitre: { color: couleurs.encre, fontSize: taille.grand + 4, fontWeight: "700" },
  premiereSous: { color: couleurs.encreSecondaire, fontSize: 15 },
}));
