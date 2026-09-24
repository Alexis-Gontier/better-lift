-- CreateEnum
CREATE TYPE "TypeSerie" AS ENUM ('ECHAUFFEMENT', 'NORMALE', 'ECHEC', 'DEGRESSIVE');

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" VARCHAR(120) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExercice" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "reposSec" INTEGER,
    "supersetGroupe" INTEGER,

    CONSTRAINT "RoutineExercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineSerie" (
    "id" TEXT NOT NULL,
    "routineExerciceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "TypeSerie" NOT NULL DEFAULT 'NORMALE',
    "repsCible" INTEGER,
    "chargeCibleKg" DECIMAL(7,2),

    CONSTRAINT "RoutineSerie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Routine_userId_position_idx" ON "Routine"("userId", "position");

-- CreateIndex
CREATE INDEX "RoutineExercice_exerciseId_idx" ON "RoutineExercice"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineExercice_routineId_position_key" ON "RoutineExercice"("routineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineSerie_routineExerciceId_position_key" ON "RoutineSerie"("routineExerciceId", "position");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercice" ADD CONSTRAINT "RoutineExercice_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercice" ADD CONSTRAINT "RoutineExercice_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineSerie" ADD CONSTRAINT "RoutineSerie_routineExerciceId_fkey" FOREIGN KEY ("routineExerciceId") REFERENCES "RoutineExercice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
