import { dureeEstimeeSec, type RoutineDetail, type RoutineResume } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { Text, View } from "react-native";
import { useDemarrer } from "../../lib/demarrer";
import { useSeance } from "../../lib/seance";
import { creerStyles, espace, rayon, taille } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";
import { BoutonContour } from "../ui/bouton-contour";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine de la liste (D121) : son nom, sa taille, ses exercices en une
 * phrase, et « Lancer » en contour. Le détail vient du cache (préchargé pour le
 * hors ligne) ; sans lui, la carte se contente du résumé.
 */
export function CarteRoutine({
  routine,
  detail,
  aSuivre,
}: {
  routine: RoutineResume;
  detail: RoutineDetail | undefined;
  aSuivre: boolean;
}) {
  const styles = useStyles();
  const router = useRouter();
  const { seance } = useSeance();
  const { routine: lancer, ouverture } = useDemarrer();
  const minutes = detail ? Math.max(1, Math.round(dureeEstimeeSec(detail.exercices) / 60)) : null;
  return (
    <Appuyable
      style={({ pressed }) => [styles.carte, pressed && styles.appuyee]}
      onPress={() => router.push(`/routines/${routine.id}`)}
      accessibilityRole="button"
      accessibilityHint="Ouvre la routine"
    >
      <View style={styles.tete}>
        <Text style={styles.nom} numberOfLines={1}>
          {routine.nom}
        </Text>
        {aSuivre ? (
          <View style={styles.puce}>
            <Text style={styles.puceTexte}>À suivre</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.meta}>
        {pluriel(routine.nbExercices, "exercice")} · {pluriel(routine.nbSeries, "série")}
        {minutes ? ` · ≈ ${minutes} min` : ""}
      </Text>
      {detail && detail.exercices.length > 0 ? (
        <Text style={styles.exercices} numberOfLines={2}>
          {detail.exercices.map((e) => e.nom).join(", ")}
        </Text>
      ) : null}
      {/* Pendant une séance, le bandeau la reprend (D107) : rien à lancer. */}
      {seance || routine.nbExercices === 0 ? null : (
        <View style={styles.actions}>
          <BoutonContour
            libelle="Lancer"
            icone={Play}
            occupe={ouverture === routine.id}
            onPress={() => void lancer(routine.id)}
          />
        </View>
      )}
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
  tete: { flexDirection: "row", alignItems: "center", gap: espace.s },
  nom: { flexShrink: 1, color: couleurs.encre, fontSize: 17, fontWeight: "700" },
  meta: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  exercices: { color: couleurs.encreTertiaire, fontSize: taille.petit, lineHeight: 18 },
  actions: { flexDirection: "row", marginTop: espace.s },
  // Une étiquette : contour neutre plein (D101).
  puce: {
    paddingHorizontal: espace.s,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
  },
  puceTexte: { color: couleurs.encreSecondaire, fontSize: 12, fontWeight: "600" },
}));
