import {
  ATTRIBUTION_MEDIAS,
  type ExerciceResume,
  formaterCharge,
  formatJour,
  LIBELLE_GROUPE,
  LIBELLE_RECORD,
  type RecordExercice,
} from "@better-lift/shared";
import { type UseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Dumbbell } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HistoriqueSeances } from "../../../components/exercices/historique-exercice";
import { Progression } from "../../../components/exercices/progression";
import { CarteMuscles } from "../../../components/routines/carte-muscles";
import { BadgeRecord, formaterSerie } from "../../../components/ui/badge-record";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { FUSEAU } from "../../../lib/fuseau";
import {
  optionsCatalogueComplet,
  optionsExercice,
  optionsHistoriqueExercice,
  optionsRecords,
} from "../../../lib/requetes";
import { creerStyles, espace, rayon, taille, useCouleurs } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

/**
 * La fiche d'un exercice, une page qui défile (D124) : l'animation, le 1RM
 * estimé et sa courbe, les records (D95), l'historique, puis ce qu'il travaille
 * et comment le faire. Hors ligne, la ligne du catalogue (D97) et les records
 * (D111), tous deux gardés sur le téléphone, suffisent à l'essentiel.
 */
export default function FicheExercice() {
  const styles = useStyles();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const client = useQueryClient();
  const exercice = useQuery(optionsExercice(slug));
  const records = useQuery(optionsRecords(slug));
  const historique = useQuery(optionsHistoriqueExercice(slug));
  // Lu dans le cache seulement : la fiche ne déclenche jamais le chargement du catalogue entier.
  const resume = client
    .getQueryData<ExerciceResume[]>(optionsCatalogueComplet().queryKey)
    ?.find((e) => e.slug === slug);

  const ex = exercice.data;
  const horsLigne = exercice.isPending && exercice.fetchStatus === "paused";
  const nom = ex?.nom ?? resume?.nom;

  if (!nom) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {horsLigne ? (
          <Vide titre="Hors ligne" message="Cet exercice s'affichera au retour du réseau." />
        ) : exercice.isPending ? (
          <Chargement />
        ) : (
          <Erreur
            message="Cet exercice n'a pas pu être chargé."
            onReessayer={() => exercice.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const groupe = ex?.groupe ?? resume?.groupe;
  const equipement = ex?.equipement ?? resume?.equipement;
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour titre="" />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Media gif={ex?.gif ?? null} image={resume?.image ?? null} nom={nom} />

        <View style={styles.tete}>
          <Text style={styles.nom}>{nom}</Text>
          <Text style={styles.sous}>
            {[ex?.nomAnglais, groupe ? LIBELLE_GROUPE[groupe] : null, equipement]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>

        {historique.data ? <Progression seances={historique.data} /> : null}

        <View>
          <Text style={styles.section} accessibilityRole="header">
            Records
          </Text>
          <Records etat={records} />
        </View>

        {/* L'historique n'est pas gardé hors ligne (D96) : il revient avec le réseau. */}
        {historique.data ? <HistoriqueSeances seances={historique.data} /> : null}

        {ex ? (
          <>
            <CarteMuscles
              exercices={[{ musclePrincipal: ex.cible, musclesSecondaires: ex.secondaires }]}
              titre="Muscles"
            />
            {ex.instructions.length > 0 ? (
              <View style={styles.etapes}>
                <Text style={styles.section} accessibilityRole="header">
                  Exécution
                </Text>
                {ex.instructions.map((etape, i) => (
                  <View key={etape} style={styles.etape}>
                    <Text style={styles.numero}>{i + 1}</Text>
                    <Text style={styles.texte}>{etape}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          // La ligne du catalogue tient lieu de fiche : on dit ce qui manque.
          <Text style={styles.pale}>
            {horsLigne
              ? "Hors ligne : l'animation, les muscles et l'exécution reviendront avec le réseau."
              : exercice.isPending
                ? "Chargement de la fiche…"
                : "La fiche complète n'a pas pu être chargée."}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** L'animation si on l'a, sinon l'image fixe du catalogue, sinon une haltère. */
function Media({ gif, image, nom }: { gif: string | null; image: string | null; nom: string }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const source = gif ?? image;
  // L'image qui n'a pas pu se charger (hors ligne, jamais vue) : on montre l'haltère.
  const [echec, setEchec] = useState<string | null>(null);
  if (!source || echec === source) {
    return (
      <View style={[styles.media, styles.sansMedia]}>
        <Dumbbell size={40} color={couleurs.encreAttenuee} />
      </View>
    );
  }
  return (
    <View style={styles.cadre}>
      {/* Le GIF est affiché depuis le dépôt du dataset, jamais copié (D46). */}
      <Image
        source={{ uri: source }}
        style={styles.media}
        contentFit="contain"
        cachePolicy="disk"
        // L'écran est réutilisé d'un exercice à l'autre : sans clé, expo-image
        // garderait l'image du précédent tant que la nouvelle ne charge pas.
        recyclingKey={source}
        onError={() => setEchec(source)}
        accessibilityLabel={`Animation de l'exercice : ${nom}`}
      />
      <Text style={styles.attribution}>{ATTRIBUTION_MEDIAS}</Text>
    </View>
  );
}

/** Un record par ligne : sa valeur en badge, la série et le jour où il est tombé. */
function Records({ etat }: { etat: UseQueryResult<RecordExercice[]> }) {
  const styles = useStyles();
  if (!etat.data) {
    return (
      <Text style={styles.pale}>
        {etat.isPending && etat.fetchStatus === "paused"
          ? "Hors ligne : les records s'afficheront au retour du réseau."
          : etat.isPending
            ? "Chargement…"
            : "Les records n'ont pas pu être chargés."}
      </Text>
    );
  }
  if (etat.data.length === 0) {
    return (
      <Text style={styles.pale}>Pas encore de record. Le premier tombe à la première série.</Text>
    );
  }
  return (
    <View>
      {etat.data.map((r) => {
        // 1RM et volume sont des valeurs calculées : la série qui les porte vient en dessous.
        const calcule = r.type === "UN_RM" || r.type === "VOLUME";
        return (
          <View key={r.type} style={styles.record}>
            <View style={styles.recordGauche}>
              <Text style={styles.recordType}>{LIBELLE_RECORD[r.type]}</Text>
              <Text style={styles.pale}>
                {calcule ? `${formaterSerie(r.chargeKg, r.reps)} · ` : ""}
                {formatJour(r.date, FUSEAU)}
              </Text>
            </View>
            <BadgeRecord
              libelle={
                calcule
                  ? formaterCharge(r.valeur, SYSTEME_UNITES)
                  : formaterSerie(r.chargeKg, r.reps)
              }
            />
          </View>
        );
      })}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { padding: espace.l, gap: espace.xl, paddingBottom: espace.xxl * 2 },
  tete: { gap: espace.xs },
  nom: { color: couleurs.encre, fontSize: 30, lineHeight: 34, fontWeight: "700" },
  sous: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  cadre: { alignItems: "center", gap: espace.xs },
  // Fond blanc dans les deux thèmes : les images du dataset sont dessinées sur blanc.
  media: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.fondImage,
  },
  sansMedia: { alignItems: "center", justifyContent: "center", backgroundColor: couleurs.surface2 },
  attribution: { color: couleurs.encreAttenuee, fontSize: 11 },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: espace.s,
  },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1 },
  record: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingVertical: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  recordGauche: { flex: 1, gap: 2 },
  recordType: { color: couleurs.encre, fontSize: 15, fontWeight: "600" },
  etapes: { gap: espace.m },
  etape: { flexDirection: "row", gap: espace.m },
  numero: {
    width: 22,
    color: couleurs.encreAttenuee,
    fontSize: taille.petit,
    fontWeight: "600",
    paddingTop: 3,
  },
  texte: { flex: 1, color: couleurs.encre, fontSize: taille.courant, lineHeight: 23 },
}));
