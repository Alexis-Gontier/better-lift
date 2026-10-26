import {
  bilanSeance,
  decalerDeJours,
  formaterCharge,
  formatJour,
  joursEcoules,
  majRoutine,
  secondesEcoulees,
} from "@better-lift/shared";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  CircleDashed,
  CloudOff,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { FeuilleBasse } from "@/components/ui/feuille-basse";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Roue } from "@/components/ui/roue";
import { Text } from "@/components/ui/text";
import { useConfirmer, useInformer } from "@/lib/confirmation";
import { FUSEAU } from "@/lib/fuseau";
import { optionsRoutine, useMettreAJourRoutine } from "@/lib/requetes";
import { useSeance } from "@/lib/seance";
import { formaterDuree } from "@/lib/temps";
import { SYSTEME_UNITES } from "@/lib/unites";
import { cn } from "@/lib/utils";
import { vibrer } from "@/lib/vibrations";

// Une durée corrigée reste plausible : jusqu'à 10 h.
const HEURES_MAX = 10;
// La date se choisit dans les deux derniers mois.
const JOURS_MAX = 60;

const HEURES = Array.from({ length: HEURES_MAX + 1 }, (_, h) => `${h} h`);
const MINUTES = Array.from({ length: 60 }, (_, m) => `${String(m).padStart(2, "0")} min`);
const JOUR_COURT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: FUSEAU,
});
/** « Aujourd'hui », « Hier », puis « lun. 20 oct. » : le jour, compté depuis aujourd'hui. */
function libelleJour(ilYa: number, maintenant: Date): string {
  if (ilYa === 0) return "Aujourd'hui";
  if (ilYa === 1) return "Hier";
  return JOUR_COURT.format(new Date(decalerDeJours(maintenant.toISOString(), -ilYa, FUSEAU)));
}

/**
 * La fin de séance (D130, D318, D342, D343) : trois chiffres, une note, puis
 * enregistrer, reprendre ou abandonner. La date et la durée se corrigent d'un
 * appui, sur des roues : une séance saisie le lendemain, ou terminée bien après
 * la dernière série, garde son vrai jour et ne compte pas l'attente. Une
 * séance sans série validée ne s'enregistre pas, elle se reprend. Une séance
 * partie d'une routine peut la mettre à jour (D347).
 */
export default function Fin() {
  const router = useRouter();
  const { seance, terminer, modifier, abandonner } = useSeance();
  const confirmer = useConfirmer();
  // La durée est figée à l'ouverture de cet écran : c'est l'heure de fin.
  const [finReelle] = useState(() => new Date());
  // Les corrections : la durée en secondes (`null` : la vraie), et le décalage
  // du jour, en jours civils (0 : le jour du début).
  const [dureeCorrigee, setDureeCorrigee] = useState<number | null>(null);
  const [decalage, setDecalage] = useState(0);
  const [feuille, setFeuille] = useState<"duree" | "date" | null>(null);
  // Un second appui pendant l'enregistrement mettrait la séance deux fois en file.
  const [enregistrement, setEnregistrement] = useState(false);
  // D347 : la routine d'origine, déjà en cache depuis le démarrage, relue si possible.
  const routineId = seance?.routineId ?? null;
  const routine = useQuery({ ...optionsRoutine(routineId ?? ""), enabled: routineId !== null });
  const majRoutineSeance = useMettreAJourRoutine();
  const informer = useInformer();
  const [mettreAJour, setMettreAJour] = useState(false);
  if (!seance) return null;

  const { seriesFaites, volumeKg } = bilanSeance(seance);
  const reprendre = () => router.back();
  const debut = decalerDeJours(seance.debut, decalage, FUSEAU);
  const duree = dureeCorrigee ?? secondesEcoulees(seance.debut, finReelle);
  const fin = new Date(Date.parse(debut) + duree * 1000);

  const abandon = () =>
    confirmer({
      titre: "Abandonner la séance ?",
      message: "Rien ne sera enregistré.",
      action: "Abandonner la séance",
      icone: Trash2,
      annuler: "Garder la séance",
      onConfirmer: () => {
        void abandonner().then(() => router.replace("/"));
      },
    });

  if (seriesFaites === 0) {
    return (
      <Ecran className="flex-1 bg-background p-4">
        <View className="flex-1 justify-center gap-2">
          <Text className="font-semibold text-2xl" accessibilityRole="header">
            Pas encore de série.
          </Text>
          <Text className="text-muted-foreground">Valide au moins une série pour enregistrer.</Text>
        </View>
        <View className="flex-row gap-2">
          <Button variant="outline" className="h-12 flex-1" onPress={reprendre}>
            <Text>Reprendre</Text>
          </Button>
          <Abandonner onPress={abandon} />
        </View>
      </Ecran>
    );
  }

  // Ce qui reste à valider : terminer ne doit pas se faire par mégarde au milieu
  // d'une séance, comme Hevy qui le signale avant d'enregistrer.
  const toutes = seance.exercices.flatMap((e) => e.series);
  const nonValidees = toutes.filter((x) => !x.faite).length;
  // D5 : l'échauffement ne compte pas dans le volume. L'écran le dit, sans quoi
  // « 1 série · 0 kg » ressemble à une erreur.
  const echauffementFait = toutes.some((x) => x.faite && x.type === "ECHAUFFEMENT");
  const horsLigne = !onlineManager.isOnline();
  // Sans réseau, pas de proposition : la mise à jour n'a pas de file d'envoi.
  const maj = routine.data && !horsLigne ? majRoutine(routine.data, seance, SYSTEME_UNITES) : null;

  const enregistrer = async () => {
    if (enregistrement) return;
    setEnregistrement(true);
    vibrer.valider();
    // Sur disque dans la file AVANT de quitter l'écran : l'envoi se fait
    // ensuite, et se retentera tant qu'il n'aura pas abouti.
    await terminer({ debut, fin });
    // La séance est déjà en file : un échec ici ne coûte que la routine.
    if (maj && mettreAJour && routineId) {
      try {
        await majRoutineSeance.mutateAsync({ id: routineId, saisie: maj.saisie });
      } catch (e) {
        informer("Routine inchangée", e instanceof Error ? e.message : "La mise à jour a échoué.");
      }
    }
    router.replace("/");
  };

  return (
    <Ecran className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <View className="gap-1">
          {/* Rien n'est encore enregistré : l'écran relit avant d'enregistrer (D324). */}
          <Text className="font-semibold text-2xl" accessibilityRole="header">
            Fin de séance
          </Text>
          <Text className="text-muted-foreground">{seance.nom}</Text>
        </View>

        <View className="rounded-lg border border-border">
          <View className="flex-row border-border border-b">
            <Corrigeable
              libelle="Date"
              valeur={formatJour(debut, FUSEAU)}
              onPress={() => setFeuille("date")}
              className="flex-[1.6] rounded-tl-lg"
            />
            <Corrigeable
              libelle="Durée"
              valeur={formaterDuree(duree)}
              onPress={() => setFeuille("duree")}
              className="flex-1 rounded-tr-lg border-border border-l"
            />
          </View>
          <View className="flex-row">
            <Chiffre libelle="Séries" valeur={String(seriesFaites)} />
            <Chiffre libelle="Volume" valeur={formaterCharge(volumeKg, SYSTEME_UNITES)} />
          </View>
        </View>
        {echauffementFait ? (
          <Text className="text-muted-foreground text-sm">
            L'échauffement ne compte pas dans le volume.
          </Text>
        ) : null}

        <Input
          value={seance.note ?? ""}
          onChangeText={(note) => modifier({ ...seance, note })}
          placeholder="Ajouter une note sur la séance…"
          className="h-auto min-h-18 py-2"
          multiline
          maxLength={1000}
          accessibilityLabel="Note de la séance"
        />

        {maj && routine.data ? (
          <MajRoutine
            nom={routine.data.nom}
            changements={maj.changements}
            active={mettreAJour}
            onChange={setMettreAJour}
          />
        ) : null}
      </ScrollView>

      <View className="gap-2 border-border border-t p-4">
        {nonValidees > 0 ? (
          <Encart icone={CircleDashed} role="alert">
            {nonValidees === 1
              ? "1 série non validée : elle ne comptera pas."
              : `${nonValidees} séries non validées : elles ne compteront pas.`}
          </Encart>
        ) : null}
        {/* Hors ligne, un fait et pas une alerte : la séance part seule au retour du réseau (D99). */}
        {horsLigne ? (
          <Encart icone={CloudOff}>
            Pas de réseau. La séance reste sur ton téléphone et partira seule au retour du réseau.
          </Encart>
        ) : null}
        <Button className="h-12" disabled={enregistrement} onPress={() => void enregistrer()}>
          <Text>{enregistrement ? "Enregistrement…" : "Enregistrer la séance"}</Text>
        </Button>
        <View className="flex-row gap-2">
          <Button variant="ghost" className="h-12 flex-1" onPress={reprendre}>
            <Text>Reprendre</Text>
          </Button>
          <Abandonner onPress={abandon} />
        </View>
      </View>

      {/* Montées à l'ouverture : leurs roues partent de la valeur du moment. */}
      {feuille === "duree" ? (
        <FeuilleDuree
          duree={duree}
          onFermer={() => setFeuille(null)}
          onValider={(sec) => {
            setDureeCorrigee(sec);
            setFeuille(null);
          }}
        />
      ) : null}
      {feuille === "date" ? (
        <FeuilleDate
          ilYa={joursEcoules(debut, FUSEAU, finReelle)}
          maintenant={finReelle}
          onFermer={() => setFeuille(null)}
          onValider={(ilYa) => {
            // Le décalage part du jour où la séance a commencé.
            setDecalage(joursEcoules(seance.debut, FUSEAU, finReelle) - ilYa);
            setFeuille(null);
          }}
        />
      ) : null}
    </Ecran>
  );
}

/**
 * Mettre à jour la routine (D347) : un interrupteur, éteint par défaut, et le
 * détail des changements, replié.
 */
function MajRoutine({
  nom,
  changements,
  active,
  onChange,
}: {
  nom: string;
  changements: string[];
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const n = changements.length;
  return (
    <View className="rounded-lg border border-border">
      <View className="flex-row items-center gap-3 p-3">
        <Text className="flex-1 font-medium">Mettre à jour « {nom} »</Text>
        <Switch
          value={active}
          onValueChange={onChange}
          accessibilityLabel={`Mettre à jour la routine ${nom}`}
          trackColorOnClassName="accent-primary"
          trackColorOffClassName="accent-input"
          thumbColorClassName="accent-background"
        />
      </View>
      <Pressable
        onPress={() => setOuvert((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
        className="flex-row items-center gap-1 border-border border-t px-3 py-2.5 active:bg-accent"
      >
        <Text className="flex-1 text-muted-foreground text-sm">
          {n === 1 ? "1 changement" : `${n} changements`}
        </Text>
        <Icon as={ouvert ? ChevronUp : ChevronDown} className="size-4 text-muted-foreground" />
      </Pressable>
      {ouvert ? (
        <View className="gap-1 px-3 pb-3">
          {changements.map((c) => (
            <Text key={c} className="text-sm">
              {c}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Une case qui se corrige d'un appui : son libellé porte un crayon. */
function Corrigeable({
  libelle,
  valeur,
  onPress,
  className,
}: {
  libelle: string;
  valeur: string;
  onPress: () => void;
  className: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${libelle} ${valeur}, modifier`}
      className={cn("items-center gap-0.5 py-3 active:bg-accent", className)}
    >
      <View className="flex-row items-center gap-1">
        <Text className="text-muted-foreground text-xs">{libelle}</Text>
        <Icon as={Pencil} className="size-3 text-muted-foreground" />
      </View>
      <Text className="font-semibold text-lg tabular-nums" numberOfLines={1}>
        {valeur}
      </Text>
    </Pressable>
  );
}

/** Heures et minutes sur deux roues ; 0 h 00 ne se valide pas. */
function FeuilleDuree({
  duree,
  onFermer,
  onValider,
}: {
  duree: number;
  onFermer: () => void;
  onValider: (sec: number) => void;
}) {
  const minutes = Math.min(HEURES_MAX * 60 + 59, Math.round(duree / 60));
  const [h, setH] = useState(Math.floor(minutes / 60));
  const [m, setM] = useState(minutes % 60);
  return (
    <FeuilleBasse visible onFermer={onFermer} glisser={false}>
      <View className="gap-3 px-2 pb-2">
        <Text className="font-semibold text-lg" accessibilityRole="header">
          Durée
        </Text>
        <View className="flex-row gap-2">
          <Roue
            libelles={HEURES}
            index={h}
            onChange={setH}
            accessibilite="Heures"
            className="flex-1"
          />
          <Roue
            libelles={MINUTES}
            index={m}
            onChange={setM}
            accessibilite="Minutes"
            className="flex-1"
          />
        </View>
        <Button
          className="h-12"
          disabled={h === 0 && m === 0}
          onPress={() => onValider((h * 60 + m) * 60)}
        >
          <Text>Valider</Text>
        </Button>
      </View>
    </FeuilleBasse>
  );
}

/** Le jour, sur une roue : aujourd'hui en tête, puis en remontant le temps. */
function FeuilleDate({
  ilYa,
  maintenant,
  onFermer,
  onValider,
}: {
  ilYa: number;
  maintenant: Date;
  onFermer: () => void;
  onValider: (ilYa: number) => void;
}) {
  const [jours] = useState(() =>
    Array.from({ length: JOURS_MAX }, (_, i) => libelleJour(i, maintenant)),
  );
  const [choix, setChoix] = useState(Math.min(JOURS_MAX - 1, Math.max(0, ilYa)));
  return (
    <FeuilleBasse visible onFermer={onFermer} glisser={false}>
      <View className="gap-3 px-2 pb-2">
        <Text className="font-semibold text-lg" accessibilityRole="header">
          Date
        </Text>
        <Roue libelles={jours} index={choix} onChange={setChoix} accessibilite="Jour" />
        <Button className="h-12" onPress={() => onValider(choix)}>
          <Text>Valider</Text>
        </Button>
      </View>
    </FeuilleBasse>
  );
}

/** Le danger en contour (D335), la confirmation derrière. */
function Abandonner({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="outline" className="h-12 flex-1 border-destructive" onPress={onPress}>
      <Text className="text-destructive">Abandonner</Text>
    </Button>
  );
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 py-3">
      <Text className="text-muted-foreground text-xs">{libelle}</Text>
      <Text className="font-semibold text-lg tabular-nums">{valeur}</Text>
    </View>
  );
}

function Encart({
  icone,
  role,
  children,
}: {
  icone: typeof CloudOff;
  role?: "alert";
  children: string;
}) {
  return (
    <View className="flex-row items-center gap-2" accessibilityRole={role}>
      <Icon as={icone} className="size-4.5 text-muted-foreground" />
      <Text className="flex-1 text-muted-foreground text-sm">{children}</Text>
    </View>
  );
}
