-- CreateTable
CREATE TABLE "CouncilMember" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personalBio" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouncilMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouncilMember_displayOrder_idx" ON "CouncilMember"("displayOrder");

-- CreateIndex
CREATE INDEX "CouncilMember_role_idx" ON "CouncilMember"("role");
