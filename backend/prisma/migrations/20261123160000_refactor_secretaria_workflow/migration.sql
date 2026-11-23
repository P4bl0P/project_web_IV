-- CreateEnum
CREATE TYPE "ClosureReason" AS ENUM (
  'SOLICITUD_RETIRADA',
  'SOLICITUD_RECHAZADA',
  'OFERTA_RECHAZADA',
  'OFERTA_CADUCADA',
  'BAJA_VOLUNTARIA',
  'BAJA_DISCIPLINARIA',
  'BAJA_POR_EDAD',
  'DUPLICADO',
  'OTRO'
);

-- Renombrar columna manteniendo datos existentes
ALTER TABLE "Applicant" RENAME COLUMN "ApartmentDoor" TO "apartmentDoor";

-- Permitir campos nulos en Fase 1 (se completan exclusivamente en Inscripción / Censo)
ALTER TABLE "Applicant" ALTER COLUMN "gender" DROP NOT NULL;
ALTER TABLE "Applicant" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "Applicant" ALTER COLUMN "streetAddress" DROP NOT NULL;
ALTER TABLE "Applicant" ALTER COLUMN "postalCode" DROP NOT NULL;
ALTER TABLE "Applicant" ALTER COLUMN "postalCode" DROP DEFAULT;
ALTER TABLE "Applicant" ALTER COLUMN "municipality" DROP NOT NULL;
ALTER TABLE "Applicant" ALTER COLUMN "municipality" DROP DEFAULT;
ALTER TABLE "Applicant" ALTER COLUMN "province" DROP NOT NULL;
ALTER TABLE "Applicant" ALTER COLUMN "province" DROP DEFAULT;

-- Desglose seguro de apellidos conservando datos previos
ALTER TABLE "Applicant" ADD COLUMN "childLastName1" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "childLastName2" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "hasNoSecondLastName" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Applicant" ADD COLUMN "noSecondLastNameJustification" TEXT;

UPDATE "Applicant"
SET
  "childLastName1" = CASE
    WHEN btrim("childLastName") = '' THEN ''
    ELSE split_part(regexp_replace(btrim("childLastName"), '\s+', ' ', 'g'), ' ', 1)
  END,
  "childLastName2" = CASE
    WHEN position(' ' in regexp_replace(btrim("childLastName"), '\s+', ' ', 'g')) > 0
    THEN substr(
      regexp_replace(btrim("childLastName"), '\s+', ' ', 'g'),
      position(' ' in regexp_replace(btrim("childLastName"), '\s+', ' ', 'g')) + 1
    )
    ELSE NULL
  END,
  "hasNoSecondLastName" = CASE
    WHEN position(' ' in regexp_replace(btrim("childLastName"), '\s+', ' ', 'g')) = 0 THEN true
    ELSE false
  END,
  "noSecondLastNameJustification" = CASE
    WHEN position(' ' in regexp_replace(btrim("childLastName"), '\s+', ' ', 'g')) = 0
    THEN 'Migrado desde registro previo con un único apellido'
    ELSE NULL
  END;

ALTER TABLE "Applicant" ALTER COLUMN "childLastName1" SET NOT NULL;

-- Campos de unidad familiar, relación de tutores, seguridad del enlace mágico, revisión, censo y baja
ALTER TABLE "Applicant" ADD COLUMN "familyUnitId" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "parent1Relationship" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "parent2Relationship" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "enrollmentTokenHash" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "tokenUsedAt" TIMESTAMP(3);
ALTER TABLE "Applicant" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Applicant" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "admittedById" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "censusSolarRound" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "censusBranch" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "Applicant" ADD COLUMN "closedById" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "closureReason" "ClosureReason";
ALTER TABLE "Applicant" ADD COLUMN "closureNotes" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "previousStatus" "ApplicationStatus";
ALTER TABLE "Applicant" ADD COLUMN "idempotencyKey" TEXT;

-- Campos adicionales en EnrollmentDetails (unicidad de DNI opcional, contacto de emergencia, SEPA y firmas)
ALTER TABLE "EnrollmentDetails" ADD COLUMN "childDniHash" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "consentTextVersion" TEXT NOT NULL DEFAULT '2026.1';
ALTER TABLE "EnrollmentDetails" ADD COLUMN "emergencyContactName" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "emergencyContactPhone" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "emergencyContactRelationship" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "accountHolderAddress" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "accountHolderMunicipality" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "accountHolderPostalCode" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "ibanLast4" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "sepaSignedAt" TIMESTAMP(3);
ALTER TABLE "EnrollmentDetails" ADD COLUMN "signer1FullName" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "signer1Dni" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "signer2FullName" TEXT;
ALTER TABLE "EnrollmentDetails" ADD COLUMN "signer2Dni" TEXT;

UPDATE "EnrollmentDetails"
SET "ibanLast4" = right(regexp_replace("iban", '\s+', '', 'g'), 4)
WHERE "iban" IS NOT NULL AND length(regexp_replace("iban", '\s+', '', 'g')) >= 4;

-- Índices únicos y de rendimiento
CREATE UNIQUE INDEX "Applicant_enrollmentTokenHash_key" ON "Applicant"("enrollmentTokenHash");
CREATE UNIQUE INDEX "Applicant_idempotencyKey_key" ON "Applicant"("idempotencyKey");
CREATE INDEX "Applicant_status_createdAt_idx" ON "Applicant"("status", "createdAt");
CREATE INDEX "Applicant_familyUnitId_idx" ON "Applicant"("familyUnitId");
CREATE INDEX "Applicant_parent1Email_idx" ON "Applicant"("parent1Email");
CREATE INDEX "Applicant_parent1Phone_idx" ON "Applicant"("parent1Phone");
CREATE UNIQUE INDEX "EnrollmentDetails_childDniHash_key" ON "EnrollmentDetails"("childDniHash");
CREATE INDEX "AuditEvent_resource_idx" ON "AuditEvent"("resource");
