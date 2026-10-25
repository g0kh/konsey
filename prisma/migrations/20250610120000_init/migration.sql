-- Drop legacy scaffold tables (if present)
DROP TABLE IF EXISTS "Patient" CASCADE;
DROP TABLE IF EXISTS "CouncilSession" CASCADE;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'READONLY');

-- CreateEnum
CREATE TYPE "PresentationStatus" AS ENUM ('PENDING', 'IN_COUNCIL', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DOCTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "tcNo" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "diagnosis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilPresentation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "councilType" TEXT NOT NULL,
    "presentationReason" TEXT NOT NULL,
    "clinicalSummary" TEXT,
    "currentTreatment" TEXT,
    "petScanNote" TEXT,
    "mrNote" TEXT,
    "ctNote" TEXT,
    "pathologyNote" TEXT,
    "imagingNote" TEXT,
    "status" "PresentationStatus" NOT NULL DEFAULT 'PENDING',
    "councilDate" TIMESTAMP(3),
    "councilDecision" TEXT,
    "councilDecisionByUserId" TEXT,
    "councilDecisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouncilPresentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickConsult" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "targetBranch" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT,
    "respondedByUserId" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickConsult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchComment" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilSession" (
    "id" TEXT NOT NULL,
    "councilType" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouncilSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouncilSessionPresentation" (
    "sessionId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "CouncilSessionPresentation_pkey" PRIMARY KEY ("sessionId","presentationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_tcNo_key" ON "Patient"("tcNo");

-- CreateIndex
CREATE INDEX "CouncilSessionPresentation_sessionId_orderIndex_idx" ON "CouncilSessionPresentation"("sessionId", "orderIndex");

-- AddForeignKey
ALTER TABLE "CouncilPresentation" ADD CONSTRAINT "CouncilPresentation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilPresentation" ADD CONSTRAINT "CouncilPresentation_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilPresentation" ADD CONSTRAINT "CouncilPresentation_councilDecisionByUserId_fkey" FOREIGN KEY ("councilDecisionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickConsult" ADD CONSTRAINT "QuickConsult_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "CouncilPresentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickConsult" ADD CONSTRAINT "QuickConsult_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickConsult" ADD CONSTRAINT "QuickConsult_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchComment" ADD CONSTRAINT "BranchComment_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "CouncilPresentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchComment" ADD CONSTRAINT "BranchComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSession" ADD CONSTRAINT "CouncilSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSessionPresentation" ADD CONSTRAINT "CouncilSessionPresentation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CouncilSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSessionPresentation" ADD CONSTRAINT "CouncilSessionPresentation_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "CouncilPresentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
