-- CreateTable
CREATE TABLE "CouncilSessionAttendee" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouncilSessionAttendee_pkey" PRIMARY KEY ("sessionId","userId")
);

-- CreateTable
CREATE TABLE "PresentationAttendee" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "branchSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresentationAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouncilSessionAttendee_sessionId_idx" ON "CouncilSessionAttendee"("sessionId");

-- CreateIndex
CREATE INDEX "PresentationAttendee_presentationId_idx" ON "PresentationAttendee"("presentationId");

-- CreateIndex
CREATE UNIQUE INDEX "PresentationAttendee_presentationId_userId_key" ON "PresentationAttendee"("presentationId", "userId");

-- CreateIndex
CREATE INDEX "CouncilSession_councilType_sessionDate_idx" ON "CouncilSession"("councilType", "sessionDate");

-- CreateIndex
CREATE INDEX "CouncilPresentation_councilType_status_createdAt_idx" ON "CouncilPresentation"("councilType", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "CouncilSessionAttendee" ADD CONSTRAINT "CouncilSessionAttendee_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CouncilSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilSessionAttendee" ADD CONSTRAINT "CouncilSessionAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationAttendee" ADD CONSTRAINT "PresentationAttendee_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "CouncilPresentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationAttendee" ADD CONSTRAINT "PresentationAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
