-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routineId" TEXT,
    "nom" VARCHAR(120) NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeanceExercice" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "reposSec" INTEGER,

    CONSTRAINT "SeanceExercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeanceSerie" (
    "id" TEXT NOT NULL,
    "seanceExerciceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "TypeSerie" NOT NULL DEFAULT 'NORMALE',
    "reps" INTEGER,
    "chargeKg" DECIMAL(7,2),
    "faite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SeanceSerie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Seance_userId_debut_idx" ON "Seance"("userId", "debut" DESC);

-- CreateIndex
CREATE INDEX "Seance_routineId_idx" ON "Seance"("routineId");

-- CreateIndex
CREATE INDEX "SeanceExercice_exerciseId_idx" ON "SeanceExercice"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "SeanceExercice_seanceId_position_key" ON "SeanceExercice"("seanceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SeanceSerie_seanceExerciceId_position_key" ON "SeanceSerie"("seanceExerciceId", "position");

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeanceExercice" ADD CONSTRAINT "SeanceExercice_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeanceExercice" ADD CONSTRAINT "SeanceExercice_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeanceSerie" ADD CONSTRAINT "SeanceSerie_seanceExerciceId_fkey" FOREIGN KEY ("seanceExerciceId") REFERENCES "SeanceExercice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
