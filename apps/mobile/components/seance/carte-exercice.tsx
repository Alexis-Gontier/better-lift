import {
  ABREGE_TYPE_SERIE,
  ATTRIBUTION_MEDIAS,
  type ChampPave,
  type ExerciceEnCours,
  LIBELLE_TYPE_SERIE,
  type SerieEnCours,
  TYPES_SERIE,
  type TypeSerie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ArrowUpDown,
  Check,
  Dumbbell,
  Ellipsis,
  Link2,
  Pencil,
  Plus,
  Repeat,
  Timer,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useConfirmer } from "../../lib/confirmation";
import { optionsExercice } from "../../lib/requetes";
import { CHOIX_REPOS, libelleRepos } from "../../lib/temps";
import {
  CIBLE,
  creerStyles,
  espace,
  PLAFOND_TEXTE_DENSE,
  rayon,
  taille,
  useCouleurs,
} from "../../lib/theme";
import { UNITE } from "../../lib/unites";
import { Appuyable } from "../ui/appuyable";
import { Feuille, type OptionFeuille } from "../ui/feuille";
import { COLONNES, type EtatSerie, LigneSerie } from "./ligne-serie";

/**
 * Les étiquettes des séries (D92) : les normales se numérotent entre elles, les
 * autres portent leur lettre — l'échauffement ne décale pas « série 1 ».
 */
export function etiquettes(series: SerieEnCours[]): string[] {
  let n = 0;
  return series.map((s) => (s.type === "NORMALE" ? String(++n) : ABREGE_TYPE_SERIE[s.type]));
}

const etatDe = (faite: boolean, prochaine: boolean): EtatSerie =>
  faite ? "faite" : prochaine ? "prochaine" : "a-venir";

/** Puce de 32 : 8 au-dessus et dessous pour une cible de 48, 4 sur les côtés pour
 * que deux puces voisines (8 d'écart) ne se disputent pas le doigt. */
const HITSLOP_PUCE = { top: 8, bottom: 8, left: 4, right: 4 } as const;

type Feuilles = { quoi: "menu" } | { quoi: "repos" } | { quoi: "serie"; iS: number } | null;

/**
 * Un exercice de la séance, direction « Carnet » (D108) : un bloc pleine
 * largeur — en-tête, deux puces (repos, note), tableau des séries — et les
 * actions rares dans le menu ⋯.
 */
export function CarteExercice({
  exercice,
  prochaine,
  edition,
  onEditer,
  onPositionLigne,
  onModifierSerie,
  onValiderSerie,
  onAjouterSerie,
  onRetirerSerie,
  onNote,
  onRepos,
  onReorganiser,
  onRemplacer,
  onRetirer,
}: {
  exercice: ExerciceEnCours;
  /** L'indice de la prochaine série de la séance, si elle est dans cet exercice (D116). */
  prochaine: number | null;
  /** La case en cours de saisie au pavé, si elle est dans cet exercice (D109). */
  edition: { iS: number; champ: ChampPave; texte: string; invalide: boolean } | null;
  onEditer: (iS: number, champ: ChampPave) => void;
  /** La position d'une ligne dans le bloc : l'écran la fait défiler au-dessus du pavé. */
  onPositionLigne: (iS: number, y: number) => void;
  onModifierSerie: (
    iS: number,
    patch: { reps?: number | null; chargeKg?: number | null; type?: TypeSerie },
  ) => void;
  onValiderSerie: (iS: number) => void;
  onAjouterSerie: () => void;
  onRetirerSerie: (iS: number) => void;
  onNote: (note: string) => void;
  onRepos: (reposSec: number | null) => void;
  onReorganiser: () => void;
  onRemplacer: () => void;
  onRetirer: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  // La fiche est en cache à vie (le catalogue ne change qu'au semis) : le GIF
  // d'un exercice déjà vu s'affiche même hors ligne, depuis le cache disque.
  const fiche = useQuery(optionsExercice(exercice.slug));
  const gif = fiche.data?.gif ?? null;
  const [grand, setGrand] = useState(false);
  const [note, setNote] = useState(exercice.note ?? "");
  const [editionNote, setEditionNote] = useState(false);
  const [feuille, setFeuille] = useState<Feuilles>(null);
  const libelles = etiquettes(exercice.series);
  const confirmer = useConfirmer();

  const retirer = () =>
    confirmer({
      titre: `Retirer « ${exercice.nom} » ?`,
      message: "Ses séries seront perdues.",
      action: "Retirer l'exercice",
      icone: Trash2,
      onConfirmer: onRetirer,
    });

  const options: OptionFeuille[] =
    feuille?.quoi === "menu"
      ? [
          { libelle: "Réorganiser les exercices", icone: ArrowUpDown, onPress: onReorganiser },
          { libelle: "Remplacer l'exercice", icone: Repeat, onPress: onRemplacer },
          // Lot B : le superset attend son modèle de séance.
          { libelle: "Ajouter à un superset", icone: Link2, inactive: "bientôt" },
          { libelle: "Retirer l'exercice", icone: Trash2, danger: true, onPress: retirer },
        ]
      : feuille?.quoi === "repos"
        ? CHOIX_REPOS.map((sec) => ({
            libelle: sec === null ? "Désactivé" : libelleRepos(sec),
            choisie: (exercice.reposSec ?? null) === sec,
            onPress: () => onRepos(sec),
          }))
        : feuille?.quoi === "serie"
          ? [
              ...TYPES_SERIE.map((type) => ({
                libelle: LIBELLE_TYPE_SERIE[type],
                choisie: exercice.series[feuille.iS]?.type === type,
                onPress: () => onModifierSerie(feuille.iS, { type }),
              })),
              {
                libelle: "Supprimer la série",
                icone: Trash2,
                danger: true,
                onPress: () => onRetirerSerie(feuille.iS),
              },
            ]
          : [];

  const titreFeuille =
    feuille?.quoi === "repos"
      ? "Repos après chaque série"
      : feuille?.quoi === "serie"
        ? `Série ${libelles[feuille.iS]}`
        : exercice.nom;

  return (
    <View style={styles.bloc}>
      <View style={styles.entete}>
        {/* Sans GIF, la vignette n'est qu'une image : ni bouton, ni annonce. */}
        <Appuyable
          onPress={() => setGrand((g) => !g)}
          disabled={!gif}
          accessible={Boolean(gif)}
          accessibilityRole="button"
          accessibilityLabel={grand ? "Réduire l'animation" : "Agrandir l'animation"}
        >
          {gif ? (
            <Image
              source={{ uri: gif }}
              style={styles.vignette}
              contentFit="cover"
              cachePolicy="disk"
              // En vignette, l'animation distrait : elle ne joue qu'agrandie.
              autoplay={false}
            />
          ) : (
            <View style={[styles.vignette, styles.sansImage]}>
              <Dumbbell size={18} color={couleurs.encreAttenuee} />
            </View>
          )}
        </Appuyable>
        <Text style={styles.nom} numberOfLines={2}>
          {exercice.nom}
        </Text>
        <Appuyable
          onPress={() => setFeuille({ quoi: "menu" })}
          hitSlop={8}
          style={styles.menu}
          accessibilityRole="button"
          accessibilityLabel={`Actions pour ${exercice.nom}`}
        >
          <Ellipsis size={20} color={couleurs.encreSecondaire} />
        </Appuyable>
      </View>

      {grand && gif ? (
        <Appuyable
          onPress={() => setGrand(false)}
          style={styles.media}
          accessibilityRole="button"
          accessibilityLabel="Réduire l'animation"
        >
          <Image source={{ uri: gif }} style={styles.gif} contentFit="contain" cachePolicy="disk" />
          <Text style={styles.attribution}>{ATTRIBUTION_MEDIAS}</Text>
        </Appuyable>
      ) : null}

      {/* Le repos et la note en deux puces (D108) : 44 dp gagnés par exercice.
          La note saisie remplace le mot « Note ». */}
      <View style={styles.puces}>
        <Appuyable
          onPress={() => setFeuille({ quoi: "repos" })}
          hitSlop={HITSLOP_PUCE}
          style={styles.puce}
          accessibilityRole="button"
          accessibilityLabel={`Repos : ${libelleRepos(exercice.reposSec)}`}
        >
          <Timer
            size={14}
            color={exercice.reposSec ? couleurs.encreSecondaire : couleurs.encreAttenuee}
          />
          <Text style={[styles.puceTexte, !exercice.reposSec && styles.puceEteinte]}>
            {exercice.reposSec ? libelleRepos(exercice.reposSec) : "Sans repos"}
          </Text>
        </Appuyable>
        <Appuyable
          onPress={() => setEditionNote(true)}
          hitSlop={HITSLOP_PUCE}
          style={[styles.puce, styles.puceNote]}
          accessibilityRole="button"
          accessibilityLabel={note ? `Note : ${note}` : "Ajouter une note"}
        >
          <Pencil size={14} color={couleurs.encreSecondaire} />
          <Text style={[styles.puceTexte, !note && styles.puceEteinte]} numberOfLines={1}>
            {note || "Note"}
          </Text>
        </Appuyable>
      </View>

      {/* D90 : la note s'écrit à chaque frappe. Pas à la sortie du champ : un
          appui sur ✓ garde le clavier ouvert, et la note ne sortirait jamais. */}
      {editionNote ? (
        <TextInput
          value={note}
          onChangeText={(t) => {
            setNote(t);
            onNote(t);
          }}
          onBlur={() => setEditionNote(false)}
          autoFocus
          placeholder="Siège cran 4, prise serrée…"
          placeholderTextColor={couleurs.encreAttenuee}
          multiline
          maxLength={500}
          style={styles.note}
          accessibilityLabel={`Note pour ${exercice.nom}`}
        />
      ) : null}

      <View style={styles.colonnes}>
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.colonne, { width: COLONNES.serie }]}
        >
          Série
        </Text>
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.colonne, styles.gauche, { flex: 1.25 }]}
        >
          Précédent
        </Text>
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.colonne, { flex: 1 }]}
        >
          {UNITE}
        </Text>
        <Text
          maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.colonne, { flex: 1 }]}
        >
          Reps
        </Text>
        <View style={{ width: COLONNES.valider, alignItems: "center" }}>
          <Check size={14} color={couleurs.encreAttenuee} strokeWidth={3} />
        </View>
      </View>

      {exercice.series.map((s, i) => (
        <View
          key={`${i}-${exercice.series.length}`}
          onLayout={(e) => onPositionLigne(i, e.nativeEvent.layout.y)}
        >
          <LigneSerie
            numero={i + 1}
            etiquette={libelles[i] ?? String(i + 1)}
            couleurEtiquette={s.type === "NORMALE" ? couleurs.encre : couleurs.encreTertiaire}
            serie={s}
            etat={etatDe(s.faite, i === prochaine)}
            precedent={exercice.precedent?.[i]}
            onChange={(patch) => onModifierSerie(i, patch)}
            onValider={() => onValiderSerie(i)}
            onEtiquette={() => setFeuille({ quoi: "serie", iS: i })}
            edition={edition?.iS === i ? edition : null}
            onEditer={(champ) => onEditer(i, champ)}
          />
        </View>
      ))}

      <Appuyable
        onPress={onAjouterSerie}
        style={styles.ajouter}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une série"
      >
        <Plus size={16} color={couleurs.encreSecondaire} strokeWidth={2.4} />
        <Text style={styles.ajouterTexte}>Série</Text>
      </Appuyable>

      <Feuille
        visible={feuille !== null}
        titre={titreFeuille}
        options={options}
        onFermer={() => setFeuille(null)}
      />
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: {
    paddingHorizontal: espace.m,
    paddingVertical: espace.l,
    gap: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  entete: { flexDirection: "row", alignItems: "center", gap: espace.m },
  // Fond blanc : les GIF du dataset sont dessinés sur blanc.
  vignette: { width: 40, height: 40, borderRadius: 20, backgroundColor: couleurs.fondImage },
  sansImage: { backgroundColor: couleurs.surface3, alignItems: "center", justifyContent: "center" },
  nom: { flex: 1, color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "700" },
  menu: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  media: { alignItems: "center", gap: espace.xs },
  gif: { width: 220, height: 220, borderRadius: 12, backgroundColor: couleurs.fondImage },
  attribution: { color: couleurs.encreAttenuee, fontSize: 11 },
  puces: { flexDirection: "row", gap: espace.s, flexWrap: "wrap" },
  puce: {
    minHeight: 32,
    paddingHorizontal: espace.m,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: couleurs.surface2,
  },
  puceNote: { flexShrink: 1, maxWidth: "70%" },
  puceTexte: { color: couleurs.encreSecondaire, fontSize: 14, fontWeight: "600" },
  puceEteinte: { color: couleurs.encreAttenuee, fontWeight: "500" },
  note: {
    color: couleurs.encre,
    fontSize: 15,
    minHeight: CIBLE,
    paddingHorizontal: espace.m,
    paddingVertical: espace.s,
    borderRadius: rayon.cellule,
    backgroundColor: couleurs.surface2,
  },
  colonnes: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
    paddingHorizontal: espace.xs,
    marginTop: espace.xs,
  },
  colonne: {
    color: couleurs.encreAttenuee,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  gauche: { textAlign: "left" },
  // Bouton tertiaire : du texte, une cible pleine.
  ajouter: {
    minHeight: 40,
    alignSelf: "flex-start",
    paddingHorizontal: espace.s,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ajouterTexte: { color: couleurs.encreSecondaire, fontSize: 15, fontWeight: "600" },
}));
