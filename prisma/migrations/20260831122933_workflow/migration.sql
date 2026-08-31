-- CreateEnum
CREATE TYPE "AnalysisDirection" AS ENUM ('PULL', 'PUSH');

-- AlterTable
ALTER TABLE "DesignChangeHistory" ADD COLUMN     "runId" TEXT;

-- AlterTable
ALTER TABLE "DesignVariable" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "modelId" TEXT,
    "label" TEXT,
    "userId" TEXT NOT NULL,
    "source" "DesignChangeSource" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisModel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AnalysisModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisModelItem" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "direction" "AnalysisDirection" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "AnalysisModelItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowRun_modelId_createdAt_idx" ON "WorkflowRun"("modelId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowRun_userId_createdAt_idx" ON "WorkflowRun"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkflowRun_createdAt_idx" ON "WorkflowRun"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisModel_slug_key" ON "AnalysisModel"("slug");

-- CreateIndex
CREATE INDEX "AnalysisModel_ownerId_idx" ON "AnalysisModel"("ownerId");

-- CreateIndex
CREATE INDEX "AnalysisModelItem_modelId_direction_position_idx" ON "AnalysisModelItem"("modelId", "direction", "position");

-- CreateIndex
CREATE INDEX "AnalysisModelItem_variableId_idx" ON "AnalysisModelItem"("variableId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisModelItem_modelId_variableId_direction_key" ON "AnalysisModelItem"("modelId", "variableId", "direction");

-- CreateIndex
CREATE INDEX "DesignChangeHistory_runId_idx" ON "DesignChangeHistory"("runId");

-- AddForeignKey
ALTER TABLE "DesignChangeHistory" ADD CONSTRAINT "DesignChangeHistory_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AnalysisModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisModel" ADD CONSTRAINT "AnalysisModel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisModelItem" ADD CONSTRAINT "AnalysisModelItem_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AnalysisModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisModelItem" ADD CONSTRAINT "AnalysisModelItem_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "DesignVariable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
