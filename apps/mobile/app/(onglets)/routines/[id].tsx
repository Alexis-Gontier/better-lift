import {
  dureeEstimeeSec,
  groupes,
  LIBELLE_ZONE,
  meilleureSerie,
  resumeSeries,
  roleRepos,
  zonesTravaillees,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Pencil, Play } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteMuscles } from "../../../components/routines/carte-muscles";
import { Appuyable } from "../../../components/ui/appuyable";
import { formaterSerie } from "../../../components/ui/badge-record";
import { BoutonContour } from "../../../components/ui/bouton-contour";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur } from "../../../components/ui/etats";
import { RepereSuperset } from "../../../components/ui/repere-superset";
import { Vignette } from "../../../components/ui/vignette";
import { useDemarrer } from "../../../lib/demarrer";
import { optionsPrecedents, optionsRoutine } from "../../../lib/requetes";
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
import { SYSTEME_UNITES } from "../../../lib/unites";

/** « 90 s », « 2 min », « 2 min 30 » : ce qu'on lit d'un coup d'œil. */
function formaterRepos(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  const reste = sec % 60;
  return reste ? `${min} min ${String(reste).padStart(2, "0")}` : `${min} min`;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine, qu'on LIT avant de la modifier (D122) : son titre, ce qu'elle
 * travaille, « Lancer » en contour — l'aplat de l'écran est le rond central
 * (D105) —, puis chaque exercice avec ce qui a été fait la dernière fois.
 * « Modifier » ouvre l'édition (D82).
 */
export default function DetailRoutine() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const routine = useQuery(optionsRoutine(id));
  const slugs = routine.data?.exercices.map((e) => e.slug) ?? [];
  // La dernière fois de chaque exercice : en cache dès qu'une séance l'a lue.
  const precedents = useQuery({ ...optionsPrecedents(slugs), enabled: slugs.length > 0 });
  const { routine: demarrer, ouverture } = useDemarrer();
  const { seance } = useSeance();
  const modifier = () => router.push({ pathname: "/routine-edition", params: { id } });

  if (routine.isPending || (routine.isError && !routine.data)) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {routine.isPending ? (
          <Chargement />
        ) : (
          <Erreur
            message="Cette routine n'a pas pu être chargée."
            onReessayer={() => routine.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const r = routine.data;
  const nbSeries = r.exercices.reduce((n, e) => n + e.series.length, 0);
  const blocs = groupes(r.exercices);
  const minutes = Math.max(1, Math.round(dureeEstimeeSec(r.exercices) / 60));
  const zones = zonesTravaillees(r.exercices)
    .filter((z) => z.niveau === "principal")
    .map((z) => LIBELLE_ZONE[z.zone]);

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour
        titre=""
        action={
          <Appuyable
            onPress={modifier}
            style={styles.modifier}
            accessibilityRole="button"
            accessibilityLabel="Modifier la routine"
          >
            <Pencil size={18} color={couleurs.encreSecondaire} />
            <Text style={styles.modifierTexte}>Modifier</Text>
          </Appuyable>
        }
      />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.nomRoutine}>{r.nom}</Text>
        <Text style={styles.resume}>
          {pluriel(r.exercices.length, "exercice")} · {pluriel(nbSeries, "série")} · ≈ {minutes} min
        </Text>
        {zones.length > 0 ? <Text style={styles.zones}>{zones.join(" · ")}</Text> : null}
        {/* Pendant une séance, le bandeau la reprend (D107) : rien à lancer. */}
        {seance || r.exercices.length === 0 ? null : (
          <View style={styles.lancer}>
            <BoutonContour
              libelle="Lancer"
              icone={Play}
              occupe={ouverture !== null}
              onPress={() => void demarrer(r.id)}
            />
          </View>
        )}

        {r.exercices.length === 0 ? (
          <Appuyable onPress={modifier} style={styles.invite} accessibilityRole="button">
            <Text style={styles.inviteTexte}>Ajoute des exercices à cette routine</Text>
          </Appuyable>
        ) : null}

        {r.exercices.length > 0 ? (
          <Text style={styles.section} accessibilityRole="header">
            Exercices
          </Text>
        ) : null}
        {r.exercices.map((ex, i) => (
          // L'index entre dans la clé : le même exercice peut figurer deux fois.
          // Chaque exercice ouvre sa fiche : records, exécution.
          <RepereSuperset
            key={`${ex.slug}-${i}`}
            groupe={blocs.find((b) => b.debut <= i && i <= b.fin) ?? null}
            index={i}
            ecart={espace.m}
          >
            <Appuyable
              onPress={() => router.push(`/exercices/${ex.slug}`)}
              style={styles.carte}
              accessibilityRole="link"
              accessibilityHint="Ouvre la fiche de l'exercice"
            >
              <Vignette image={ex.image} taille={48} />
              <View style={styles.texte}>
                <Text style={styles.exercice} numberOfLines={2}>
                  {ex.nom}
                </Text>
                <Text style={styles.series}>{resumeSeries(ex.series, SYSTEME_UNITES)}</Text>
                {ex.reposSec && roleRepos(r.exercices, i) !== "masque" ? (
                  <Text style={styles.repos}>
                    {roleRepos(r.exercices, i) === "groupe" ? "Repos après le groupe" : "Repos"}{" "}
                    {formaterRepos(ex.reposSec)}
                  </Text>
                ) : null}
                {derniereFois(precedents.data?.[ex.slug])}
              </View>
              <ChevronRight size={20} color={couleurs.encreTertiaire} />
            </Appuyable>
          </RepereSuperset>
        ))}

        {/* Après la liste : les exercices sont ce qu'on vient lire, la carte du
            corps les résume. En tête, elle prenait tout le premier écran. */}
        {r.exercices.length > 0 ? <CarteMuscles exercices={r.exercices} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** « Dernière fois : 85 kg × 5 » : la meilleure série faite de la dernière séance. */
function DerniereFois({
  series,
}: {
  series: { reps: number | null; chargeKg: number | null; faite: boolean }[];
}) {
  const styles = useStyles();
  const m = meilleureSerie(series);
  return m ? (
    <Text style={styles.derniere}>Dernière fois : {formaterSerie(m.chargeKg, m.reps)}</Text>
  ) : null;
}

const derniereFois = (
  series: { reps: number | null; chargeKg: number | null; faite: boolean }[] | undefined,
) => (series && series.length > 0 ? <DerniereFois series={series} /> : null);

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  modifier: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: espace.s,
  },
  modifierTexte: { color: couleurs.encreSecondaire, fontSize: 15, fontWeight: "600" },
  contenu: { padding: espace.l, gap: espace.m, paddingBottom: espace.xl },
  nomRoutine: { ...affiche, color: couleurs.encre, fontSize: 34, lineHeight: 36 },
  resume: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1, marginTop: -espace.s },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: espace.s,
  },
  invite: {
    minHeight: CIBLE,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTexte: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  // Une ligne à filet, pas une carte : la page se lit comme le carnet de séance.
  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingVertical: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  texte: { flex: 1, gap: 2 },
  exercice: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  series: {
    color: couleurs.encreSecondaire,
    fontSize: taille.petit + 1,
    fontVariant: ["tabular-nums"],
  },
  repos: { color: couleurs.encreAttenuee, fontSize: taille.petit },
  zones: { color: couleurs.encreTertiaire, fontSize: taille.petit, marginTop: -espace.s },
  lancer: { flexDirection: "row" },
  derniere: { color: couleurs.encreTertiaire, fontSize: taille.petit },
}));
