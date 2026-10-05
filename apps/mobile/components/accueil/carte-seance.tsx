import { formaterCharge, formatJour, type SeanceFil } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { dureeMin } from "../../lib/temps";
import { creerStyles, espace, rayon, taille } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { Appuyable } from "../ui/appuyable";
import { BadgeRecord, formaterSerie } from "../ui/badge-record";
import { Tuile } from "../ui/tuile";
import { Vignette } from "../ui/vignette";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une séance du fil (D119), façon Hevy : on la relit sans l'ouvrir. Ses
 * chiffres, puis ses premiers exercices avec leur meilleure série. L'appui
 * ouvre son détail.
 */
export function CarteSeance({ seance }: { seance: SeanceFil }) {
  const styles = useStyles();
  const router = useRouter();
  const duree = `${dureeMin(seance)} min`;
  const volume = formaterCharge(seance.volumeKg, SYSTEME_UNITES);
  const reste = seance.nbExercices - seance.apercu.length;
  return (
    <Appuyable
      style={({ pressed }) => [styles.carte, pressed && styles.appuyee]}
      onPress={() => router.push(`/historique/${seance.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${seance.nom}, ${formatJour(seance.debut, FUSEAU)} : ${duree}, ${volume}, ${pluriel(seance.seriesFaites, "série")}${seance.nbRecords > 0 ? `, ${pluriel(seance.nbRecords, "record")}` : ""}`}
    >
      <View style={styles.tete}>
        <View style={styles.titre}>
          <Text style={styles.nom} numberOfLines={1}>
            {seance.nom}
          </Text>
          {/* Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66). */}
          <Text style={styles.jour}>{formatJour(seance.debut, FUSEAU)}</Text>
        </View>
        {seance.nbRecords > 0 ? (
          <BadgeRecord libelle={pluriel(seance.nbRecords, "record")} />
        ) : null}
      </View>

      <View style={styles.tuiles}>
        <Tuile libelle="Durée" valeur={duree} />
        <Tuile libelle="Volume" valeur={volume} />
        <Tuile libelle="Séries" valeur={String(seance.seriesFaites)} />
      </View>

      {seance.apercu.length > 0 ? (
        <View style={styles.exercices}>
          {seance.apercu.map((e, i) => (
            <View key={`${e.slug}-${i}`} style={styles.exercice}>
              <Vignette image={e.image} />
              <Text style={styles.exerciceNom} numberOfLines={1}>
                {e.nbSeries > 0 ? `${e.nbSeries} × ` : ""}
                {e.nom}
              </Text>
              {e.meilleure ? (
                <Text style={styles.meilleure}>
                  {formaterSerie(e.meilleure.chargeKg, e.meilleure.reps)}
                </Text>
              ) : null}
            </View>
          ))}
          {reste > 0 ? <Text style={styles.reste}>+ {pluriel(reste, "exercice")}</Text> : null}
        </View>
      ) : null}
    </Appuyable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    gap: espace.m,
    padding: espace.l,
    borderRadius: rayon.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  appuyee: { backgroundColor: couleurs.surface2 },
  tete: { flexDirection: "row", alignItems: "flex-start", gap: espace.s },
  titre: { flex: 1, gap: 2 },
  nom: { color: couleurs.encre, fontSize: 17, fontWeight: "700" },
  jour: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  tuiles: { flexDirection: "row", gap: espace.m },
  exercices: {
    gap: espace.s,
    paddingTop: espace.m,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
  },
  exercice: { flexDirection: "row", alignItems: "center", gap: espace.m },
  exerciceNom: { flex: 1, color: couleurs.encreSecondaire, fontSize: 14 },
  meilleure: {
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    fontVariant: ["tabular-nums"],
  },
  reste: { color: couleurs.encreTertiaire, fontSize: taille.petit },
}));
