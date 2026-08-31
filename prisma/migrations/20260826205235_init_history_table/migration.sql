-- CreateEnum
CREATE TYPE "DesignChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateEnum
CREATE TYPE "DesignChangeSource" AS ENUM ('WEB', 'CLI', 'API');

-- CreateEnum
CREATE TYPE "DesignVariableField" AS ENUM ('value', 'unit', 'name', 'description', 'subsystem', 'isProtected');

-- CreateTable
CREATE TABLE "DesignChangeHistory" (
    "id" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "source" "DesignChangeSource" NOT NULL,
    "type" "DesignChangeType" NOT NULL DEFAULT 'UPDATED',
    "changeSetId" TEXT NOT NULL,
    "field" "DesignVariableField",
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignChangeHistory_variableId_createdAt_idx" ON "DesignChangeHistory"("variableId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DesignChangeHistory_changedByUserId_idx" ON "DesignChangeHistory"("changedByUserId");

-- CreateIndex
CREATE INDEX "DesignChangeHistory_changeSetId_idx" ON "DesignChangeHistory"("changeSetId");

-- CreateIndex
CREATE INDEX "DesignChangeHistory_createdAt_idx" ON "DesignChangeHistory"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "DesignVariable_updatedByUserId_idx" ON "DesignVariable"("updatedByUserId");

-- AddForeignKey
ALTER TABLE "DesignChangeHistory" ADD CONSTRAINT "DesignChangeHistory_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "DesignVariable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignChangeHistory" ADD CONSTRAINT "DesignChangeHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
