-- CreateTable
CREATE TABLE "SupplementaryOpinion" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplementaryOpinion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplementaryOpinion_presentationId_createdAt_idx" ON "SupplementaryOpinion"("presentationId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupplementaryOpinion" ADD CONSTRAINT "SupplementaryOpinion_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "CouncilPresentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementaryOpinion" ADD CONSTRAINT "SupplementaryOpinion_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
