import { dureeEstimeeSec, routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Play, Plus } from "lucide-react-native";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useDemarrer } from "../lib/demarrer";
import { optionsRoutine, optionsRoutines, optionsSeances } from "../lib/requetes";
import { affiche, CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../lib/theme";
import { Appuyable } from "./ui/appuyable";
import { FeuilleBasse } from "./ui/feuille-basse";
import { Section } from "./ui/section";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Démarrer (D120), ouverte par le rond central par-dessus l'onglet courant :
 * « À suivre » et son aplat — deux appuis pour le cas courant —, puis les autres
 * routines et la séance vide. Chaque choix ferme la feuille AVANT de lancer : un
 * `Modal` resterait au-dessus de la séance.
 */
export function FeuilleDemarrer({ visible, onFermer }: { visible: boolean; onFermer: () => void }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  const { vide, routine } = useDemarrer();
  const suivante = routines.data
    ? routineASuivre(routines.data, seances.data?.pages.flatMap((p) => p.seances) ?? [])
    : null;
  // Le détail est en cache (préchargé pour le hors ligne) : la durée vient sans attente.
  const detail = useQuery({ ...optionsRoutine(suivante?.id ?? ""), enabled: !!suivante });
  const minutes = detail.data
    ? Math.max(1, Math.round(dureeEstimeeSec(detail.data.exercices) / 60))
    : null;
  const autres = routines.data?.filter((r) => r.id !== suivante?.id) ?? [];

  const lancer = (id: string) => {
    onFermer();
    void routine(id);
  };

  return (
    <FeuilleBasse visible={visible} onFermer={onFermer}>
      <ScrollView style={styles.contenu} contentContainerStyle={styles.interieur}>
        <Text style={styles.titre} accessibilityRole="header">
          Démarrer
        </Text>

        {suivante ? (
          <View style={styles.suivante}>
            <Section titre="À suivre" />
            <Text style={styles.nomSuivante} numberOfLines={2}>
              {suivante.nom}
            </Text>
            <Text style={styles.pale}>
              {pluriel(suivante.nbExercices, "exercice")}
              {minutes ? ` · ≈ ${minutes} min` : ""}
            </Text>
            {/* L'aplat de la feuille : l'action la plus probable. */}
            <Appuyable
              style={styles.aplat}
              onPress={() => lancer(suivante.id)}
              accessibilityRole="button"
            >
              <Play size={18} color={couleurs.surAction} fill={couleurs.surAction} />
              <Text style={styles.aplatTexte} numberOfLines={1}>
                Commencer {suivante.nom}
              </Text>
            </Appuyable>
          </View>
        ) : null}

        {/* Toujours à portée, avant la liste qui peut être longue. */}
        <Appuyable
          style={({ pressed }) => [styles.ligne, styles.vide, pressed && styles.appuye]}
          onPress={() => {
            onFermer();
            void vide();
          }}
          accessibilityRole="button"
        >
          <View style={styles.texte}>
            <Text style={styles.nom}>Séance vide</Text>
            <Text style={styles.pale}>Ajoute tes exercices au fil de la séance.</Text>
          </View>
          <View style={styles.icone}>
            <Plus size={18} color={couleurs.encre} />
          </View>
        </Appuyable>
        {/* Hors ligne et sans cache, la requête se met en pause : sans ce cas,
            l'indicateur tournerait pour toujours. */}
        {routines.isPending && routines.fetchStatus === "paused" ? (
          <Text style={styles.message}>
            Hors ligne : les routines apparaîtront au retour du réseau.
          </Text>
        ) : routines.isPending ? (
          <ActivityIndicator color={couleurs.encreTertiaire} style={styles.attente} />
        ) : routines.isError && !routines.data ? (
          <Appuyable onPress={() => routines.refetch()} accessibilityRole="button">
            <Text style={styles.message}>Routines indisponibles pour l'instant. Réessayer</Text>
          </Appuyable>
        ) : routines.data.length === 0 ? (
          <Text style={styles.message}>
            Pas encore de routine. Crée-en une dans l'onglet Routines.
          </Text>
        ) : autres.length > 0 ? (
          <>
            <Section titre={suivante ? "Autres routines" : "Routines"} style={styles.section} />
            {autres.map((r) => (
              <Appuyable
                key={r.id}
                style={({ pressed }) => [styles.ligne, pressed && styles.appuye]}
                onPress={() => lancer(r.id)}
                accessibilityRole="button"
                accessibilityLabel={`Commencer ${r.nom}`}
              >
                <View style={styles.texte}>
                  <Text style={styles.nom} numberOfLines={1}>
                    {r.nom}
                  </Text>
                  <Text style={styles.pale}>
                    {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
                  </Text>
                </View>
                <View style={styles.icone}>
                  <Play size={16} color={couleurs.encre} />
                </View>
              </Appuyable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </FeuilleBasse>
  );
}

const useStyles = creerStyles((couleurs) => ({
  contenu: { flexGrow: 0 },
  interieur: { paddingHorizontal: espace.s, paddingBottom: espace.s },
  titre: { color: couleurs.encre, fontSize: 22, fontWeight: "700", marginBottom: espace.m },
  suivante: {
    gap: espace.xs,
    padding: espace.l,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.surface1,
  },
  nomSuivante: { ...affiche, color: couleurs.encre, fontSize: 24 },
  aplat: {
    minHeight: 52,
    marginTop: espace.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
    paddingHorizontal: espace.l,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
  },
  aplatTexte: { color: couleurs.surAction, fontSize: taille.courant, fontWeight: "800" },
  section: { marginTop: espace.xl, marginBottom: espace.xs },
  ligne: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.xs,
    borderRadius: rayon.bouton,
  },
  vide: { marginTop: espace.m },
  appuye: { backgroundColor: couleurs.surface3 },
  icone: {
    width: CIBLE - 8,
    height: CIBLE - 8,
    borderRadius: rayon.cellule,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  texte: { flex: 1 },
  nom: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "700" },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  message: { color: couleurs.encreTertiaire, fontSize: taille.petit, paddingVertical: espace.l },
  attente: { marginVertical: espace.xl },
}));
