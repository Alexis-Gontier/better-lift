import { dureeEstimeeSec, type RoutineDetail, type RoutineResume } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { affiche, creerStyles, espace, rayon, taille } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine de la liste (D171) : son nom, sa taille, ses exercices en une
 * phrase. La carte ouvre la routine, dont la page lance ; la prochaine se lance
 * en tête de l'onglet (D179) — un chemin par action. Le détail vient du cache (préchargé pour le hors
 * ligne) ; sans lui, la carte se contente du résumé.
 */
export function CarteRoutine({
  routine,
  detail,
}: {
  routine: RoutineResume;
  detail: RoutineDetail | undefined;
}) {
  const styles = useStyles();
  const router = useRouter();
  const minutes = detail ? Math.max(1, Math.round(dureeEstimeeSec(detail.exercices) / 60)) : null;
  return (
    <Appuyable
      style={({ pressed }) => [styles.carte, pressed && styles.appuyee]}
      onPress={() => router.push(`/routines/${routine.id}`)}
      accessibilityRole="button"
      accessibilityHint="Ouvre la routine"
    >
      <Text style={styles.nom} numberOfLines={1}>
        {routine.nom}
      </Text>
      <Text style={styles.meta}>
        {pluriel(routine.nbExercices, "exercice")} · {pluriel(routine.nbSeries, "série")}
        {minutes ? ` · ≈ ${minutes} min` : ""}
      </Text>
      {detail && detail.exercices.length > 0 ? (
        <Text style={styles.exercices} numberOfLines={2}>
          {detail.exercices.map((e) => e.nom).join(", ")}
        </Text>
      ) : null}
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    gap: espace.xs,
    padding: espace.l,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.surface1,
  },
  appuyee: { backgroundColor: couleurs.surface2 },
  nom: { ...affiche, color: couleurs.encre, fontSize: 24 },
  meta: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  exercices: { color: couleurs.encreTertiaire, fontSize: taille.petit, lineHeight: 18 },
}));
