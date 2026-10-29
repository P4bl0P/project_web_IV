-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'WAITLIST', 'ADMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScoutBranch" AS ENUM ('CASTOR', 'LOBATO', 'RANGER', 'PIONERO', 'RUTA');

-- CreateTable
CREATE TABLE "Application" (
    "id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBranch" "ScoutBranch" NOT NULL,
    "childName" VARCHAR(150) NOT NULL,
    "childBirthDate" DATE NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "fatherName" VARCHAR(150),
    "fatherPhone" VARCHAR(30),
    "fatherEmail" VARCHAR(150),
    "motherName" VARCHAR(150),
    "motherPhone" VARCHAR(30),
    "motherEmail" VARCHAR(150),
    "motivation" TEXT NOT NULL,
    "councilNotes" TEXT,
    "hasFamilyInGroup" BOOLEAN NOT NULL DEFAULT false,
    "fromAnotherGroup" BOOLEAN NOT NULL DEFAULT false,
    "socialInclusion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "birthDate" DATE NOT NULL,
    "currentBranch" "ScoutBranch" NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "primaryPhone" VARCHAR(30) NOT NULL,
    "primaryEmail" VARCHAR(150) NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_status_requestedBranch_requestDate_idx" ON "Application"("status", "requestedBranch", "requestDate");

-- CreateIndex
CREATE UNIQUE INDEX "Member_applicationId_key" ON "Member"("applicationId");

-- CreateIndex
CREATE INDEX "Member_currentBranch_isActive_idx" ON "Member"("currentBranch", "isActive");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
