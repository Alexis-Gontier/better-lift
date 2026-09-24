/*
  Warnings:

  - Added the required column `nomFr` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomRecherche` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "nomFr" TEXT NOT NULL,
ADD COLUMN     "nomRecherche" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Exercise_nomRecherche_idx" ON "Exercise"("nomRecherche");
