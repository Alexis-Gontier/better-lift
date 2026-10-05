import {
  ABREGE_TYPE_SERIE,
  formaterCharge,
  formatJour,
  LIBELLE_RECORD,
  type TypeSerie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appuyable } from "../../../components/ui/appuyable";
import { BadgeRecord, formaterSerie } from "../../../components/ui/badge-record";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { FUSEAU } from "../../../lib/fuseau";
import { optionsSeance } from "../../../lib/requetes";
import { dureeMin } from "../../../lib/temps";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

/** Comme en séance (D92) : les normales se numérotent entre elles, les autres portent leur lettre. */
function etiquettes(series: readonly { type: TypeSerie }[]): string[] {
  let n = 0;
  return series.map((s) => (s.type === "NORMALE" ? String(++n) : ABREGE_TYPE_SERIE[s.type]));
}

/**
 * Une séance passée, comme une page du carnet : chaque exercice, ses séries
 * dans l'ordre, et le badge des records qu'elles ont battus à ce moment-là
 * (D64). L'historique n'est pas gardé sur le téléphone (D96) : hors ligne, la
 * page attend le réseau.
 */
export default function DetailSeance() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const seance = useQuery(optionsSeance(id));

  if (!seance.data) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {seance.isPending && seance.fetchStatus === "paused" ? (
          <Vide titre="Hors ligne" message="Cette séance s'affichera au retour du réseau." />
        ) : seance.isPending ? (
          <Chargement />
        ) : (
          <Erreur
            message="Cette séance n'a pas pu être chargée."
            onReessayer={() => seance.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const s = seance.data;
  const libelles = s.exercices.map((ex) => etiquettes(ex.series));
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour titre="" />
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.tete}>
          <Text style={styles.nom}>{s.nom}</Text>
          <Text style={styles.date}>{formatJour(s.debut, FUSEAU)}</Text>
        </View>
        <View style={styles.bilan}>
          <Chiffre valeur={`${dureeMin(s)} min`} libelle="durée" />
          <Chiffre valeur={formaterCharge(s.volumeKg, SYSTEME_UNITES)} libelle="volume" />
          <Chiffre
            valeur={String(s.seriesFaites)}
            libelle={s.seriesFaites > 1 ? "séries" : "série"}
          />
        </View>

        {s.exercices.map((ex, iE) => (
          <View key={`${ex.slug}-${iE}`} style={styles.exercice}>
            {/* La fiche porte les records de l'exercice (D95). */}
            <Appuyable
              onPress={() => router.push(`/exercices/${ex.slug}`)}
              style={styles.titreExercice}
              accessibilityRole="link"
              accessibilityHint="Ouvre la fiche de l'exercice"
            >
              <Text style={styles.nomExercice} numberOfLines={2}>
                {ex.nom}
              </Text>
              <ChevronRight size={20} color={couleurs.encreTertiaire} />
            </Appuyable>
            {/* La note prise en séance (D90). */}
            {ex.note ? <Text style={styles.note}>{ex.note}</Text> : null}
            {ex.series.map((serie, i) => (
              <View
                key={`${ex.slug}-${iE}-${i}`}
                // Une série non faite reste visible — c'était prévu, pas fait —
                // mais s'efface derrière celles qui comptent.
                style={[styles.serie, !serie.faite && styles.nonFaite]}
              >
                <Text style={styles.numero}>{libelles[iE]?.[i]}</Text>
                <Text style={styles.valeur}>{formaterSerie(serie.chargeKg, serie.reps)}</Text>
                {serie.records.length > 0 ? (
                  <BadgeRecord libelle={serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")} />
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chiffre}>
      <Text style={styles.chiffreValeur}>{valeur}</Text>
      <Text style={styles.chiffreLibelle}>{libelle}</Text>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { padding: espace.l, gap: espace.l, paddingBottom: espace.xxl * 2 },
  tete: { gap: espace.xs },
  nom: { color: couleurs.encre, fontSize: 30, lineHeight: 34, fontWeight: "700" },
  date: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  bilan: {
    flexDirection: "row",
    paddingVertical: espace.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: couleurs.ligne,
  },
  chiffre: { flex: 1, gap: 2 },
  chiffreValeur: {
    color: couleurs.encre,
    fontSize: taille.grand,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chiffreLibelle: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  exercice: { gap: 2 },
  titreExercice: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
  },
  nomExercice: { flex: 1, color: couleurs.encre, fontSize: 17, fontWeight: "700" },
  note: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1, marginBottom: espace.xs },
  serie: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: espace.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  nonFaite: { opacity: 0.45 },
  numero: {
    width: 20,
    color: couleurs.encreAttenuee,
    fontSize: taille.petit,
    fontWeight: "600",
    textAlign: "center",
  },
  valeur: {
    flex: 1,
    color: couleurs.encre,
    fontSize: taille.courant,
    fontVariant: ["tabular-nums"],
  },
}));
