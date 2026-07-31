-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('WEIGHT_REPS', 'BODYWEIGHT_REPS', 'WEIGHTED_BODYWEIGHT', 'ASSISTED_BODYWEIGHT', 'REPS_ONLY', 'DURATION', 'DURATION_WEIGHT', 'DISTANCE_DURATION');

-- CreateEnum
CREATE TYPE "BodyPart" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'UPPER_ARMS', 'LOWER_ARMS', 'UPPER_LEGS', 'LOWER_LEGS', 'WAIST', 'CARDIO', 'NECK');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL DEFAULT 'WEIGHT_REPS',
    "bodyPart" "BodyPart" NOT NULL,
    "equipment" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secondaryMuscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "animationUrl" TEXT,
    "attribution" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseTranslation" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ExerciseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_externalId_key" ON "Exercise"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Exercise_bodyPart_idx" ON "Exercise"("bodyPart");

-- CreateIndex
CREATE INDEX "Exercise_equipment_idx" ON "Exercise"("equipment");

-- CreateIndex
CREATE INDEX "Exercise_isArchived_idx" ON "Exercise"("isArchived");

-- CreateIndex
CREATE INDEX "ExerciseTranslation_locale_idx" ON "ExerciseTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseTranslation_exerciseId_locale_key" ON "ExerciseTranslation"("exerciseId", "locale");

-- AddForeignKey
ALTER TABLE "ExerciseTranslation" ADD CONSTRAINT "ExerciseTranslation_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
