-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDIENTE_REVISION', 'LISTA_ESPERA', 'PLAZA_OFERTADA', 'INSCRIPCION_COMPLETADA', 'CENSADO', 'BAJA');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('MENOR', 'MAYOR', 'EMANCIPADO');

-- CreateEnum
CREATE TYPE "CustodyType" AS ENUM ('SIN_ESPECIFICAR', 'TUTELA_LEGAL', 'CUSTODIA_UNICA', 'CUSTODIA_CONJUNTA');

-- CreateEnum
CREATE TYPE "CircularPreference" AS ENUM ('EMAIL', 'CORREO_POSTAL');

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "childFirstName" TEXT NOT NULL,
    "childLastName" TEXT NOT NULL,
    "childBirthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MASCULINO',
    "streetAddress" TEXT NOT NULL,
    "streetNumber" TEXT,
    "ApartmentDoor" TEXT,
    "postalCode" TEXT NOT NULL DEFAULT '41089',
    "municipality" TEXT NOT NULL DEFAULT 'Dos Hermanas',
    "province" TEXT NOT NULL DEFAULT 'Sevilla',
    "parent1FirstName" TEXT NOT NULL,
    "parent1LastName" TEXT NOT NULL,
    "parent1Phone" TEXT NOT NULL,
    "parent1Email" TEXT NOT NULL,
    "parent2FirstName" TEXT,
    "parent2LastName" TEXT,
    "parent2Phone" TEXT,
    "parent2Email" TEXT,
    "motivation" TEXT,
    "hasFamilyInGroup" BOOLEAN NOT NULL DEFAULT false,
    "familyMemberDetails" TEXT,
    "comesFromOtherGroup" BOOLEAN NOT NULL DEFAULT false,
    "originGroupDetails" TEXT,
    "socialInclusionPriority" BOOLEAN NOT NULL DEFAULT false,
    "kraalInternalNotes" TEXT,
    "enrollmentToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "admittedAt" TIMESTAMP(3),

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentDetails" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicantId" TEXT NOT NULL,
    "childDni" TEXT,
    "childPhone" TEXT,
    "childEmail" TEXT,
    "legalStatus" "LegalStatus" NOT NULL DEFAULT 'MENOR',
    "circularPreference" "CircularPreference" NOT NULL DEFAULT 'EMAIL',
    "parent1Dni" TEXT NOT NULL,
    "parent2Dni" TEXT,
    "parentsMaritalStatus" TEXT,
    "custodyType" "CustodyType" NOT NULL DEFAULT 'SIN_ESPECIFICAR',
    "acceptsDataStorage" BOOLEAN NOT NULL DEFAULT true,
    "acceptsDataTransfer" BOOLEAN NOT NULL DEFAULT true,
    "authorizesImages" BOOLEAN NOT NULL DEFAULT true,
    "bloodType" TEXT,
    "chronicDiseases" TEXT,
    "allergies" TEXT,
    "medHeadache" TEXT,
    "medFever" TEXT,
    "medStomach" TEXT,
    "medThroat" TEXT,
    "medicalObservations" TEXT,
    "authorizesEmergency" BOOLEAN NOT NULL DEFAULT true,
    "accountHolderName" TEXT NOT NULL,
    "accountHolderDni" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "authorizesSepa" BOOLEAN NOT NULL DEFAULT true,
    "signatureParent1" TEXT NOT NULL,
    "signedAtParent1" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureParent2" TEXT,
    "signedAtParent2" TIMESTAMP(3),

    CONSTRAINT "EnrollmentDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_enrollmentToken_key" ON "Applicant"("enrollmentToken");

-- CreateIndex
CREATE INDEX "Applicant_status_idx" ON "Applicant"("status");

-- CreateIndex
CREATE INDEX "Applicant_childBirthDate_idx" ON "Applicant"("childBirthDate");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentDetails_applicantId_key" ON "EnrollmentDetails"("applicantId");

-- AddForeignKey
ALTER TABLE "EnrollmentDetails" ADD CONSTRAINT "EnrollmentDetails_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
