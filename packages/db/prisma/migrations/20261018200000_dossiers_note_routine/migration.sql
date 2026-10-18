-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "dossierId" TEXT,
ADD COLUMN     "note" VARCHAR(1000);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" VARCHAR(60) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dossier_userId_position_idx" ON "Dossier"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_userId_nom_key" ON "Dossier"("userId", "nom");

-- CreateIndex
CREATE INDEX "Routine_dossierId_idx" ON "Routine"("dossierId");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

