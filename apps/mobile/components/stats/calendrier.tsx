import { cleJour, niveauxCalendrier, type StatsPeriode, semainesTenues } from "@better-lift/shared";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { FUSEAU } from "../../lib/fuseau";
import { creerStyles, espace, taille, useCouleurs } from "../../lib/theme";
import { Appuyable } from "../ui/appuyable";
import { Section } from "../ui/section";

const JOUR_MS = 86_400_000;
const LETTRES = ["L", "M", "M", "J", "V", "S", "D"] as const;
const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const MOYENNE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
/** Au-delà de 13 semaines, des cases fixes qui défilent : à pleine largeur, elles seraient des points. */
const CASE_ANNEE = 14;
const CASE_MAX = 30;
const ECART = 3;
const LARGEUR_LETTRES = 14;

/** « Objectif tenu 3 / 4 semaines », sinon la moyenne par semaine. */
function enTete(stats: StatsPeriode, objectif: number | null, moyenne: number): string {
  if (!objectif) return `${MOYENNE.format(moyenne)} séance / semaine`;
  const { tenues, sur } = semainesTenues(stats.volumes, objectif);
  if (sur === 0) return `Objectif : ${objectif} / semaine`;
  return `Objectif tenu ${tenues} / ${sur} semaine${sur > 1 ? "s" : ""}`;
}

const versCle = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * La régularité façon GitHub (D126) : une colonne par semaine, une ligne par
 * jour, l'intensité selon le volume du jour (quartiles de la période), aujourd'hui
 * cerclé. Toucher un jour ouvre sa séance. La semaine seule se lit en ligne.
 */
export function Calendrier({
  stats,
  objectif,
}: {
  stats: StatsPeriode;
  /** L'objectif hebdomadaire du compte (D128) : l'en-tête dit les semaines tenues. */
  objectif: number | null;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const niveaux = niveauxCalendrier(stats.jours);
  const parJour = new Map(stats.jours.map((j) => [j.jour, j]));
  const aujourdhui = cleJour(new Date().toISOString(), FUSEAU);
  const premierMs = Date.parse(`${stats.premierLundi}T00:00:00.000Z`);
  const semaines = Array.from({ length: stats.nbSemaines }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => versCle(premierMs + (w * 7 + d) * JOUR_MS)),
  );
  const moyenne = stats.totaux.seances / stats.nbSemaines;
  const fixe = stats.nbSemaines > 13;
  // La case se taille sur la largeur : toutes les semaines tiennent, sauf l'année qui défile.
  const [largeur, setLargeur] = useState(0);
  const cote = fixe
    ? CASE_ANNEE
    : Math.min(
        CASE_MAX,
        Math.floor((largeur - LARGEUR_LETTRES - stats.nbSemaines * ECART) / stats.nbSemaines),
      );

  const caseJour = (jour: string, style: object) => {
    const avenir = jour > aujourdhui;
    const j = parJour.get(jour);
    const niveau = niveaux.get(jour) ?? 0;
    const seance = j?.seances[0];
    return (
      <Appuyable
        key={jour}
        disabled={!seance}
        onPress={() => seance && router.push(`/historique/${seance}`)}
        style={[
          styles.case,
          style,
          avenir ? styles.avenir : { backgroundColor: couleurs.calendrier[niveau] },
          jour === aujourdhui && styles.aujourdhui,
        ]}
        accessibilityRole={seance ? "link" : undefined}
        accessibilityLabel={`${JOUR_LONG.format(Date.parse(`${jour}T00:00:00.000Z`))} : ${
          j ? `${j.seances.length} séance${j.seances.length > 1 ? "s" : ""}` : "repos"
        }`}
      />
    );
  };

  return (
    <View style={styles.bloc}>
      <View style={styles.tete}>
        <Section titre="Régularité" />
        <Text style={styles.moyenne}>{enTete(stats, objectif, moyenne)}</Text>
      </View>

      {stats.nbSemaines === 1 ? (
        // Une semaine : sept cases en ligne, comme un agenda.
        <View style={styles.ligneSemaine}>
          {semaines[0]?.map((jour, i) => (
            <View key={jour} style={styles.jourSemaine}>
              {caseJour(jour, styles.caseSemaine)}
              <Text style={styles.lettre}>{LETTRES[i]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grille} onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
          <View style={styles.lettres}>
            {LETTRES.map((l, i) => (
              <Text
                key={`${l}-${i}`}
                style={[
                  styles.lettreGrille,
                  { height: cote, lineHeight: cote },
                  i % 2 === 1 && styles.cachee,
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
          <ScrollView
            horizontal
            scrollEnabled={fixe}
            showsHorizontalScrollIndicator={false}
            // L'année s'ouvre sur la semaine en cours.
            ref={(r) => {
              if (fixe) r?.scrollToEnd({ animated: false });
            }}
          >
            {cote > 0
              ? semaines.map((jours, w) => {
                  const lundi = jours[0] ?? "";
                  // Le nom du mois au-dessus de la semaine où il commence.
                  const mois = w === 0 || Number(lundi.slice(8)) <= 7;
                  return (
                    <View key={lundi} style={styles.colonne}>
                      {/* L'étiquette déborde sur les colonnes suivantes sans les élargir. */}
                      <View style={[styles.moisPlace, { width: cote }]}>
                        {mois ? (
                          <Text style={styles.mois} numberOfLines={1}>
                            {MOIS.format(Date.parse(`${lundi}T00:00:00.000Z`))}
                          </Text>
                        ) : null}
                      </View>
                      {jours.map((jour) => caseJour(jour, { width: cote, height: cote }))}
                    </View>
                  );
                })
              : null}
          </ScrollView>
        </View>
      )}

      <View style={styles.legende}>
        <Text style={styles.legendeTexte}>Moins</Text>
        {couleurs.calendrier.map((c) => (
          <View key={c} style={[styles.legendeCase, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendeTexte}>Plus</Text>
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: { gap: espace.s },
  tete: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  moyenne: { color: couleurs.encreSecondaire, fontSize: taille.petit },
  ligneSemaine: { flexDirection: "row", gap: espace.xs },
  jourSemaine: { flex: 1, alignItems: "center", gap: espace.xs },
  caseSemaine: { alignSelf: "stretch", height: 36 },
  lettre: { color: couleurs.encreAttenuee, fontSize: 11, fontWeight: "600" },
  grille: { flexDirection: "row", gap: espace.xs },
  // Sous la ligne des mois (13 + l'écart), une lettre par case.
  lettres: { width: LARGEUR_LETTRES, paddingTop: 13 + ECART, gap: ECART },
  lettreGrille: { color: couleurs.encreAttenuee, fontSize: 9 },
  cachee: { opacity: 0 },
  colonne: { gap: ECART, marginRight: ECART },
  moisPlace: { height: 13 },
  mois: { position: "absolute", left: 0, width: 40, color: couleurs.encreAttenuee, fontSize: 9 },
  case: { borderRadius: 3 },
  // Un jour à venir : un contour, pour que la semaine garde sa forme.
  avenir: { borderWidth: 1, borderColor: couleurs.ligne },
  aujourdhui: { borderWidth: 1.5, borderColor: couleurs.encre },
  legende: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },
  legendeCase: { width: 10, height: 10, borderRadius: 2 },
  legendeTexte: { color: couleurs.encreTertiaire, fontSize: 10, marginHorizontal: 2 },
}));
