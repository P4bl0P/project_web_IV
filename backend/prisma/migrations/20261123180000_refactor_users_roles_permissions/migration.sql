-- ============================================================================
-- Migración incremental segura: usuarios, cargos, módulos, permisos y auditoría
-- Conserva todos los registros existentes y migra los permisos previos sin pérdida.
-- ============================================================================

-- 1. Ampliar User (MFA pendiente, bloqueo por fuerza bruta, FK segura y normalización de email)
ALTER TABLE "User" ADD COLUMN "mfaPendingSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);

UPDATE "User" u
SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"))
  AND NOT EXISTS (
    SELECT 1
    FROM "User" other
    WHERE other."id" <> u."id"
      AND lower(btrim(other."email")) = lower(btrim(u."email"))
  );

ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";
ALTER TABLE "User"
  ADD CONSTRAINT "User_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- 2. Tabla dedicada para retos pre-MFA (aislada de Session)
CREATE TABLE "MfaChallenge" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MfaChallenge_tokenHash_key" ON "MfaChallenge"("tokenHash");
CREATE INDEX "MfaChallenge_userId_expiresAt_idx" ON "MfaChallenge"("userId", "expiresAt");

ALTER TABLE "MfaChallenge"
  ADD CONSTRAINT "MfaChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Ampliar Role con descripción y fecha de actualización
ALTER TABLE "Role" ADD COLUMN "description" TEXT;
ALTER TABLE "Role" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Role"
SET "description" = CASE
  WHEN lower(btrim("name")) = 'jefatura' THEN 'Coordinación de grupo, programación de Ronda Solar y Kraal.'
  WHEN lower(btrim("name")) IN ('tesorería', 'tesoreria') THEN 'Gestión económica, cuotas, remesas y presupuestos del grupo.'
  WHEN lower(btrim("name")) IN ('secretaría', 'secretaria') THEN 'Gestión administrativa de solicitudes, inscripciones, censo y comunicación.'
  ELSE "description"
END
WHERE "description" IS NULL;

-- 4. Ampliar Module como registro estructurado con clave única
ALTER TABLE "Module" ADD COLUMN "key" TEXT;
ALTER TABLE "Module" ADD COLUMN "description" TEXT;
ALTER TABLE "Module" ADD COLUMN "route" TEXT;
ALTER TABLE "Module" ADD COLUMN "icon" TEXT;
ALTER TABLE "Module" ADD COLUMN "isImplemented" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Module" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Module" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Module" ADD COLUMN "supportsRead" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Module" ADD COLUMN "supportsCreate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Module" ADD COLUMN "supportsUpdate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Module" ADD COLUMN "supportsDelete" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Module" ADD COLUMN "specialActions" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Module" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

WITH normalized_modules AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(
        CASE
          WHEN lower(btrim("name")) = 'jefatura' THEN 'jefatura'
          WHEN lower(btrim("name")) IN ('secretaría', 'secretaria') THEN 'secretaria'
          WHEN lower(btrim("name")) IN ('tesorería', 'tesoreria') THEN 'tesoreria'
          ELSE trim(both '-' from regexp_replace(lower(translate(btrim("name"), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', '-', 'g'))
        END,
        ''
      ),
      'modulo-' || substr("id", 1, 8)
    ) AS base_key
  FROM "Module"
),
deduped_modules AS (
  SELECT
    "id",
    base_key,
    row_number() OVER (PARTITION BY base_key ORDER BY "id") AS seq
  FROM normalized_modules
)
UPDATE "Module" m
SET "key" = CASE
  WHEN d.seq = 1 THEN d.base_key
  ELSE d.base_key || '-' || d.seq::text
END
FROM deduped_modules d
WHERE m."id" = d."id" AND m."key" IS NULL;

UPDATE "Module"
SET
  "description" = COALESCE("description", CASE
    WHEN "key" = 'jefatura' THEN 'Coordinación de ramas, Kraal de responsables y programación de la Ronda Solar.'
    WHEN "key" = 'secretaria' THEN 'Gestión de solicitudes, lista de espera, inscripciones, censo oficial y contenido público del Consejo.'
    WHEN "key" = 'tesoreria' THEN 'Remesas bancarias SEPA, cuotas trimestrales y presupuestos de campamentos.'
    ELSE NULL
  END),
  "route" = COALESCE("route", CASE
    WHEN "key" = 'jefatura' THEN '/gestion/jefatura'
    WHEN "key" = 'secretaria' THEN '/gestion/secretaria'
    WHEN "key" = 'tesoreria' THEN '/gestion/tesoreria'
    ELSE '/gestion/modulo/' || "key"
  END),
  "icon" = COALESCE("icon", CASE
    WHEN "key" = 'jefatura' THEN 'compass'
    WHEN "key" = 'secretaria' THEN 'folder-kanban'
    WHEN "key" = 'tesoreria' THEN 'wallet'
    ELSE 'layers'
  END),
  "isImplemented" = CASE
    WHEN "key" = 'secretaria' THEN true
    ELSE "isImplemented"
  END,
  "isSystem" = CASE
    WHEN "key" IN ('jefatura', 'secretaria', 'tesoreria') THEN true
    ELSE "isSystem"
  END,
  "displayOrder" = CASE
    WHEN "key" = 'jefatura' THEN 1
    WHEN "key" = 'secretaria' THEN 2
    WHEN "key" = 'tesoreria' THEN 3
    ELSE "displayOrder"
  END,
  "specialActions" = CASE
    WHEN "key" = 'secretaria' THEN '[{"key":"read_medical_data","label":"Datos médicos","description":"Consultar ficha médica completa, alergias, enfermedades y medicación."},{"key":"read_bank_data","label":"Datos bancarios (SEPA)","description":"Consultar IBAN completo y DNI del titular bancario."},{"key":"preview_aurora","label":"Vista previa Aurora","description":"Consultar la vista previa del payload preparado para Aurora."},{"key":"manage_web_content","label":"Contenido de la web","description":"Gestionar integrantes y orden del Consejo en la página pública."}]'::jsonb
    WHEN "key" = 'tesoreria' THEN '[{"key":"export_sepa","label":"Exportar remesas SEPA","description":"Generar y descargar archivos de remesa bancaria SEPA."}]'::jsonb
    ELSE "specialActions"
  END;

ALTER TABLE "Module" ALTER COLUMN "key" SET NOT NULL;
CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");

-- 5. Ampliar Permission con acceso explícito al módulo y permisos especiales
ALTER TABLE "Permission" ADD COLUMN "canAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Permission" ADD COLUMN "specialPermissions" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Permission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrar permisos existentes que tuvieran alguna operación CRUD activa
UPDATE "Permission"
SET "canAccess" = true
WHERE "canRead" = true OR "canCreate" = true OR "canUpdate" = true OR "canDelete" = true;

UPDATE "Permission" p
SET "specialPermissions" = '["read_medical_data","read_bank_data","preview_aurora","manage_web_content"]'::jsonb
FROM "Module" m
WHERE p."moduleId" = m."id"
  AND m."key" = 'secretaria'
  AND p."canUpdate" = true;

-- Transición desde el seed previo vacío: si un cargo inicial no tenía ningún permiso activo en todo el sistema,
-- se le asigna su acceso inicial predeterminado a su módulo correspondiente sin tocar configuraciones personalizadas.
UPDATE "Permission" p
SET
  "canAccess" = true,
  "canRead" = true,
  "canCreate" = true,
  "canUpdate" = true,
  "canDelete" = true,
  "specialPermissions" = CASE
    WHEN m."key" = 'secretaria' THEN '["read_medical_data","read_bank_data","preview_aurora","manage_web_content"]'::jsonb
    WHEN m."key" = 'tesoreria' THEN '["export_sepa"]'::jsonb
    ELSE '[]'::jsonb
  END
FROM "Role" r, "Module" m
WHERE p."roleId" = r."id"
  AND p."moduleId" = m."id"
  AND (
    (lower(btrim(r."name")) = 'jefatura' AND m."key" = 'jefatura') OR
    (lower(btrim(r."name")) IN ('tesorería', 'tesoreria') AND m."key" = 'tesoreria') OR
    (lower(btrim(r."name")) IN ('secretaría', 'secretaria') AND m."key" = 'secretaria')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "Permission" existing
    WHERE existing."roleId" = r."id"
      AND (
        existing."canAccess" = true
        OR existing."canRead" = true
        OR existing."canCreate" = true
        OR existing."canUpdate" = true
        OR existing."canDelete" = true
      )
  );

-- 6. Ampliar AuditEvent con metadatos estructurados y valores previos/nuevos
ALTER TABLE "AuditEvent" ADD COLUMN "targetType" TEXT;
ALTER TABLE "AuditEvent" ADD COLUMN "targetId" TEXT;
ALTER TABLE "AuditEvent" ADD COLUMN "previousValues" JSONB;
ALTER TABLE "AuditEvent" ADD COLUMN "newValues" JSONB;

CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");
CREATE INDEX "AuditEvent_targetType_targetId_idx" ON "AuditEvent"("targetType", "targetId");
