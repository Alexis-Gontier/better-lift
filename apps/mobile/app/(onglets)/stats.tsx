import {
  formaterCharge,
  LIBELLE_RECORD,
  type RecordRecent,
  type Semaine,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteMuscles } from "../../components/routines/carte-muscles";
import { BadgeRecord, formaterSerie } from "../../components/ui/badge-record";
import { Chargement, Erreur, Vide } from "../../components/ui/etats";
import { FUSEAU } from "../../lib/fuseau";
import { optionsStats } from "../../lib/requetes";
import { CIBLE, creerStyles, espace, polices, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

const MOYENNE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const CALCUL = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: FUSEAU,
});

/**
 * Les statistiques (D112), calculées par l'API : le volume des 8 dernières
 * semaines, la régularité sur 12, les records récents, les muscles travaillés.
 * Aucune couleur hors du système : les barres et la grille sont en encre, le
 * lime reste aux records et à la carte du corps.
 */
export default function Stats() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const stats = useQuery(optionsStats());

  const contenu =
    stats.isPending && stats.fetchStatus === "paused" ? (
      <Vide titre="Hors ligne" message="Les stats se calculeront au retour du réseau." />
    ) : stats.isPending ? (
      <Chargement />
    ) : stats.isError && !stats.data ? (
      <Erreur message="Les stats n'ont pas pu se calculer." onReessayer={() => stats.refetch()} />
    ) : stats.data.nbSeances < 2 ? (
      <Vide
        titre="Encore un peu de patience."
        message="Les courbes apparaissent après deux séances. Tes records, dès la première."
      />
    ) : null;

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          Stats
        </Text>
        <Text style={styles.periode}>12 dernières semaines</Text>
      </View>
      {contenu ?? (
        <ScrollView
          contentContainerStyle={styles.contenu}
          refreshControl={
            <RefreshControl
              refreshing={stats.isRefetching}
              onRefresh={() => stats.refetch()}
              tintColor={couleurs.encreTertiaire}
            />
          }
        >
          {stats.data ? (
            <>
              <Volume semaines={stats.data.semaines.slice(-8)} />
              <Regularite semaines={stats.data.semaines} />
              <RecordsRecents records={stats.data.recordsRecents} />
              {stats.data.muscles.length > 0 ? (
                <CarteMuscles
                  exercices={stats.data.muscles}
                  titre="Muscles travaillés · 4 dernières semaines"
                />
              ) : null}
              {/* Hors ligne, l'écran montre la dernière lecture : sa date le dit (D112). */}
              <Text style={styles.legende}>Calculées le {CALCUL.format(stats.dataUpdatedAt)}</Text>
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** Le volume de la semaine en chiffre héros, puis 8 barres : la semaine en cours en encre. */
function Volume({ semaines }: { semaines: Semaine[] }) {
  const styles = useStyles();
  const max = Math.max(1, ...semaines.map((s) => s.volumeKg));
  const enCours = semaines.at(-1);
  return (
    <View>
      <Text style={styles.section} accessibilityRole="header">
        Volume par semaine
      </Text>
      <View style={styles.chiffreLigne}>
        <Text style={styles.chiffre}>
          {formaterCharge(enCours?.volumeKg ?? 0, SYSTEME_UNITES).replace(/\s?kg$/, "")}
        </Text>
        <Text style={styles.chiffreSous}>kg cette semaine</Text>
      </View>
      <View
        style={styles.barres}
        accessible
        accessibilityLabel={`Volume des 8 dernières semaines : ${semaines
          .map((s) => formaterCharge(s.volumeKg, SYSTEME_UNITES))
          .join(", ")}`}
      >
        {semaines.map((s, i) => (
          <View key={s.lundi} style={styles.colonne}>
            <View
              style={[
                styles.barre,
                i === semaines.length - 1 && styles.barreEnCours,
                // Une semaine vide garde un trait : l'absence se voit.
                { height: `${Math.max(3, (s.volumeKg / max) * 100)}%` },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Douze colonnes de sept jours : un carré rempli par jour entraîné. */
function Regularite({ semaines }: { semaines: Semaine[] }) {
  const styles = useStyles();
  const total = semaines.reduce((n, s) => n + s.seances, 0);
  return (
    <View>
      <Text style={styles.section} accessibilityRole="header">
        Régularité · 12 semaines
      </Text>
      <View style={styles.grille}>
        {semaines.map((s) => (
          <View key={s.lundi} style={styles.grilleColonne}>
            {s.jours.map((fait, j) => (
              <View key={`${s.lundi}-${j}`} style={[styles.carre, fait && styles.carreFait]} />
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.legende}>
        {MOYENNE.format(total / Math.max(1, semaines.length))} séance
        {total / semaines.length >= 2 ? "s" : ""} par semaine en moyenne
      </Text>
    </View>
  );
}

function RecordsRecents({ records }: { records: RecordRecent[] }) {
  const styles = useStyles();
  if (records.length === 0) return null;
  return (
    <View>
      <Text style={styles.section} accessibilityRole="header">
        Records récents
      </Text>
      {records.map((r) => (
        <View key={`${r.slug}-${r.date}`} style={styles.record}>
          <View style={styles.recordGauche}>
            <Text style={styles.recordNom} numberOfLines={2}>
              {r.nom}
            </Text>
            <BadgeRecord libelle={r.types.map((t) => LIBELLE_RECORD[t]).join(" · ")} />
          </View>
          <Text style={styles.recordValeur}>{formaterSerie(r.chargeKg, r.reps)}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  entete: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    padding: espace.l,
  },
  titre: { color: couleurs.encre, fontSize: taille.titre, fontWeight: "700" },
  periode: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  contenu: { paddingHorizontal: espace.l, paddingBottom: espace.xxl, gap: espace.l },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: espace.s,
  },
  chiffreLigne: { flexDirection: "row", alignItems: "baseline", gap: espace.s },
  chiffre: {
    color: couleurs.encre,
    fontSize: 64,
    lineHeight: 64,
    fontFamily: polices.condense,
    fontVariant: ["tabular-nums"],
  },
  chiffreSous: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  barres: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: espace.s,
    marginTop: espace.m,
  },
  colonne: { flex: 1, height: "100%", justifyContent: "flex-end" },
  barre: { borderRadius: 6, backgroundColor: couleurs.surface3 },
  barreEnCours: { backgroundColor: couleurs.encre },
  grille: { flexDirection: "row", gap: 4 },
  grilleColonne: { flex: 1, gap: 4 },
  carre: { aspectRatio: 1.6, borderRadius: 3, backgroundColor: couleurs.surface2 },
  carreFait: { backgroundColor: couleurs.encreSecondaire },
  legende: { color: couleurs.encreTertiaire, fontSize: taille.petit, marginTop: espace.s },
  record: {
    minHeight: CIBLE + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  recordGauche: { flex: 1, gap: espace.xs, paddingVertical: espace.s },
  recordNom: { color: couleurs.encre, fontSize: 15, fontWeight: "600" },
  recordValeur: {
    color: couleurs.encre,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
}));
