-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

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

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'BLOCKED', 'DISABLED');

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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaConfiguredAt" TIMESTAMP(3),
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_enrollmentToken_key" ON "Applicant"("enrollmentToken");

-- CreateIndex
CREATE INDEX "Applicant_status_idx" ON "Applicant"("status");

-- CreateIndex
CREATE INDEX "Applicant_childBirthDate_idx" ON "Applicant"("childBirthDate");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentDetails_applicantId_key" ON "EnrollmentDetails"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_roleId_moduleId_key" ON "Permission"("roleId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_email_expiresAt_idx" ON "Invitation"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_usedAt_idx" ON "RecoveryCode"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "EnrollmentDetails" ADD CONSTRAINT "EnrollmentDetails_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

