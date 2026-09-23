export type ExerciceFactice = {
  id: string;
  nom: string;
  groupe: string;
  equipement: string;
  record?: { kg: number; reps: number };
};

// Noms en français d'usage (D21) : les anglicismes réellement employés en salle
// sont conservés — personne ne dit « tirage vertical à la poulie haute » pour un
// pushdown. Deux cas sont volontairement pénibles et tenus par le test voisin :
// un libellé qui déborde, et des exercices sans record.
export const EXERCICES: ExerciceFactice[] = [
  {
    id: "1",
    nom: "Développé couché barre",
    groupe: "Pectoraux",
    equipement: "Barre",
    record: { kg: 85, reps: 5 },
  },
  {
    id: "2",
    nom: "Développé couché haltères",
    groupe: "Pectoraux",
    equipement: "Haltères",
    record: { kg: 32, reps: 8 },
  },
  { id: "3", nom: "Développé incliné barre", groupe: "Pectoraux", equipement: "Barre" },
  { id: "4", nom: "Développé incliné haltères", groupe: "Pectoraux", equipement: "Haltères" },
  {
    id: "5",
    nom: "Développé décliné à la machine convergente",
    groupe: "Pectoraux",
    equipement: "Machine",
  },
  {
    id: "6",
    nom: "Écarté couché aux haltères sur banc incliné à 30 degrés",
    groupe: "Pectoraux",
    equipement: "Haltères",
  },
  {
    id: "7",
    nom: "Squat barre",
    groupe: "Quadriceps",
    equipement: "Barre",
    record: { kg: 120, reps: 5 },
  },
  { id: "8", nom: "Squat avant", groupe: "Quadriceps", equipement: "Barre" },
  {
    id: "9",
    nom: "Presse à cuisses",
    groupe: "Quadriceps",
    equipement: "Machine",
    record: { kg: 200, reps: 10 },
  },
  { id: "10", nom: "Leg extension à la machine", groupe: "Quadriceps", equipement: "Machine" },
  {
    id: "11",
    nom: "Soulevé de terre barre",
    groupe: "Dos",
    equipement: "Barre",
    record: { kg: 140, reps: 3 },
  },
  { id: "12", nom: "Soulevé de terre roumain", groupe: "Ischios", equipement: "Barre" },
  {
    id: "13",
    nom: "Rowing barre",
    groupe: "Dos",
    equipement: "Barre",
    record: { kg: 80, reps: 8 },
  },
  { id: "14", nom: "Rowing haltère à un bras", groupe: "Dos", equipement: "Haltères" },
  {
    id: "15",
    nom: "Traction pronation",
    groupe: "Dos",
    equipement: "Poids du corps",
    record: { kg: 10, reps: 6 },
  },
  { id: "16", nom: "Traction assistée", groupe: "Dos", equipement: "Machine" },
  {
    id: "17",
    nom: "Curl barre",
    groupe: "Biceps",
    equipement: "Barre",
    record: { kg: 45, reps: 8 },
  },
  { id: "18", nom: "Curl incliné haltères", groupe: "Biceps", equipement: "Haltères" },
  {
    id: "19",
    nom: "Pushdown triceps à la poulie",
    groupe: "Triceps",
    equipement: "Poulie",
    record: { kg: 40, reps: 12 },
  },
  { id: "20", nom: "Dips lestés", groupe: "Triceps", equipement: "Poids du corps" },
  { id: "21", nom: "Élévations latérales haltères", groupe: "Épaules", equipement: "Haltères" },
  {
    id: "22",
    nom: "Développé militaire barre",
    groupe: "Épaules",
    equipement: "Barre",
    record: { kg: 55, reps: 6 },
  },
];
