import {
  ABREGE_TYPE_SERIE,
  ATTRIBUTION_MEDIAS,
  type ExerciceEnCours,
  LIBELLE_TYPE_SERIE,
  type RoleRepos,
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
  EllipsisVertical,
  Link2,
  Pencil,
  Plus,
  Repeat,
  Timer,
  Trash2,
  Unlink2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Feuille, type OptionFeuille } from "@/components/ui/feuille";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useConfirmer } from "@/lib/confirmation";
import { optionsExercice } from "@/lib/requetes";
import { CHOIX_REPOS, libelleRepos } from "@/lib/temps";
import { UNITE } from "@/lib/unites";
import { cn } from "@/lib/utils";
import { type EtatSerie, LigneSerie } from "./ligne-serie";
import { PLAFOND_TEXTE_DENSE } from "./texte-dense";

/**
 * Les étiquettes des séries (D92) : les normales se numérotent entre elles, les
 * autres portent leur lettre — l'échauffement ne décale pas « série 1 ».
 */
function etiquettes(series: SerieEnCours[]): string[] {
  let n = 0;
  return series.map((s) => (s.type === "NORMALE" ? String(++n) : ABREGE_TYPE_SERIE[s.type]));
}

const etatDe = (faite: boolean, prochaine: boolean): EtatSerie =>
  faite ? "faite" : prochaine ? "prochaine" : "a-venir";

type Feuilles = { quoi: "menu" } | { quoi: "repos" } | { quoi: "serie"; iS: number } | null;

/**
 * Un exercice de la séance (D108, D317) : en-tête, deux puces (repos, note),
 * tableau des séries ; les actions rares dans le menu ⋮.
 */
export function CarteExercice({
  exercice,
  prochaine,
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
  repos,
  peutLier,
  dernier,
  dansGroupe,
  onLier,
  onDelier,
}: {
  exercice: ExerciceEnCours;
  /** D149 : masqué sur un membre non dernier d'un superset. */
  repos: RoleRepos;
  /** D152 : hors groupe ou au bout d'un groupe, et pas sur le dernier exercice. */
  peutLier: boolean;
  /** Le dernier exercice de la liste : rien ne le suit. */
  dernier: boolean;
  dansGroupe: boolean;
  onLier: () => void;
  onDelier: () => void;
  /** L'indice de la prochaine série de la séance, si elle est dans cet exercice (D116). */
  prochaine: number | null;
  /** La position d'une ligne dans le bloc : l'écran y défile après une coche. */
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
          {
            libelle: "Superset avec le suivant",
            icone: Link2,
            ...(peutLier
              ? { onPress: onLier }
              : { inactive: dernier ? "dernier exercice" : "dans le groupe" }),
          },
          ...(dansGroupe
            ? [{ libelle: "Retirer du superset", icone: Unlink2, onPress: onDelier }]
            : []),
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

  const texteRepos =
    repos === "groupe"
      ? exercice.reposSec
        ? `Après le groupe · ${libelleRepos(exercice.reposSec)}`
        : "Sans repos après le groupe"
      : exercice.reposSec
        ? libelleRepos(exercice.reposSec)
        : "Sans repos";

  return (
    // Une carte par exercice (D325), comme les routines. L'écart vient de cette vue,
    // DANS le repère de superset, pour que son filet relie les membres ; une marge
    // posée sur la carte elle-même mangeait sa bordure du bas sous Android.
    <View className="pb-3">
      <View className="gap-2 rounded-lg border border-border bg-background px-3 py-3">
        <View className="flex-row items-center gap-3">
          {/* Sans GIF, la vignette n'est qu'une image : ni bouton, ni annonce. */}
          <Pressable
            onPress={() => setGrand((g) => !g)}
            disabled={!gif}
            accessible={Boolean(gif)}
            accessibilityRole="button"
            accessibilityLabel={grand ? "Réduire l'animation" : "Agrandir l'animation"}
          >
            {gif ? (
              // Fond blanc : les GIF du catalogue sont dessinés sur blanc. En
              // vignette, l'animation distrait : elle ne joue qu'agrandie.
              <View className="size-10 overflow-hidden rounded-full bg-white">
                <Image
                  source={{ uri: gif }}
                  style={{ width: 40, height: 40 }}
                  contentFit="cover"
                  cachePolicy="disk"
                  autoplay={false}
                />
              </View>
            ) : (
              <View className="size-10 items-center justify-center rounded-full bg-secondary">
                <Icon as={Dumbbell} className="size-4.5 text-muted-foreground" />
              </View>
            )}
          </Pressable>
          <Text className="flex-1 font-semibold text-base" numberOfLines={2}>
            {exercice.nom}
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onPress={() => setFeuille({ quoi: "menu" })}
            accessibilityLabel={`Actions pour ${exercice.nom}`}
          >
            <Icon as={EllipsisVertical} className="size-5 text-muted-foreground" />
          </Button>
        </View>

        {grand && gif ? (
          <Pressable
            onPress={() => setGrand(false)}
            className="gap-1"
            accessibilityRole="button"
            accessibilityLabel="Réduire l'animation"
          >
            <View className="overflow-hidden rounded-md bg-white">
              <Image
                source={{ uri: gif }}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="contain"
                cachePolicy="disk"
              />
            </View>
            <Text className="text-center text-muted-foreground text-xs">{ATTRIBUTION_MEDIAS}</Text>
          </Pressable>
        ) : null}

        {/* Le repos et la note en deux puces (D108) ; la note saisie remplace le mot « Note ». */}
        <View className="flex-row flex-wrap gap-2">
          {repos === "masque" ? null : (
            <Puce
              icone={Timer}
              texte={texteRepos}
              eteinte={!exercice.reposSec}
              onPress={() => setFeuille({ quoi: "repos" })}
              libelle={`${repos === "groupe" ? "Repos après le groupe" : "Repos"} : ${libelleRepos(exercice.reposSec)}`}
            />
          )}
          <Puce
            icone={Pencil}
            texte={note || "Note"}
            eteinte={!note}
            onPress={() => setEditionNote(true)}
            libelle={note ? `Note : ${note}` : "Ajouter une note"}
          />
        </View>

        {/* D90 : la note s'écrit à chaque frappe, pas à la sortie du champ. */}
        {editionNote ? (
          <Input
            value={note}
            onChangeText={(t) => {
              setNote(t);
              onNote(t);
            }}
            onBlur={() => setEditionNote(false)}
            autoFocus
            placeholder="Siège cran 4, prise serrée…"
            multiline
            maxLength={500}
            className="h-auto min-h-12 py-2"
            accessibilityLabel={`Note pour ${exercice.nom}`}
          />
        ) : null}

        <View className="mt-1 flex-row items-center gap-2 px-1">
          <Colonne className="w-10">Série</Colonne>
          <Colonne className="flex-[1.25] text-left">Précédent</Colonne>
          <Colonne className="flex-1">{UNITE}</Colonne>
          <Colonne className="flex-1">Reps</Colonne>
          <View className="w-10 items-center">
            <Icon as={Check} className="size-3.5 text-muted-foreground" strokeWidth={3} />
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
              secondaire={s.type !== "NORMALE"}
              serie={s}
              etat={etatDe(s.faite, i === prochaine)}
              precedent={exercice.precedent?.[i]}
              onChange={(patch) => onModifierSerie(i, patch)}
              onValider={() => onValiderSerie(i)}
              onEtiquette={() => setFeuille({ quoi: "serie", iS: i })}
            />
          </View>
        ))}

        {/* Pleine largeur, en gris plein (D337) : on le trouve sans le chercher, et
            il reste moins fort que la coche. */}
        <Button variant="secondary" className="mt-1 h-12" onPress={onAjouterSerie}>
          <Icon as={Plus} className="size-4 text-foreground" />
          <Text>Ajouter une série</Text>
        </Button>

        <Feuille
          visible={feuille !== null}
          titre={titreFeuille}
          options={options}
          onFermer={() => setFeuille(null)}
        />
      </View>
    </View>
  );
}

function Colonne({ className, children }: { className: string; children: string }) {
  return (
    <Text
      maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}
      numberOfLines={1}
      adjustsFontSizeToFit
      className={cn("text-center font-semibold text-muted-foreground text-xs uppercase", className)}
    >
      {children}
    </Text>
  );
}

function Puce({
  icone,
  texte,
  eteinte,
  libelle,
  onPress,
}: {
  icone: typeof Timer;
  texte: string;
  eteinte: boolean;
  libelle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      // Puce de 32 : 8 au-dessus et dessous pour une cible de 48.
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      className="h-8 max-w-[70%] flex-row items-center gap-1.5 rounded-full bg-secondary px-3 active:bg-accent"
      accessibilityRole="button"
      accessibilityLabel={libelle}
    >
      <Icon as={icone} className="size-3.5 text-muted-foreground" />
      <Text
        numberOfLines={1}
        className={cn("font-medium text-sm", eteinte && "text-muted-foreground")}
      >
        {texte}
      </Text>
    </Pressable>
  );
}
