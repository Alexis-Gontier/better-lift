import { formaterCharge, joursDeLaSemaine } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { optionsPreferences, optionsStatsPeriode } from "../../lib/requetes";
import { libelleMinutes } from "../../lib/temps";
import { CIBLE, creerStyles, espace, rayon, taille } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { Appuyable } from "../ui/appuyable";
import { BadgeRecord, formaterSerie } from "../ui/badge-record";

const LETTRES = ["L", "M", "M", "J", "V", "S", "D"] as const;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** « +8 % », « −4 % », « = » ; rien sans semaine d'avant. */
function ecart(actuel: number, avant: number): string | null {
  if (avant <= 0) return null;
  const pct = Math.round(((actuel - avant) / avant) * 100);
  return pct === 0 ? "=" : `${pct > 0 ? "+" : "−"}${Math.abs(pct)} %`;
}

/**
 * « Cette semaine » (D166) : la réponse à « j'en suis où ? » en un bloc. Les
 * sept jours (entraînés en orange : une intensité, comme le calendrier, D162),
 * l'objectif, puis volume, séries et durée comparés à la semaine d'avant. Les
 * stats de la semaine sont gardées hors ligne ; sans elles, le bloc se tait.
 */
export function CetteSemaine() {
  const styles = useStyles();
  const router = useRouter();
  const stats = useQuery(optionsStatsPeriode("semaine"));
  const preferences = useQuery(optionsPreferences());
  if (!stats.data) return null;

  const { totaux, precedents, records } = stats.data;
  const objectif = preferences.data?.objectifHebdo ?? null;
  const jours = joursDeLaSemaine(stats.data.premierLundi, stats.data.jours, new Date(), FUSEAU);
  const compte = objectif
    ? `${totaux.seances} / ${pluriel(objectif, "séance")}`
    : pluriel(totaux.seances, "séance");
  const ecartVolume = ecart(totaux.volumeKg, precedents.volumeKg);
  const record = records[0];

  return (
    <View style={styles.carte}>
      <View style={styles.tete}>
        <Text style={styles.titre} accessibilityRole="header">
          Cette semaine
        </Text>
        <Text style={styles.compte}>{compte}</Text>
      </View>

      <View
        style={styles.jours}
        accessible
        accessibilityLabel={`Jours entraînés : ${
          jours
            .filter((j) => j.entraine)
            .map((j) => LETTRES[jours.indexOf(j)])
            .join(", ") || "aucun"
        }`}
      >
        {jours.map((j, i) => (
          <View key={j.jour} style={styles.jour}>
            <View
              style={[
                styles.case,
                j.entraine && styles.entraine,
                j.avenir && styles.avenir,
                j.aujourdhui && styles.aujourdhui,
              ]}
            />
            <Text style={[styles.lettre, j.aujourdhui && styles.lettreAujourdhui]}>
              {LETTRES[i]}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.chiffres}>
        <Text style={styles.chiffre}>
          {formaterCharge(totaux.volumeKg, SYSTEME_UNITES)}
          {ecartVolume ? <Text style={styles.ecart}> {ecartVolume}</Text> : null}
        </Text>
        <Text style={styles.chiffre}>{pluriel(totaux.series, "série")}</Text>
        <Text style={styles.chiffre}>{libelleMinutes(totaux.dureeMin)}</Text>
      </View>

      {record ? (
        <Appuyable
          style={styles.record}
          onPress={() => router.push(`/exercices/${record.slug}`)}
          accessibilityRole="button"
          accessibilityLabel={`Dernier record : ${record.nom}, ${formaterSerie(record.chargeKg, record.reps)}`}
        >
          <Text style={styles.recordLibelle}>Dernier record</Text>
          <View style={styles.recordBadge}>
            <BadgeRecord
              libelle={`${record.nom} · ${formaterSerie(record.chargeKg, record.reps)}`}
            />
          </View>
        </Appuyable>
      ) : null}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    gap: espace.m,
    padding: espace.l,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.surface1,
  },
  tete: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  titre: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  compte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  jours: { flexDirection: "row", gap: espace.xs },
  jour: { flex: 1, alignItems: "center", gap: espace.xs },
  case: {
    alignSelf: "stretch",
    height: 28,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface3,
  },
  entraine: { backgroundColor: couleurs.calendrier[4] },
  avenir: { backgroundColor: "transparent", borderWidth: 1, borderColor: couleurs.ligneForte },
  aujourdhui: { borderWidth: 2, borderColor: couleurs.encre },
  lettre: { color: couleurs.encreAttenuee, fontSize: 12, fontWeight: "600" },
  lettreAujourdhui: { color: couleurs.encre },
  chiffres: { flexDirection: "row", justifyContent: "space-between", gap: espace.s },
  chiffre: { color: couleurs.encre, fontSize: taille.petit + 1, fontWeight: "700" },
  ecart: { color: couleurs.encreTertiaire, fontWeight: "500" },
  record: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingTop: espace.s,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
  },
  recordLibelle: { color: couleurs.encreSecondaire, fontSize: taille.petit, fontWeight: "600" },
  recordBadge: { flex: 1, alignItems: "flex-end" },
}));
