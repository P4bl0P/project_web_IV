CREATE TYPE "MemberType" AS ENUM ('EDUCANDO', 'RESPONSABLE');

ALTER TABLE "Applicant"
  ADD COLUMN "memberType" "MemberType" NOT NULL DEFAULT 'EDUCANDO',
  ADD COLUMN "censusBranch" TEXT;

CREATE INDEX "Applicant_memberType_idx" ON "Applicant"("memberType");
CREATE INDEX "Applicant_censusBranch_idx" ON "Applicant"("censusBranch");
