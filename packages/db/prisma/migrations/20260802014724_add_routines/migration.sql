-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('WARMUP', 'NORMAL', 'FAILURE', 'DROP');

-- CreateTable
CREATE TABLE "RoutineFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "name" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "lastPerformedAt" TIMESTAMP(3),
    "performedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "notes" VARCHAR(500),
    "restSec" INTEGER,
    "supersetGroup" INTEGER,

    CONSTRAINT "RoutineExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineSet" (
    "id" TEXT NOT NULL,
    "routineExerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "SetType" NOT NULL DEFAULT 'NORMAL',
    "targetReps" INTEGER,
    "targetWeightKg" DECIMAL(7,2),
    "targetDurationSec" INTEGER,
    "targetDistanceM" DECIMAL(9,2),
    "targetRpe" DECIMAL(3,1),

    CONSTRAINT "RoutineSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineFolder_userId_position_idx" ON "RoutineFolder"("userId", "position");

-- CreateIndex
CREATE INDEX "Routine_userId_deletedAt_idx" ON "Routine"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Routine_folderId_position_idx" ON "Routine"("folderId", "position");

-- CreateIndex
CREATE INDEX "RoutineExercise_exerciseId_idx" ON "RoutineExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineExercise_routineId_position_key" ON "RoutineExercise"("routineId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineSet_routineExerciseId_position_key" ON "RoutineSet"("routineExerciseId", "position");

-- AddForeignKey
ALTER TABLE "RoutineFolder" ADD CONSTRAINT "RoutineFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "RoutineFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineSet" ADD CONSTRAINT "RoutineSet_routineExerciseId_fkey" FOREIGN KEY ("routineExerciseId") REFERENCES "RoutineExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
