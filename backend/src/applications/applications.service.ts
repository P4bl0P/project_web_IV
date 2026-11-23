import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  ApplicationStatus,
  Gender,
  type Applicant,
  type EnrollmentDetails,
} from '@prisma/client';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { canReadSensitiveMedicalOrBankData, type AuthenticatedRequest } from '../auth.guard';
import {
  assertTransitionAllowed,
  CLOSURE_REASON_LABELS,
  EDITABLE_PHASE1_STATUSES,
  resolveReactivationTargetStatus,
} from './application-state-machine';
import { AuroraContactMapper, type AuroraIntegrationConfig } from './aurora-contact.mapper';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateDirectCensusDto, UpdateCensusDto } from './dto/direct-census.dto';
import {
  DeactivateApplicationDto,
  OfferSpotDto,
  ReactivateApplicationDto,
  ReturnToWaitlistDto,
} from './dto/lifecycle-actions.dto';
import { QueryApplicationsDto, SortField, SortOrder } from './dto/query-applications.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { calculateScoutBranchForRound, extractDateParts } from './scout-branch.util';
import { SensitiveDataService } from './sensitive-data.service';
import {
  assertValidDniFormat,
  normalizeDigits,
  normalizeDni,
  normalizeIban,
  normalizeOptionalString,
  normalizePhone,
  normalizeTextForSearch,
  resolveAndValidateSurnames,
  validateBirthDateAndBranch,
  VALIDATION_REGEX,
} from './validation.util';

export interface AuditContext {
  actorId?: string | null;
  ipAddress?: string;
  user?: AuthenticatedRequest['user'];
}

export interface SanitizedEnrollmentSummary {
  id: string;
  applicantId: string;
  createdAt: Date;
  updatedAt: Date;
  legalStatus: EnrollmentDetails['legalStatus'];
  circularPreference: EnrollmentDetails['circularPreference'];
  parentsMaritalStatus: string | null;
  custodyType: EnrollmentDetails['custodyType'];
  acceptsDataStorage: boolean;
  acceptsDataTransfer: boolean;
  authorizesImages: boolean;
  consentTextVersion: string;
  authorizesEmergency: boolean;
  accountHolderName: string;
  ibanMasked: string;
  ibanLast4: string | null;
  authorizesSepa: boolean;
  sepaSignedAt: Date | null;
  hasChildDni: boolean;
  childDniMasked: string | null;
  hasMedicalInfo: boolean;
  hasSignatureParent1: boolean;
  hasSignatureParent2: boolean;
  signer1FullName: string | null;
  signedAtParent1: Date;
  signer2FullName: string | null;
  signedAtParent2: Date | null;
  childEmail: string | null;
  childPhone: string | null;
  medicalAccessRestricted?: boolean;
  bankAccessRestricted?: boolean;
}

export interface DecryptedEnrollmentDetail extends EnrollmentDetails {
  ibanMasked: string;
  hasChildDni: boolean;
  childDniMasked: string | null;
  hasSignatureParent1: boolean;
  hasSignatureParent2: boolean;
  medicalAccessRestricted?: boolean;
  bankAccessRestricted?: boolean;
}

export type EnrichedApplicant = Omit<Applicant, 'enrollmentToken' | 'enrollmentTokenHash'> & {
  enrollmentToken: string | null;
  enrollment?: SanitizedEnrollmentSummary | DecryptedEnrollmentDetail | null;
  calculatedBranch: string;
  currentAge: number;
  solarRound: string;
  priorityScore: number;
  isIncomplete: boolean;
  missingFields: string[];
  canAdmitToCensus: boolean;
  missingForCensus: string[];
  potentialDuplicateIds?: string[];
  familySiblings?: Array<{
    id: string;
    childFirstName: string;
    childLastName: string;
    status: ApplicationStatus;
    calculatedBranch: string;
  }>;
  tokenExpired?: boolean;
};

export interface MagicEnrollmentPublicView {
  id: string;
  status: ApplicationStatus;
  childFirstName: string;
  childLastName1: string;
  childLastName2: string | null;
  hasNoSecondLastName: boolean;
  noSecondLastNameJustification: string | null;
  childLastName: string;
  childBirthDate: Date;
  gender: Gender | null;
  streetAddress: string | null;
  streetNumber: string | null;
  apartmentDoor: string | null;
  postalCode: string | null;
  municipality: string | null;
  province: string | null;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Relationship: string | null;
  parent2FirstName: string | null;
  parent2LastName: string | null;
  parent2Phone: string | null;
  parent2Email: string | null;
  parent2Relationship: string | null;
  calculatedBranch: string;
  currentAge: number;
  solarRound: string;
  tokenExpiresAt: Date | null;
}

export interface PaginatedApplicationsResult {
  items: EnrichedApplicant[];
  totalMatching: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sectionCounts: {
    INITIAL: number;
    WAITLIST: number;
    OFFERED: number;
    CENSUS: number;
    ARCHIVED: number;
  };
}

const BRANCH_ORDER: Record<string, number> = {
  'Menor de 6 años': 0,
  Castores: 1,
  Lobatos: 2,
  Rangers: 3,
  Pioneros: 4,
  Rutas: 5,
  Responsables: 6,
};

export function normalizeSearchText(text: string | null | undefined): string {
  return normalizeTextForSearch(text);
}

@Injectable()
export class ApplicationsService {
  private readonly crypto: SensitiveDataService;
  private readonly aurora: AuroraContactMapper;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() sensitiveData?: SensitiveDataService,
    @Optional() auroraMapper?: AuroraContactMapper,
  ) {
    this.crypto = sensitiveData ?? new SensitiveDataService();
    this.aurora = auroraMapper ?? new AuroraContactMapper();
  }

  /**
   * Calcula dinámicamente la rama scout según la edad que el educando cumple durante la Ronda Solar.
   */
  calculateScoutBranch(
    birthDate: Date,
    solarRound?: string | number | Date,
  ): { branch: string; age: number; solarRoundLabel: string } {
    const calc = calculateScoutBranchForRound(birthDate, solarRound);
    return {
      branch: calc.branch,
      age: calc.age,
      solarRoundLabel: calc.solarRound.label,
    };
  }

  private decryptEnrollmentFields(enrollment: EnrollmentDetails): EnrollmentDetails {
    return {
      ...enrollment,
      childDni: this.crypto.decrypt(enrollment.childDni),
      parent1Dni: this.crypto.decrypt(enrollment.parent1Dni) ?? '',
      parent2Dni: this.crypto.decrypt(enrollment.parent2Dni),
      accountHolderDni: this.crypto.decrypt(enrollment.accountHolderDni) ?? '',
      iban: this.crypto.decrypt(enrollment.iban) ?? '',
      chronicDiseases: this.crypto.decrypt(enrollment.chronicDiseases),
      allergies: this.crypto.decrypt(enrollment.allergies),
      medHeadache: this.crypto.decrypt(enrollment.medHeadache),
      medFever: this.crypto.decrypt(enrollment.medFever),
      medStomach: this.crypto.decrypt(enrollment.medStomach),
      medThroat: this.crypto.decrypt(enrollment.medThroat),
      medicalObservations: this.crypto.decrypt(enrollment.medicalObservations),
      signatureParent1: this.crypto.decrypt(enrollment.signatureParent1) ?? '',
      signatureParent2: this.crypto.decrypt(enrollment.signatureParent2),
    };
  }

  private encryptEnrollmentData<
    T extends {
      childDni?: string | null;
      parent1Dni?: string;
      parent2Dni?: string | null;
      accountHolderDni?: string;
      iban?: string;
      chronicDiseases?: string | null;
      allergies?: string | null;
      medHeadache?: string | null;
      medFever?: string | null;
      medStomach?: string | null;
      medThroat?: string | null;
      medicalObservations?: string | null;
      signatureParent1?: string;
      signatureParent2?: string | null;
    },
  >(data: T) {
    const cleanChildDni = normalizeDni(data.childDni);
    const cleanParent1Dni =
      data.parent1Dni !== undefined ? normalizeDni(data.parent1Dni) ?? '' : undefined;
    const cleanParent2Dni =
      data.parent2Dni !== undefined ? normalizeDni(data.parent2Dni) : undefined;
    const cleanHolderDni =
      data.accountHolderDni !== undefined ? normalizeDni(data.accountHolderDni) ?? '' : undefined;
    const cleanIban = data.iban !== undefined ? normalizeIban(data.iban) : undefined;

    return {
      ...(data.childDni !== undefined
        ? {
            childDni: cleanChildDni ? this.crypto.encrypt(cleanChildDni) : null,
            childDniHash: this.crypto.hashDni(cleanChildDni),
          }
        : {}),
      ...(cleanParent1Dni !== undefined
        ? { parent1Dni: this.crypto.encrypt(cleanParent1Dni) ?? '' }
        : {}),
      ...(data.parent2Dni !== undefined
        ? { parent2Dni: cleanParent2Dni ? this.crypto.encrypt(cleanParent2Dni) : null }
        : {}),
      ...(cleanHolderDni !== undefined
        ? { accountHolderDni: this.crypto.encrypt(cleanHolderDni) ?? '' }
        : {}),
      ...(cleanIban !== undefined
        ? {
            iban: this.crypto.encrypt(cleanIban) ?? '',
            ibanLast4: this.crypto.extractIbanLast4(cleanIban),
          }
        : {}),
      ...(data.chronicDiseases !== undefined
        ? { chronicDiseases: this.crypto.encrypt(data.chronicDiseases) }
        : {}),
      ...(data.allergies !== undefined
        ? { allergies: this.crypto.encrypt(data.allergies) }
        : {}),
      ...(data.medHeadache !== undefined
        ? { medHeadache: this.crypto.encrypt(data.medHeadache) }
        : {}),
      ...(data.medFever !== undefined
        ? { medFever: this.crypto.encrypt(data.medFever) }
        : {}),
      ...(data.medStomach !== undefined
        ? { medStomach: this.crypto.encrypt(data.medStomach) }
        : {}),
      ...(data.medThroat !== undefined
        ? { medThroat: this.crypto.encrypt(data.medThroat) }
        : {}),
      ...(data.medicalObservations !== undefined
        ? { medicalObservations: this.crypto.encrypt(data.medicalObservations) }
        : {}),
      ...(data.signatureParent1 !== undefined
        ? { signatureParent1: this.crypto.encrypt(data.signatureParent1) ?? '' }
        : {}),
      ...(data.signatureParent2 !== undefined
        ? {
            signatureParent2: data.signatureParent2
              ? this.crypto.encrypt(data.signatureParent2)
              : null,
          }
        : {}),
    };
  }

  /**
   * Evalúa los campos obligatorios según la fase/estado real del registro:
   * - PENDIENTE_REVISION / LISTA_ESPERA / PLAZA_OFERTADA (sin inscripción): evalúa Fase 1 (Solicitud).
   * - INSCRIPCION_COMPLETADA / CENSADO (o con inscripción asociada): evalúa Fase 1 + Fase 2 completa.
   */
  evaluateCompleteness(
    applicant: Applicant & { enrollment?: EnrollmentDetails | null },
  ): { isIncomplete: boolean; missingFields: string[] } {
    const decryptedApplicant = applicant.enrollment
      ? { ...applicant, enrollment: this.decryptEnrollmentFields(applicant.enrollment) }
      : applicant;

    const missing: string[] = [];

    // 1. Reglas de Fase 1 (Solicitud de plaza)
    if (!decryptedApplicant.childFirstName || decryptedApplicant.childFirstName.trim().length < 2) {
      missing.push('Nombre del educando');
    }
    if (!decryptedApplicant.childLastName1 || decryptedApplicant.childLastName1.trim().length < 2) {
      missing.push('Primer apellido del educando');
    }
    if (decryptedApplicant.hasNoSecondLastName) {
      if (
        !decryptedApplicant.noSecondLastNameJustification ||
        decryptedApplicant.noSecondLastNameJustification.trim().length < 5
      ) {
        missing.push('Justificación de ausencia de segundo apellido');
      }
    } else if (
      !decryptedApplicant.childLastName2 ||
      decryptedApplicant.childLastName2.trim().length < 1
    ) {
      missing.push('Segundo apellido del educando');
    }

    if (
      !decryptedApplicant.childBirthDate ||
      Number.isNaN(new Date(decryptedApplicant.childBirthDate).getTime())
    ) {
      missing.push('Fecha de nacimiento');
    } else {
      const birth = new Date(decryptedApplicant.childBirthDate);
      const now = new Date();
      const calc = calculateScoutBranchForRound(birth);
      if (birth > now || calc.age > 99) {
        missing.push('Fecha de nacimiento válida');
      } else if (calc.age < 6 || calc.isExternalRutas) {
        missing.push('Edad compatible con las ramas del Grupo IV');
      }
    }

    if (!decryptedApplicant.parent1FirstName || decryptedApplicant.parent1FirstName.trim().length < 2) {
      missing.push('Nombre del tutor 1');
    }
    if (!decryptedApplicant.parent1LastName || decryptedApplicant.parent1LastName.trim().length < 2) {
      missing.push('Apellidos del tutor 1');
    }
    if (
      !decryptedApplicant.parent1Phone ||
      !VALIDATION_REGEX.PHONE.test(normalizePhone(decryptedApplicant.parent1Phone))
    ) {
      missing.push('Teléfono del tutor 1');
    }
    if (
      !decryptedApplicant.parent1Email ||
      !VALIDATION_REGEX.EMAIL.test(decryptedApplicant.parent1Email.trim())
    ) {
      missing.push('Correo del tutor 1');
    }

    const hasSecondParent = Boolean(
      decryptedApplicant.parent2FirstName?.trim() ||
        decryptedApplicant.parent2LastName?.trim() ||
        decryptedApplicant.parent2Phone?.trim() ||
        decryptedApplicant.parent2Email?.trim(),
    );
    if (hasSecondParent) {
      const cleanP2 = normalizePhone(decryptedApplicant.parent2Phone);
      if (cleanP2 && !VALIDATION_REGEX.PHONE.test(cleanP2)) {
        missing.push('Teléfono del tutor 2 válido');
      }
      if (
        decryptedApplicant.parent2Email?.trim() &&
        !VALIDATION_REGEX.EMAIL.test(decryptedApplicant.parent2Email.trim())
      ) {
        missing.push('Correo del tutor 2 válido');
      }
    }

    if (decryptedApplicant.hasFamilyInGroup && !decryptedApplicant.familyMemberDetails?.trim()) {
      missing.push('Detalles del familiar en el grupo');
    }
    if (decryptedApplicant.comesFromOtherGroup && !decryptedApplicant.originGroupDetails?.trim()) {
      missing.push('Grupo de procedencia');
    }

    // Antes de completar la inscripción oficial (Solicitud inicial, Lista de Espera, Plaza Ofertada sin respuesta),
    // NO exigimos datos de Fase 2 salvo si ya existe una ficha de inscripción asociada.
    const requiresEnrollment =
      decryptedApplicant.status === ApplicationStatus.INSCRIPCION_COMPLETADA ||
      decryptedApplicant.status === ApplicationStatus.CENSADO ||
      Boolean(decryptedApplicant.enrollment);

    if (!requiresEnrollment) {
      return { isIncomplete: missing.length > 0, missingFields: missing };
    }

    // 2. Reglas de Fase 2 (Inscripción oficial y Censo)
    if (
      decryptedApplicant.gender !== Gender.MASCULINO &&
      decryptedApplicant.gender !== Gender.FEMENINO
    ) {
      missing.push('Género (Masculino / Femenino)');
    }
    if (!decryptedApplicant.streetAddress || decryptedApplicant.streetAddress.trim().length < 3) {
      missing.push('Dirección principal');
    }
    if (
      !decryptedApplicant.postalCode ||
      !VALIDATION_REGEX.POSTAL_CODE.test(decryptedApplicant.postalCode.trim())
    ) {
      missing.push('Código postal');
    }
    if (!decryptedApplicant.municipality?.trim()) {
      missing.push('Localidad');
    }
    if (!decryptedApplicant.province?.trim()) {
      missing.push('Provincia');
    }

    const enrollment = decryptedApplicant.enrollment;
    if (!enrollment) {
      missing.push('Ficha de inscripción completa');
      return { isIncomplete: true, missingFields: missing };
    }

    if (!enrollment.parent1Dni || !VALIDATION_REGEX.DNI.test(enrollment.parent1Dni.trim())) {
      missing.push('DNI del tutor 1');
    }
    if (
      enrollment.custodyType === 'CUSTODIA_CONJUNTA' &&
      (!enrollment.parent2Dni || !VALIDATION_REGEX.DNI.test(enrollment.parent2Dni.trim()))
    ) {
      missing.push('DNI del tutor 2 (custodia conjunta)');
    }
    if (enrollment.childDni?.trim() && !VALIDATION_REGEX.DNI.test(enrollment.childDni.trim())) {
      missing.push('DNI del educando válido');
    }
    if (!enrollment.authorizesEmergency) {
      missing.push('Autorización médica de urgencia');
    }
    if (!enrollment.accountHolderName?.trim()) {
      missing.push('Titular de la cuenta bancaria');
    }
    if (
      !enrollment.accountHolderDni ||
      !VALIDATION_REGEX.DNI.test(enrollment.accountHolderDni.trim())
    ) {
      missing.push('DNI del titular bancario');
    }
    if (!enrollment.iban || !VALIDATION_REGEX.IBAN.test(normalizeIban(enrollment.iban))) {
      missing.push('IBAN válido');
    }
    if (!enrollment.authorizesSepa) {
      missing.push('Autorización SEPA');
    }
    if (!enrollment.acceptsDataStorage || !enrollment.acceptsDataTransfer) {
      missing.push('Consentimientos de protección de datos');
    }
    if (!enrollment.signatureParent1?.trim()) {
      missing.push('Firma del tutor 1');
    }
    if (
      enrollment.custodyType === 'CUSTODIA_CONJUNTA' &&
      !enrollment.signatureParent2?.trim()
    ) {
      missing.push('Firma del tutor 2 (custodia conjunta)');
    }

    if (decryptedApplicant.status === ApplicationStatus.CENSADO && !decryptedApplicant.admittedAt) {
      missing.push('Fecha efectiva de alta en el censo');
    }

    return { isIncomplete: missing.length > 0, missingFields: missing };
  }

  private evaluateCensusReadiness(
    applicant: Applicant & { enrollment?: EnrollmentDetails | null },
  ): string[] {
    const simulated = {
      ...applicant,
      status: ApplicationStatus.INSCRIPCION_COMPLETADA,
    };
    const { missingFields } = this.evaluateCompleteness(simulated);
    return missingFields;
  }

  private buildEnrollmentSummary(enrollment: EnrollmentDetails): SanitizedEnrollmentSummary {
    const decrypted = this.decryptEnrollmentFields(enrollment);
    const last4 =
      enrollment.ibanLast4 ?? this.crypto.extractIbanLast4(decrypted.iban);
    const hasMedicalInfo = Boolean(
      decrypted.bloodType?.trim() ||
        decrypted.chronicDiseases?.trim() ||
        decrypted.allergies?.trim() ||
        decrypted.medHeadache?.trim() ||
        decrypted.medFever?.trim() ||
        decrypted.medStomach?.trim() ||
        decrypted.medThroat?.trim() ||
        decrypted.medicalObservations?.trim(),
    );

    return {
      id: enrollment.id,
      applicantId: enrollment.applicantId,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
      legalStatus: enrollment.legalStatus,
      circularPreference: enrollment.circularPreference,
      parentsMaritalStatus: enrollment.parentsMaritalStatus,
      custodyType: enrollment.custodyType,
      acceptsDataStorage: enrollment.acceptsDataStorage,
      acceptsDataTransfer: enrollment.acceptsDataTransfer,
      authorizesImages: enrollment.authorizesImages,
      consentTextVersion: enrollment.consentTextVersion,
      authorizesEmergency: enrollment.authorizesEmergency,
      accountHolderName: enrollment.accountHolderName,
      ibanMasked: this.crypto.maskIban(last4),
      ibanLast4: last4,
      authorizesSepa: enrollment.authorizesSepa,
      sepaSignedAt: enrollment.sepaSignedAt,
      hasChildDni: Boolean(decrypted.childDni?.trim()),
      childDniMasked: this.crypto.maskDni(decrypted.childDni),
      hasMedicalInfo,
      hasSignatureParent1: Boolean(decrypted.signatureParent1?.trim()),
      hasSignatureParent2: Boolean(decrypted.signatureParent2?.trim()),
      signer1FullName: enrollment.signer1FullName,
      signedAtParent1: enrollment.signedAtParent1,
      signer2FullName: enrollment.signer2FullName,
      signedAtParent2: enrollment.signedAtParent2,
      childEmail: enrollment.childEmail,
      childPhone: enrollment.childPhone,
      medicalAccessRestricted: true,
      bankAccessRestricted: true,
    };
  }

  private buildEnrollmentDetail(
    enrollment: EnrollmentDetails,
    user?: AuthenticatedRequest['user'],
  ): DecryptedEnrollmentDetail {
    const decrypted = this.decryptEnrollmentFields(enrollment);
    const allowMedical = user ? canReadSensitiveMedicalOrBankData(user, 'medical') : false;
    const allowBank = user ? canReadSensitiveMedicalOrBankData(user, 'bank') : false;
    const last4 = enrollment.ibanLast4 ?? this.crypto.extractIbanLast4(decrypted.iban);

    return {
      ...decrypted,
      childDni: allowMedical || allowBank ? decrypted.childDni : this.crypto.maskDni(decrypted.childDni),
      parent1Dni:
        allowMedical || allowBank
          ? decrypted.parent1Dni
          : this.crypto.maskDni(decrypted.parent1Dni) ?? '',
      parent2Dni:
        allowMedical || allowBank
          ? decrypted.parent2Dni
          : this.crypto.maskDni(decrypted.parent2Dni),
      bloodType: allowMedical ? decrypted.bloodType : null,
      chronicDiseases: allowMedical ? decrypted.chronicDiseases : null,
      allergies: allowMedical ? decrypted.allergies : null,
      medHeadache: allowMedical ? decrypted.medHeadache : null,
      medFever: allowMedical ? decrypted.medFever : null,
      medStomach: allowMedical ? decrypted.medStomach : null,
      medThroat: allowMedical ? decrypted.medThroat : null,
      medicalObservations: allowMedical ? decrypted.medicalObservations : null,
      emergencyContactName: allowMedical ? decrypted.emergencyContactName : null,
      emergencyContactPhone: allowMedical ? decrypted.emergencyContactPhone : null,
      emergencyContactRelationship: allowMedical ? decrypted.emergencyContactRelationship : null,
      accountHolderDni: allowBank
        ? decrypted.accountHolderDni
        : this.crypto.maskDni(decrypted.accountHolderDni) ?? '',
      iban: allowBank ? decrypted.iban : this.crypto.maskIban(last4),
      ibanMasked: this.crypto.maskIban(last4),
      ibanLast4: last4,
      signatureParent1: allowMedical || allowBank ? decrypted.signatureParent1 : '',
      signatureParent2: allowMedical || allowBank ? decrypted.signatureParent2 : null,
      hasChildDni: Boolean(decrypted.childDni?.trim()),
      childDniMasked: this.crypto.maskDni(decrypted.childDni),
      hasSignatureParent1: Boolean(decrypted.signatureParent1?.trim()),
      hasSignatureParent2: Boolean(decrypted.signatureParent2?.trim()),
      medicalAccessRestricted: !allowMedical,
      bankAccessRestricted: !allowBank,
    };
  }

  private enrichApplicant(
    applicant: Applicant & { enrollment?: EnrollmentDetails | null },
    options: {
      projection?: 'summary' | 'detail';
      user?: AuthenticatedRequest['user'];
      potentialDuplicateIds?: string[];
      familySiblings?: EnrichedApplicant['familySiblings'];
    } = {},
  ): EnrichedApplicant {
    const calc = calculateScoutBranchForRound(applicant.childBirthDate);

    let priorityScore = 0;
    if (applicant.hasFamilyInGroup) priorityScore += 100;
    if (applicant.socialInclusionPriority) priorityScore += 50;
    if (applicant.comesFromOtherGroup) priorityScore += 25;

    const { isIncomplete, missingFields } = this.evaluateCompleteness(applicant);
    const missingForCensus =
      applicant.status === ApplicationStatus.INSCRIPCION_COMPLETADA
        ? this.evaluateCensusReadiness(applicant)
        : [];

    const canAdmitToCensus =
      applicant.status === ApplicationStatus.INSCRIPCION_COMPLETADA &&
      missingForCensus.length === 0 &&
      calc.isManagedByGroup &&
      !calc.isExternalRutas &&
      calc.age >= 6;

    const isOffered = applicant.status === ApplicationStatus.PLAZA_OFERTADA;
    const tokenExpired = Boolean(
      isOffered &&
        applicant.tokenExpiresAt &&
        new Date() > new Date(applicant.tokenExpiresAt),
    );
    const visibleToken =
      isOffered && !applicant.tokenUsedAt && !tokenExpired && applicant.enrollmentToken
        ? this.crypto.decrypt(applicant.enrollmentToken)
        : null;

    const {
      enrollmentToken: _omitRawToken,
      enrollmentTokenHash: _omitHash,
      enrollment,
      ...restApplicant
    } = applicant;

    const projectedEnrollment = enrollment
      ? options.projection === 'detail'
        ? this.buildEnrollmentDetail(enrollment, options.user)
        : this.buildEnrollmentSummary(enrollment)
      : null;

    return {
      ...restApplicant,
      enrollmentToken: visibleToken,
      tokenExpired,
      enrollment: projectedEnrollment,
      calculatedBranch: calc.branch,
      currentAge: calc.age,
      solarRound: calc.solarRound.label,
      priorityScore,
      isIncomplete,
      missingFields,
      canAdmitToCensus,
      missingForCensus,
      ...(options.potentialDuplicateIds !== undefined
        ? { potentialDuplicateIds: options.potentialDuplicateIds }
        : {}),
      ...(options.familySiblings !== undefined ? { familySiblings: options.familySiblings } : {}),
    };
  }

  private async recordAudit(
    context: AuditContext | undefined,
    action: string,
    resource: string,
    result: 'ALLOWED' | 'DENIED' = 'ALLOWED',
  ): Promise<void> {
    if (!this.prisma.auditEvent?.create) return;
    await this.prisma.auditEvent.create({
      data: {
        actorId: context?.actorId ?? null,
        action,
        resource,
        result,
        ipAddress: context?.ipAddress ?? null,
      },
    });
  }

  private findPotentialDuplicateIdsInBatch(
    target: Applicant,
    allActive: Applicant[],
  ): string[] {
    if (target.status === ApplicationStatus.BAJA) return [];
    const targetName = normalizeTextForSearch(
      `${target.childFirstName} ${target.childLastName1}`,
    );
    const targetBirth = extractDateParts(target.childBirthDate);
    if (!targetBirth) return [];

    return allActive
      .filter((other) => {
        if (other.id === target.id || other.status === ApplicationStatus.BAJA) return false;
        const otherName = normalizeTextForSearch(
          `${other.childFirstName} ${other.childLastName1}`,
        );
        if (otherName !== targetName) return false;
        const otherBirth = extractDateParts(other.childBirthDate);
        return (
          otherBirth &&
          otherBirth.year === targetBirth.year &&
          otherBirth.month === targetBirth.month &&
          otherBirth.day === targetBirth.day
        );
      })
      .map((other) => other.id);
  }

  private async assertUniqueChildDni(
    childDni: string | null,
    excludeApplicantId?: string,
    dnisToCompare: Array<string | null | undefined> = [],
  ): Promise<string | null> {
    if (!childDni) return null;
    const normalized = assertValidDniFormat(childDni, 'DNI del educando');

    for (const parentOrHolderDni of dnisToCompare) {
      const normalizedOther = normalizeDni(parentOrHolderDni);
      if (normalizedOther && normalizedOther === normalized) {
        throw new BadRequestException(
          'El DNI del educando no puede coincidir con el DNI de un tutor ni del titular bancario.',
        );
      }
    }

    const dniHash = this.crypto.hashDni(normalized);
    if (dniHash && this.prisma.enrollmentDetails?.findFirst) {
      const existing = await this.prisma.enrollmentDetails.findFirst({
        where: {
          childDniHash: dniHash,
          ...(excludeApplicantId ? { applicantId: { not: excludeApplicantId } } : {}),
        },
        select: { applicantId: true },
      });
      if (existing) {
        throw new ConflictException(
          'Ya existe otro educando registrado con este mismo DNI/NIE.',
        );
      }
    }

    return dniHash;
  }

  private generateMagicTokenPair(daysValid = 7) {
    const rawToken = randomBytes(24).toString('base64url');
    const tokenHash = this.crypto.hashDeterministic(rawToken);
    const encryptedToken = this.crypto.encrypt(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);
    return { rawToken, tokenHash, encryptedToken, expiresAt };
  }

  /**
   * Filtra y ordena registros enriquecidos según los criterios de búsqueda, filtros y ordenación.
   */
  filterAndSortApplicants(
    records: EnrichedApplicant[],
    query?: QueryApplicationsDto,
  ): EnrichedApplicant[] {
    if (!query) return records;

    let result = [...records];

    if (query.status) {
      result = result.filter((r) => r.status === query.status);
    } else if (query.statuses && query.statuses.length > 0) {
      const allowed = new Set(query.statuses);
      result = result.filter((r) => allowed.has(r.status));
    } else if (query.stage) {
      result = result.filter((r) => {
        if (query.stage === 'INITIAL') return r.status === ApplicationStatus.PENDIENTE_REVISION;
        if (query.stage === 'WAITLIST') return r.status === ApplicationStatus.LISTA_ESPERA;
        if (query.stage === 'PENDING_ENROLLMENT') {
          return (
            r.status === ApplicationStatus.PLAZA_OFERTADA ||
            r.status === ApplicationStatus.INSCRIPCION_COMPLETADA
          );
        }
        if (query.stage === 'CENSUS') return r.status === ApplicationStatus.CENSADO;
        if (query.stage === 'ARCHIVED') return r.status === ApplicationStatus.BAJA;
        return true;
      });
    }

    if (
      query.enrollmentSubStatus &&
      query.enrollmentSubStatus !== 'ALL' &&
      (query.enrollmentSubStatus === ApplicationStatus.PLAZA_OFERTADA ||
        query.enrollmentSubStatus === ApplicationStatus.INSCRIPCION_COMPLETADA)
    ) {
      result = result.filter((r) => r.status === query.enrollmentSubStatus);
    }

    if (query.search) {
      const normalizedSearch = normalizeSearchText(query.search);
      const tokens = normalizedSearch.split(' ').filter(Boolean);

      if (tokens.length > 0) {
        result = result.filter((r) => {
          const isInitialPhase =
            r.status === ApplicationStatus.PENDIENTE_REVISION ||
            r.status === ApplicationStatus.LISTA_ESPERA;
          const searchableParts = [
            r.childFirstName,
            r.childLastName,
            r.parent1FirstName,
            r.parent1LastName,
            r.parent1Email,
            r.parent1Phone,
            r.parent2FirstName,
            r.parent2LastName,
            r.parent2Email,
            r.parent2Phone,
            ...(!isInitialPhase && r.enrollment
              ? [r.enrollment.childEmail, r.enrollment.childPhone]
              : []),
          ];

          const combinedNormalized = normalizeSearchText(searchableParts.filter(Boolean).join(' '));
          const combinedDigits = normalizeDigits(
            [
              r.parent1Phone,
              r.parent2Phone,
              !isInitialPhase ? r.enrollment?.childPhone : undefined,
            ]
              .filter(Boolean)
              .join(' '),
          );

          return tokens.every((token) => {
            if (combinedNormalized.includes(token)) return true;
            const tokenDigits = normalizeDigits(token);
            if (tokenDigits.length >= 2 && combinedDigits.includes(tokenDigits)) return true;
            return false;
          });
        });
      }
    }

    if (query.branch && query.branch !== 'Todas') {
      const normalizedBranch = normalizeSearchText(query.branch);
      result = result.filter((r) =>
        normalizeSearchText(r.calculatedBranch).startsWith(normalizedBranch),
      );
    }

    if (query.gender) {
      result = result.filter((r) => r.gender === query.gender);
    }

    if (query.minAge !== undefined) {
      result = result.filter((r) => r.currentAge >= query.minAge!);
    }
    if (query.maxAge !== undefined) {
      result = result.filter((r) => r.currentAge <= query.maxAge!);
    }

    if (query.birthDateFrom) {
      const fromTime = new Date(query.birthDateFrom).setHours(0, 0, 0, 0);
      if (!Number.isNaN(fromTime)) {
        result = result.filter((r) => new Date(r.childBirthDate).getTime() >= fromTime);
      }
    }
    if (query.birthDateTo) {
      const toTime = new Date(query.birthDateTo).setHours(23, 59, 59, 999);
      if (!Number.isNaN(toTime)) {
        result = result.filter((r) => new Date(r.childBirthDate).getTime() <= toTime);
      }
    }

    if (query.tutorName) {
      const tutorTokens = normalizeSearchText(query.tutorName).split(' ').filter(Boolean);
      if (tutorTokens.length > 0) {
        result = result.filter((r) => {
          const tutorText = normalizeSearchText(
            [r.parent1FirstName, r.parent1LastName, r.parent2FirstName, r.parent2LastName]
              .filter(Boolean)
              .join(' '),
          );
          return tutorTokens.every((t) => tutorText.includes(t));
        });
      }
    }

    if (query.email) {
      const emailTerm = normalizeSearchText(query.email);
      if (emailTerm) {
        result = result.filter((r) => {
          const isInitialPhase =
            r.status === ApplicationStatus.PENDIENTE_REVISION ||
            r.status === ApplicationStatus.LISTA_ESPERA;
          const emails = [
            r.parent1Email,
            r.parent2Email,
            !isInitialPhase ? r.enrollment?.childEmail : undefined,
          ]
            .filter(Boolean)
            .map((e) => normalizeSearchText(e));
          return emails.some((e) => e.includes(emailTerm));
        });
      }
    }

    if (query.phone) {
      const phoneTerm = normalizeSearchText(query.phone);
      const phoneDigits = normalizeDigits(query.phone);
      result = result.filter((r) => {
        const isInitialPhase =
          r.status === ApplicationStatus.PENDIENTE_REVISION ||
          r.status === ApplicationStatus.LISTA_ESPERA;
        const phones = [
          r.parent1Phone,
          r.parent2Phone,
          !isInitialPhase ? r.enrollment?.childPhone : undefined,
        ].filter(Boolean) as string[];
        return phones.some((p) => {
          if (phoneDigits && normalizeDigits(p).includes(phoneDigits)) return true;
          return normalizeSearchText(p).includes(phoneTerm);
        });
      });
    }

    if (query.admittedFrom) {
      const fromTime = new Date(query.admittedFrom).setHours(0, 0, 0, 0);
      if (!Number.isNaN(fromTime)) {
        result = result.filter(
          (r) => r.admittedAt && new Date(r.admittedAt).getTime() >= fromTime,
        );
      }
    }
    if (query.admittedTo) {
      const toTime = new Date(query.admittedTo).setHours(23, 59, 59, 999);
      if (!Number.isNaN(toTime)) {
        result = result.filter(
          (r) => r.admittedAt && new Date(r.admittedAt).getTime() <= toTime,
        );
      }
    }

    if (query.incompleteOnly === 'true') {
      result = result.filter((r) => r.isIncomplete);
    } else if (query.incompleteOnly === 'false') {
      result = result.filter((r) => !r.isIncomplete);
    }

    const sortBy: SortField = query.sortBy || 'priority';
    const sortOrder: SortOrder = query.sortOrder || 'asc';
    const direction = sortOrder === 'desc' ? -1 : 1;

    result.sort((a, b) => {
      if (sortBy === 'childFirstName') {
        const cmp = a.childFirstName.localeCompare(b.childFirstName, 'es', {
          sensitivity: 'base',
        });
        if (cmp !== 0) return cmp * direction;
        return (
          a.childLastName.localeCompare(b.childLastName, 'es', { sensitivity: 'base' }) *
          direction
        );
      }

      if (sortBy === 'childLastName') {
        const cmp = a.childLastName.localeCompare(b.childLastName, 'es', {
          sensitivity: 'base',
        });
        if (cmp !== 0) return cmp * direction;
        return (
          a.childFirstName.localeCompare(b.childFirstName, 'es', { sensitivity: 'base' }) *
          direction
        );
      }

      if (sortBy === 'age') {
        const ageDiff = a.currentAge - b.currentAge;
        if (ageDiff !== 0) return ageDiff * direction;
        const birthDiff =
          new Date(b.childBirthDate).getTime() - new Date(a.childBirthDate).getTime();
        return birthDiff * direction;
      }

      if (sortBy === 'childBirthDate') {
        const diff =
          new Date(a.childBirthDate).getTime() - new Date(b.childBirthDate).getTime();
        if (diff !== 0) return diff * direction;
      }

      if (sortBy === 'admittedAt') {
        const aTime = a.admittedAt ? new Date(a.admittedAt).getTime() : 0;
        const bTime = b.admittedAt ? new Date(b.admittedAt).getTime() : 0;
        if (aTime !== bTime) return (aTime - bTime) * direction;
      }

      if (sortBy === 'branch') {
        const aOrder = BRANCH_ORDER[a.calculatedBranch] ?? 99;
        const bOrder = BRANCH_ORDER[b.calculatedBranch] ?? 99;
        if (aOrder !== bOrder) return (aOrder - bOrder) * direction;
        return a.childLastName.localeCompare(b.childLastName, 'es', { sensitivity: 'base' });
      }

      if (sortBy === 'createdAt') {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (diff !== 0) return diff * direction;
      }

      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return result;
  }

  // 1. Crear solicitud inicial (Fase 1) con idempotencia y agrupación familiar
  async create(dto: CreateApplicationDto, context?: AuditContext): Promise<EnrichedApplicant> {
    const surnames = resolveAndValidateSurnames({
      childLastName1: dto.childLastName1,
      childLastName2: dto.childLastName2,
      hasNoSecondLastName: dto.hasNoSecondLastName,
      noSecondLastNameJustification: dto.noSecondLastNameJustification,
      childLastName: dto.childLastName,
    });

    validateBirthDateAndBranch(dto.childBirthDate, { allowAdultResponsables: false });

    if (dto.idempotencyKey && this.prisma.applicant.findUnique) {
      const existingByKey = await this.prisma.applicant.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { enrollment: true },
      });
      if (existingByKey) {
        return this.enrichApplicant(existingByKey, { projection: 'summary' });
      }
    }

    const normalizedEmail = dto.parent1Email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(dto.parent1Phone);
    const birthDate = new Date(dto.childBirthDate);

    // Protección frente a dobles envíos o reintentos inmediatos (últimos 60 segundos)
    if (typeof this.prisma.applicant?.findMany === 'function') {
      const recentWindow = new Date(Date.now() - 60_000);
      const recentCandidates = await this.prisma.applicant.findMany({
        where: {
          createdAt: { gte: recentWindow },
          parent1Phone: normalizedPhone,
          status: { not: ApplicationStatus.BAJA },
        },
        include: { enrollment: true },
      });
      const birthParts = extractDateParts(birthDate);
      const exactRetry = recentCandidates.find((c) => {
        const cParts = extractDateParts(c.childBirthDate);
        return (
          normalizeSearchText(c.childFirstName) === normalizeSearchText(dto.childFirstName) &&
          normalizeSearchText(c.childLastName1) === normalizeSearchText(surnames.childLastName1) &&
          cParts?.year === birthParts?.year &&
          cParts?.month === birthParts?.month &&
          cParts?.day === birthParts?.day
        );
      });
      if (exactRetry) {
        return this.enrichApplicant(exactRetry, { projection: 'summary' });
      }
    }

    // Reutilizar familyUnitId si ya existe un hermano/familiar con el mismo correo o teléfono de tutor
    let resolvedFamilyUnitId = normalizeOptionalString(dto.familyUnitId);
    if (!resolvedFamilyUnitId && typeof this.prisma.applicant?.findFirst === 'function') {
      const sibling = await this.prisma.applicant.findFirst({
        where: {
          OR: [{ parent1Email: normalizedEmail }, { parent1Phone: normalizedPhone }],
        },
        select: { id: true, familyUnitId: true },
      });
      if (sibling) {
        resolvedFamilyUnitId = sibling.familyUnitId ?? sibling.id;
      }
    }
    if (!resolvedFamilyUnitId) {
      resolvedFamilyUnitId = randomUUID();
    }

    const created = await this.prisma.applicant.create({
      data: {
        status: ApplicationStatus.PENDIENTE_REVISION,
        childFirstName: dto.childFirstName.trim(),
        childLastName1: surnames.childLastName1,
        childLastName2: surnames.childLastName2,
        hasNoSecondLastName: surnames.hasNoSecondLastName,
        noSecondLastNameJustification: surnames.noSecondLastNameJustification,
        childLastName: surnames.childLastName,
        childBirthDate: birthDate,
        gender: dto.gender ?? null,
        streetAddress: normalizeOptionalString(dto.streetAddress),
        streetNumber: normalizeOptionalString(dto.streetNumber),
        apartmentDoor: normalizeOptionalString(dto.apartmentDoor ?? dto.ApartmentDoor),
        postalCode: normalizeOptionalString(dto.postalCode),
        municipality: normalizeOptionalString(dto.municipality),
        province: normalizeOptionalString(dto.province),
        familyUnitId: resolvedFamilyUnitId,
        parent1FirstName: dto.parent1FirstName.trim(),
        parent1LastName: dto.parent1LastName.trim(),
        parent1Phone: normalizedPhone,
        parent1Email: normalizedEmail,
        parent2FirstName: normalizeOptionalString(dto.parent2FirstName),
        parent2LastName: normalizeOptionalString(dto.parent2LastName),
        parent2Phone: dto.parent2Phone ? normalizePhone(dto.parent2Phone) : null,
        parent2Email: dto.parent2Email ? dto.parent2Email.trim().toLowerCase() : null,
        motivation: normalizeOptionalString(dto.motivation),
        hasFamilyInGroup: Boolean(dto.hasFamilyInGroup),
        familyMemberDetails: dto.hasFamilyInGroup
          ? normalizeOptionalString(dto.familyMemberDetails)
          : null,
        comesFromOtherGroup: Boolean(dto.comesFromOtherGroup),
        originGroupDetails: dto.comesFromOtherGroup
          ? normalizeOptionalString(dto.originGroupDetails)
          : null,
        idempotencyKey: normalizeOptionalString(dto.idempotencyKey),
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_CREATED', `applicant:${created.id}`);
    return this.enrichApplicant(created, { projection: 'summary' });
  }

  // 2. Listar todas las solicitudes/miembros enriquecidos (resumen seguro sin exponer datos médicos/IBAN en bruto)
  async findAll(
    statusOrQuery?: ApplicationStatus | QueryApplicationsDto,
  ): Promise<EnrichedApplicant[]> {
    const query: QueryApplicationsDto =
      typeof statusOrQuery === 'string'
        ? { status: statusOrQuery }
        : statusOrQuery || {};

    const whereStatus = query.status
      ? { status: query.status }
      : query.statuses && query.statuses.length > 0
        ? { status: { in: query.statuses } }
        : undefined;

    const applicants = await this.prisma.applicant.findMany({
      where: whereStatus,
      include: { enrollment: true },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = applicants.map((app) =>
      this.enrichApplicant(app, {
        projection: 'summary',
        potentialDuplicateIds: this.findPotentialDuplicateIdsInBatch(app, applicants),
      }),
    );
    const filteredAndSorted = this.filterAndSortApplicants(enriched, query);

    if (query.page !== undefined && query.pageSize !== undefined) {
      const start = (query.page - 1) * query.pageSize;
      return filteredAndSorted.slice(start, start + query.pageSize);
    }

    return filteredAndSorted;
  }

  // 2b. Listado paginado en servidor con contadores reales por pestaña
  async findPaginated(query: QueryApplicationsDto = {}): Promise<PaginatedApplicationsResult> {
    const allApplicants = await this.prisma.applicant.findMany({
      include: { enrollment: true },
      orderBy: { createdAt: 'asc' },
    });

    const sectionCounts = {
      INITIAL: 0,
      WAITLIST: 0,
      OFFERED: 0,
      CENSUS: 0,
      ARCHIVED: 0,
    };

    for (const r of allApplicants) {
      if (r.status === ApplicationStatus.PENDIENTE_REVISION) sectionCounts.INITIAL++;
      else if (r.status === ApplicationStatus.LISTA_ESPERA) sectionCounts.WAITLIST++;
      else if (
        r.status === ApplicationStatus.PLAZA_OFERTADA ||
        r.status === ApplicationStatus.INSCRIPCION_COMPLETADA
      ) {
        sectionCounts.OFFERED++;
      } else if (r.status === ApplicationStatus.CENSADO) sectionCounts.CENSUS++;
      else if (r.status === ApplicationStatus.BAJA) sectionCounts.ARCHIVED++;
    }

    const enriched = allApplicants.map((app) =>
      this.enrichApplicant(app, {
        projection: 'summary',
        potentialDuplicateIds: this.findPotentialDuplicateIdsInBatch(app, allApplicants),
      }),
    );

    const filteredAndSorted = this.filterAndSortApplicants(enriched, query);
    const totalMatching = filteredAndSorted.length;
    const pageSize = query.pageSize ?? 25;
    const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));
    const page = Math.min(Math.max(1, query.page ?? 1), totalPages);
    const start = (page - 1) * pageSize;

    return {
      items: filteredAndSorted.slice(start, start + pageSize),
      totalMatching,
      page,
      pageSize,
      totalPages,
      sectionCounts,
    };
  }

  // 3. Obtener el Censo oficial (Estado CENSADO)
  async findCensus(query?: QueryApplicationsDto): Promise<EnrichedApplicant[]> {
    const censusQuery: QueryApplicationsDto = Object.assign(new QueryApplicationsDto(), query, {
      status: ApplicationStatus.CENSADO,
    });
    return this.findAll(censusQuery);
  }

  // Alta administrativa directa en censo: aplica exactamente las mismas reglas de validación
  async createDirectCensus(
    dto: CreateDirectCensusDto,
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const surnames = resolveAndValidateSurnames({
      childLastName1: dto.childLastName1,
      childLastName2: dto.childLastName2,
      hasNoSecondLastName: dto.hasNoSecondLastName,
      noSecondLastNameJustification: dto.noSecondLastNameJustification,
      childLastName: dto.childLastName,
    });

    const branchCalc = validateBirthDateAndBranch(dto.childBirthDate, {
      allowAdultResponsables: dto.allowAdultResponsables ?? true,
    });

    if (dto.gender !== Gender.MASCULINO && dto.gender !== Gender.FEMENINO) {
      throw new BadRequestException('El género debe ser Masculino o Femenino.');
    }

    if (dto.custodyType === 'CUSTODIA_CONJUNTA') {
      if (!dto.parent2Dni?.trim() || !dto.signatureParent2?.trim()) {
        throw new BadRequestException(
          'En caso de custodia conjunta son obligatorios el DNI y la firma del segundo tutor.',
        );
      }
    }

    if (!dto.acceptsDataStorage || !dto.acceptsDataTransfer) {
      throw new BadRequestException(
        'Los consentimientos obligatorios de protección de datos y cesión federativa deben aceptarse.',
      );
    }
    if (!dto.authorizesEmergency) {
      throw new BadRequestException('La autorización médica de urgencia es obligatoria.');
    }
    if (!dto.authorizesSepa) {
      throw new BadRequestException('La autorización de domiciliación SEPA es obligatoria.');
    }

    const cleanChildDni = normalizeDni(dto.childDni);
    const childDniHash = await this.assertUniqueChildDni(cleanChildDni, undefined, [
      dto.parent1Dni,
      dto.parent2Dni,
      dto.accountHolderDni,
    ]);

    const now = new Date();
    const cleanIban = normalizeIban(dto.iban);
    const encryptedFields = this.encryptEnrollmentData({
      childDni: cleanChildDni,
      parent1Dni: dto.parent1Dni,
      parent2Dni: dto.parent2Dni ?? null,
      accountHolderDni: dto.accountHolderDni,
      iban: cleanIban,
      chronicDiseases: dto.chronicDiseases ?? null,
      allergies: dto.allergies ?? null,
      medHeadache: dto.medHeadache ?? null,
      medFever: dto.medFever ?? null,
      medStomach: dto.medStomach ?? null,
      medThroat: dto.medThroat ?? null,
      medicalObservations: dto.medicalObservations ?? null,
      signatureParent1: dto.signatureParent1,
      signatureParent2: dto.signatureParent2 ?? null,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      return tx.applicant.create({
        data: {
          childFirstName: dto.childFirstName.trim(),
          childLastName1: surnames.childLastName1,
          childLastName2: surnames.childLastName2,
          hasNoSecondLastName: surnames.hasNoSecondLastName,
          noSecondLastNameJustification: surnames.noSecondLastNameJustification,
          childLastName: surnames.childLastName,
          childBirthDate: new Date(dto.childBirthDate),
          gender: dto.gender,
          streetAddress: dto.streetAddress.trim(),
          streetNumber: normalizeOptionalString(dto.streetNumber),
          apartmentDoor: normalizeOptionalString(dto.apartmentDoor ?? dto.ApartmentDoor),
          postalCode: dto.postalCode.trim(),
          municipality: dto.municipality.trim(),
          province: dto.province.trim(),
          familyUnitId: normalizeOptionalString(dto.familyUnitId) ?? randomUUID(),
          parent1FirstName: dto.parent1FirstName.trim(),
          parent1LastName: dto.parent1LastName.trim(),
          parent1Phone: normalizePhone(dto.parent1Phone),
          parent1Email: dto.parent1Email.trim().toLowerCase(),
          parent1Relationship: normalizeOptionalString(dto.parent1Relationship),
          parent2FirstName: normalizeOptionalString(dto.parent2FirstName),
          parent2LastName: normalizeOptionalString(dto.parent2LastName),
          parent2Phone: dto.parent2Phone ? normalizePhone(dto.parent2Phone) : null,
          parent2Email: dto.parent2Email ? dto.parent2Email.trim().toLowerCase() : null,
          parent2Relationship: normalizeOptionalString(dto.parent2Relationship),
          motivation: normalizeOptionalString(dto.motivation),
          hasFamilyInGroup: Boolean(dto.hasFamilyInGroup),
          familyMemberDetails: dto.hasFamilyInGroup
            ? normalizeOptionalString(dto.familyMemberDetails)
            : null,
          comesFromOtherGroup: Boolean(dto.comesFromOtherGroup),
          originGroupDetails: dto.comesFromOtherGroup
            ? normalizeOptionalString(dto.originGroupDetails)
            : null,
          status: ApplicationStatus.CENSADO,
          reviewedAt: now,
          reviewedById: context?.actorId ?? null,
          admittedAt: now,
          admittedById: context?.actorId ?? null,
          censusSolarRound: branchCalc.solarRound.label,
          censusBranch: branchCalc.branch,
          enrollment: {
            create: {
              childDni: encryptedFields.childDni ?? null,
              childDniHash,
              childPhone: dto.childPhone ? normalizePhone(dto.childPhone) : null,
              childEmail: dto.childEmail ? dto.childEmail.trim().toLowerCase() : null,
              legalStatus: dto.legalStatus ?? 'MENOR',
              circularPreference: dto.circularPreference ?? 'EMAIL',
              parent1Dni: encryptedFields.parent1Dni ?? '',
              parent2Dni: encryptedFields.parent2Dni ?? null,
              parentsMaritalStatus: normalizeOptionalString(dto.parentsMaritalStatus),
              custodyType: dto.custodyType ?? 'SIN_ESPECIFICAR',
              acceptsDataStorage: dto.acceptsDataStorage,
              acceptsDataTransfer: dto.acceptsDataTransfer,
              authorizesImages: dto.authorizesImages,
              consentTextVersion: dto.consentTextVersion ?? '2026.1',
              bloodType: normalizeOptionalString(dto.bloodType),
              chronicDiseases: encryptedFields.chronicDiseases ?? null,
              allergies: encryptedFields.allergies ?? null,
              medHeadache: encryptedFields.medHeadache ?? null,
              medFever: encryptedFields.medFever ?? null,
              medStomach: encryptedFields.medStomach ?? null,
              medThroat: encryptedFields.medThroat ?? null,
              medicalObservations: encryptedFields.medicalObservations ?? null,
              emergencyContactName: normalizeOptionalString(dto.emergencyContactName),
              emergencyContactPhone: dto.emergencyContactPhone
                ? normalizePhone(dto.emergencyContactPhone)
                : null,
              emergencyContactRelationship: normalizeOptionalString(
                dto.emergencyContactRelationship,
              ),
              authorizesEmergency: dto.authorizesEmergency,
              accountHolderName: dto.accountHolderName.trim(),
              accountHolderDni: encryptedFields.accountHolderDni ?? '',
              accountHolderAddress: normalizeOptionalString(dto.accountHolderAddress),
              accountHolderMunicipality: normalizeOptionalString(dto.accountHolderMunicipality),
              accountHolderPostalCode: normalizeOptionalString(dto.accountHolderPostalCode),
              iban: encryptedFields.iban ?? '',
              ibanLast4: encryptedFields.ibanLast4 ?? null,
              authorizesSepa: dto.authorizesSepa,
              sepaSignedAt: now,
              signer1FullName:
                normalizeOptionalString(dto.signer1FullName) ??
                `${dto.parent1FirstName.trim()} ${dto.parent1LastName.trim()}`.trim(),
              signer1Dni: normalizeDni(dto.signer1Dni ?? dto.parent1Dni),
              signatureParent1: encryptedFields.signatureParent1 ?? '',
              signedAtParent1: now,
              signer2FullName: dto.signatureParent2
                ? normalizeOptionalString(dto.signer2FullName) ??
                  ([dto.parent2FirstName, dto.parent2LastName].filter(Boolean).join(' ') || null)
                : null,
              signer2Dni: dto.signatureParent2
                ? normalizeDni(dto.signer2Dni ?? dto.parent2Dni)
                : null,
              signatureParent2: encryptedFields.signatureParent2 ?? null,
              signedAtParent2: dto.signatureParent2 ? now : null,
            },
          },
        },
        include: { enrollment: true },
      });
    });

    await this.recordAudit(
      context,
      'APPLICATION_DIRECT_CENSUS_CREATED',
      `applicant:${created.id}`,
    );
    return this.enrichApplicant(created, { projection: 'detail', user: context?.user });
  }

  // 4. Obtener ficha completa de un solicitante por ID (con control de acceso y auditoría)
  async findOne(id: string, context?: AuditContext): Promise<EnrichedApplicant> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!applicant) {
      throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);
    }

    let familySiblings: EnrichedApplicant['familySiblings'] = [];
    if (applicant.familyUnitId && this.prisma.applicant.findMany) {
      const siblings = await this.prisma.applicant.findMany({
        where: {
          familyUnitId: applicant.familyUnitId,
          id: { not: applicant.id },
        },
        orderBy: { createdAt: 'asc' },
      });
      familySiblings = siblings.map((sib) => ({
        id: sib.id,
        childFirstName: sib.childFirstName,
        childLastName: sib.childLastName,
        status: sib.status,
        calculatedBranch: calculateScoutBranchForRound(sib.childBirthDate).branch,
      }));
    }

    if (applicant.enrollment && context?.actorId) {
      await this.recordAudit(context, 'APPLICATION_SENSITIVE_READ', `applicant:${applicant.id}`);
    }

    return this.enrichApplicant(applicant, {
      projection: 'detail',
      user: context?.user,
      familySiblings,
    });
  }

  // 4b. Obtener historial de auditoría del expediente
  async getHistory(id: string) {
    const existing = await this.prisma.applicant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);
    }
    if (!this.prisma.auditEvent?.findMany) return [];
    return this.prisma.auditEvent.findMany({
      where: { resource: { startsWith: `applicant:${id}` } },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 5. Editar datos de solicitud desde Secretaría (SIN cambios directos de estado)
  async update(
    id: string,
    dto: UpdateApplicationDto,
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) {
      throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);
    }

    if (current.status === ApplicationStatus.BAJA) {
      throw new BadRequestException(
        'No se puede editar un expediente dado de baja. Reactívalo primero si es necesario.',
      );
    }

    const isPhase1Editable = EDITABLE_PHASE1_STATUSES.has(current.status);
    const {
      childBirthDate,
      childFirstName,
      childLastName1,
      childLastName2,
      hasNoSecondLastName,
      noSecondLastNameJustification,
      childLastName,
      gender,
      parent1FirstName,
      parent1LastName,
      parent1Phone,
      parent1Email,
      parent2FirstName,
      parent2LastName,
      parent2Phone,
      parent2Email,
      motivation,
      hasFamilyInGroup,
      familyMemberDetails,
      comesFromOtherGroup,
      originGroupDetails,
      socialInclusionPriority,
      kraalInternalNotes,
    } = dto;

    const attemptsIdentityEdit =
      childFirstName !== undefined ||
      childLastName1 !== undefined ||
      childLastName2 !== undefined ||
      hasNoSecondLastName !== undefined ||
      childLastName !== undefined ||
      childBirthDate !== undefined ||
      gender !== undefined ||
      parent1FirstName !== undefined ||
      parent1LastName !== undefined ||
      parent1Phone !== undefined ||
      parent1Email !== undefined ||
      parent2FirstName !== undefined ||
      parent2LastName !== undefined ||
      parent2Phone !== undefined ||
      parent2Email !== undefined;

    if (!isPhase1Editable && attemptsIdentityEdit) {
      throw new BadRequestException(
        current.status === ApplicationStatus.CENSADO
          ? 'Para editar los datos identificativos de un educando censado usa el formulario específico de censo.'
          : 'No se pueden modificar los datos básicos de una inscripción ya finalizada desde la edición rápida.',
      );
    }

    let surnameUpdates: Record<string, unknown> = {};
    if (
      childLastName1 !== undefined ||
      childLastName2 !== undefined ||
      hasNoSecondLastName !== undefined ||
      noSecondLastNameJustification !== undefined ||
      childLastName !== undefined
    ) {
      const resolved = resolveAndValidateSurnames({
        childLastName1: childLastName1 ?? current.childLastName1,
        childLastName2:
          hasNoSecondLastName === true
            ? null
            : childLastName2 !== undefined
              ? childLastName2
              : current.childLastName2,
        hasNoSecondLastName: hasNoSecondLastName ?? current.hasNoSecondLastName,
        noSecondLastNameJustification:
          noSecondLastNameJustification !== undefined
            ? noSecondLastNameJustification
            : current.noSecondLastNameJustification,
        childLastName,
      });
      surnameUpdates = { ...resolved };
    }

    if (childBirthDate !== undefined) {
      validateBirthDateAndBranch(childBirthDate, { allowAdultResponsables: true });
    }

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        ...(isPhase1Editable
          ? {
              ...(childFirstName !== undefined ? { childFirstName: childFirstName.trim() } : {}),
              ...surnameUpdates,
              ...(childBirthDate !== undefined
                ? { childBirthDate: new Date(childBirthDate) }
                : {}),
              ...(gender !== undefined ? { gender } : {}),
              ...(parent1FirstName !== undefined
                ? { parent1FirstName: parent1FirstName.trim() }
                : {}),
              ...(parent1LastName !== undefined
                ? { parent1LastName: parent1LastName.trim() }
                : {}),
              ...(parent1Phone !== undefined ? { parent1Phone: normalizePhone(parent1Phone) } : {}),
              ...(parent1Email !== undefined
                ? { parent1Email: parent1Email.trim().toLowerCase() }
                : {}),
              ...(parent2FirstName !== undefined
                ? { parent2FirstName: normalizeOptionalString(parent2FirstName) }
                : {}),
              ...(parent2LastName !== undefined
                ? { parent2LastName: normalizeOptionalString(parent2LastName) }
                : {}),
              ...(parent2Phone !== undefined
                ? { parent2Phone: parent2Phone ? normalizePhone(parent2Phone) : null }
                : {}),
              ...(parent2Email !== undefined
                ? {
                    parent2Email: parent2Email
                      ? parent2Email.trim().toLowerCase()
                      : null,
                  }
                : {}),
            }
          : {}),
        ...(motivation !== undefined ? { motivation: normalizeOptionalString(motivation) } : {}),
        ...(hasFamilyInGroup !== undefined ? { hasFamilyInGroup } : {}),
        ...(familyMemberDetails !== undefined
          ? { familyMemberDetails: normalizeOptionalString(familyMemberDetails) }
          : {}),
        ...(comesFromOtherGroup !== undefined ? { comesFromOtherGroup } : {}),
        ...(originGroupDetails !== undefined
          ? { originGroupDetails: normalizeOptionalString(originGroupDetails) }
          : {}),
        ...(socialInclusionPriority !== undefined ? { socialInclusionPriority } : {}),
        ...(kraalInternalNotes !== undefined
          ? { kraalInternalNotes: normalizeOptionalString(kraalInternalNotes) }
          : {}),
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_UPDATED', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'detail', user: context?.user });
  }

  // 5b. Editar expediente censado
  async updateCensus(
    id: string,
    dto: UpdateCensusDto,
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Censado con ID ${id} no encontrado`);
    if (current.status !== ApplicationStatus.CENSADO) {
      throw new BadRequestException('Solo se pueden editar personas del censo.');
    }

    const {
      childBirthDate,
      childFirstName,
      childLastName1,
      childLastName2,
      hasNoSecondLastName,
      noSecondLastNameJustification,
      childLastName,
      gender,
      streetAddress,
      streetNumber,
      apartmentDoor,
      ApartmentDoor,
      postalCode,
      municipality,
      province,
      parent1FirstName,
      parent1LastName,
      parent1Phone,
      parent1Email,
      parent1Relationship,
      parent2FirstName,
      parent2LastName,
      parent2Phone,
      parent2Email,
      parent2Relationship,
      motivation,
      hasFamilyInGroup,
      familyMemberDetails,
      comesFromOtherGroup,
      originGroupDetails,
      socialInclusionPriority,
      kraalInternalNotes,
      familyUnitId: _omitFam,
      idempotencyKey: _omitIdemp,
      ...enrollmentData
    } = dto;

    let surnameUpdates: Record<string, unknown> = {};
    if (
      childLastName1 !== undefined ||
      childLastName2 !== undefined ||
      hasNoSecondLastName !== undefined ||
      noSecondLastNameJustification !== undefined ||
      childLastName !== undefined
    ) {
      const resolved = resolveAndValidateSurnames({
        childLastName1: childLastName1 ?? current.childLastName1,
        childLastName2:
          hasNoSecondLastName === true
            ? null
            : childLastName2 !== undefined
              ? childLastName2
              : current.childLastName2,
        hasNoSecondLastName: hasNoSecondLastName ?? current.hasNoSecondLastName,
        noSecondLastNameJustification:
          noSecondLastNameJustification !== undefined
            ? noSecondLastNameJustification
            : current.noSecondLastNameJustification,
        childLastName,
      });
      surnameUpdates = { ...resolved };
    }

    if (childBirthDate !== undefined) {
      validateBirthDateAndBranch(childBirthDate, { allowAdultResponsables: true });
    }

    const currentDecrypted = current.enrollment
      ? this.decryptEnrollmentFields(current.enrollment)
      : null;

    if (enrollmentData.childDni !== undefined) {
      await this.assertUniqueChildDni(normalizeDni(enrollmentData.childDni), id, [
        enrollmentData.parent1Dni ?? currentDecrypted?.parent1Dni,
        enrollmentData.parent2Dni ?? currentDecrypted?.parent2Dni,
        enrollmentData.accountHolderDni ?? currentDecrypted?.accountHolderDni,
      ]);
    }

    const encryptedPatch = this.encryptEnrollmentData(enrollmentData);
    const doorValue = apartmentDoor !== undefined ? apartmentDoor : ApartmentDoor;

    const updated = await this.prisma.$transaction(async (tx) => {
      const applicant = await tx.applicant.update({
        where: { id },
        data: {
          ...(childFirstName !== undefined ? { childFirstName: childFirstName.trim() } : {}),
          ...surnameUpdates,
          ...(childBirthDate !== undefined ? { childBirthDate: new Date(childBirthDate) } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(streetAddress !== undefined ? { streetAddress: streetAddress.trim() } : {}),
          ...(streetNumber !== undefined
            ? { streetNumber: normalizeOptionalString(streetNumber) }
            : {}),
          ...(doorValue !== undefined ? { apartmentDoor: normalizeOptionalString(doorValue) } : {}),
          ...(postalCode !== undefined ? { postalCode: postalCode.trim() } : {}),
          ...(municipality !== undefined ? { municipality: municipality.trim() } : {}),
          ...(province !== undefined ? { province: province.trim() } : {}),
          ...(parent1FirstName !== undefined ? { parent1FirstName: parent1FirstName.trim() } : {}),
          ...(parent1LastName !== undefined ? { parent1LastName: parent1LastName.trim() } : {}),
          ...(parent1Phone !== undefined ? { parent1Phone: normalizePhone(parent1Phone) } : {}),
          ...(parent1Email !== undefined
            ? { parent1Email: parent1Email.trim().toLowerCase() }
            : {}),
          ...(parent1Relationship !== undefined
            ? { parent1Relationship: normalizeOptionalString(parent1Relationship) }
            : {}),
          ...(parent2FirstName !== undefined
            ? { parent2FirstName: normalizeOptionalString(parent2FirstName) }
            : {}),
          ...(parent2LastName !== undefined
            ? { parent2LastName: normalizeOptionalString(parent2LastName) }
            : {}),
          ...(parent2Phone !== undefined
            ? { parent2Phone: parent2Phone ? normalizePhone(parent2Phone) : null }
            : {}),
          ...(parent2Email !== undefined
            ? { parent2Email: parent2Email ? parent2Email.trim().toLowerCase() : null }
            : {}),
          ...(parent2Relationship !== undefined
            ? { parent2Relationship: normalizeOptionalString(parent2Relationship) }
            : {}),
          ...(motivation !== undefined ? { motivation: normalizeOptionalString(motivation) } : {}),
          ...(hasFamilyInGroup !== undefined ? { hasFamilyInGroup } : {}),
          ...(familyMemberDetails !== undefined
            ? { familyMemberDetails: normalizeOptionalString(familyMemberDetails) }
            : {}),
          ...(comesFromOtherGroup !== undefined ? { comesFromOtherGroup } : {}),
          ...(originGroupDetails !== undefined
            ? { originGroupDetails: normalizeOptionalString(originGroupDetails) }
            : {}),
          ...(socialInclusionPriority !== undefined ? { socialInclusionPriority } : {}),
          ...(kraalInternalNotes !== undefined
            ? { kraalInternalNotes: normalizeOptionalString(kraalInternalNotes) }
            : {}),
        },
      });

      if (!current.enrollment) {
        throw new BadRequestException('El censado no tiene una inscripción asociada.');
      }

      const {
        childDni: _cDni,
        parent1Dni: _p1Dni,
        parent2Dni: _p2Dni,
        accountHolderDni: _aDni,
        iban: _iban,
        chronicDiseases: _cd,
        allergies: _al,
        medHeadache: _mh,
        medFever: _mf,
        medStomach: _ms,
        medThroat: _mt,
        medicalObservations: _mo,
        ...plainEnrollmentFields
      } = enrollmentData;

      await tx.enrollmentDetails.update({
        where: { applicantId: id },
        data: {
          ...plainEnrollmentFields,
          ...encryptedPatch,
          ...(plainEnrollmentFields.childPhone !== undefined
            ? {
                childPhone: plainEnrollmentFields.childPhone
                  ? normalizePhone(plainEnrollmentFields.childPhone)
                  : null,
              }
            : {}),
          ...(plainEnrollmentFields.childEmail !== undefined
            ? {
                childEmail: plainEnrollmentFields.childEmail
                  ? plainEnrollmentFields.childEmail.trim().toLowerCase()
                  : null,
              }
            : {}),
        },
      });

      return tx.applicant.findUniqueOrThrow({
        where: { id: applicant.id },
        include: { enrollment: true },
      });
    });

    await this.recordAudit(context, 'APPLICATION_CENSUS_UPDATED', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'detail', user: context?.user });
  }

  // ============================================================================
  // MÁQUINA DE ESTADOS FORMAL: Acciones de negocio explícitas
  // ============================================================================

  // Acción 1: Validar solicitud inicial (PENDIENTE_REVISION -> LISTA_ESPERA)
  async validateApplication(id: string, context?: AuditContext): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    assertTransitionAllowed(
      current.status,
      ApplicationStatus.LISTA_ESPERA,
      'Validar solicitud a lista de espera',
    );

    const { isIncomplete, missingFields } = this.evaluateCompleteness(current);
    if (isIncomplete) {
      throw new BadRequestException(
        `No se puede validar la solicitud porque faltan datos obligatorios: ${missingFields.join(', ')}.`,
      );
    }

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.LISTA_ESPERA,
        reviewedAt: new Date(),
        reviewedById: context?.actorId ?? null,
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_VALIDATED', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // Acción 2: Ofertar plaza y generar enlace mágico temporal (+7 días por defecto)
  async offerSpot(
    id: string,
    dtoOrDays: OfferSpotDto | number = 7,
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    assertTransitionAllowed(current.status, ApplicationStatus.PLAZA_OFERTADA, 'Ofertar plaza');
    validateBirthDateAndBranch(current.childBirthDate, { allowAdultResponsables: true });

    const daysValid = typeof dtoOrDays === 'number' ? dtoOrDays : dtoOrDays.daysValid ?? 7;
    const { tokenHash, encryptedToken, expiresAt } = this.generateMagicTokenPair(daysValid);

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.PLAZA_OFERTADA,
        enrollmentToken: encryptedToken,
        enrollmentTokenHash: tokenHash,
        tokenExpiresAt: expiresAt,
        tokenUsedAt: null,
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_SPOT_OFFERED', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // Acción 3: Renovar enlace mágico caducado o reabrir en PLAZA_OFERTADA invalidando el anterior
  async renewMagicLink(
    id: string,
    dto: OfferSpotDto = {},
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    if (
      current.status !== ApplicationStatus.PLAZA_OFERTADA &&
      current.status !== ApplicationStatus.INSCRIPCION_COMPLETADA
    ) {
      throw new BadRequestException(
        'Solo se puede renovar el enlace cuando la plaza está ofertada o la inscripción pendiente de revisión.',
      );
    }

    const daysValid = dto.daysValid ?? 7;
    const { tokenHash, encryptedToken, expiresAt } = this.generateMagicTokenPair(daysValid);

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.PLAZA_OFERTADA,
        enrollmentToken: encryptedToken,
        enrollmentTokenHash: tokenHash,
        tokenExpiresAt: expiresAt,
        tokenUsedAt: null,
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_TOKEN_RENEWED', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // Acción 4: Devolver a lista de espera (e invalidar enlace mágico activo)
  async returnToWaitlist(
    id: string,
    dto: ReturnToWaitlistDto = {},
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    if (current.status === ApplicationStatus.CENSADO) {
      throw new BadRequestException(
        'Un educando censado no puede volver a lista de espera; tramita su baja si corresponde.',
      );
    }
    assertTransitionAllowed(
      current.status,
      ApplicationStatus.LISTA_ESPERA,
      'Volver a lista de espera',
    );

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.LISTA_ESPERA,
        enrollmentToken: null,
        enrollmentTokenHash: null,
        tokenExpiresAt: null,
        ...(dto.reason
          ? {
              kraalInternalNotes: [current.kraalInternalNotes, `[Vuelta a lista de espera]: ${dto.reason}`]
                .filter(Boolean)
                .join('\n'),
            }
          : {}),
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_RETURNED_TO_WAITLIST', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // Acción 5: Marcar inscripción como revisada por Secretaría
  async markEnrollmentReviewed(id: string, context?: AuditContext): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    if (current.status !== ApplicationStatus.INSCRIPCION_COMPLETADA) {
      throw new BadRequestException(
        'Solo se pueden marcar como revisadas las inscripciones completadas.',
      );
    }

    const missing = this.evaluateCensusReadiness(current);
    if (missing.length > 0) {
      throw new BadRequestException(
        `La inscripción tiene campos obligatorios pendientes: ${missing.join(', ')}.`,
      );
    }

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        reviewedAt: new Date(),
        reviewedById: context?.actorId ?? null,
      },
      include: { enrollment: true },
    });

    await this.recordAudit(context, 'APPLICATION_REVIEWED', `applicant:${id}`);
    return this.enrichApplicant(updated, { projection: 'detail', user: context?.user });
  }

  // Acción 6: Censar oficialmente (INSCRIPCION_COMPLETADA -> CENSADO)
  async admitToCensus(id: string, context?: AuditContext): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    assertTransitionAllowed(current.status, ApplicationStatus.CENSADO, 'Alta en el censo oficial');

    const missing = this.evaluateCensusReadiness(current);
    if (missing.length > 0) {
      throw new BadRequestException(
        `No se puede censar al educando porque faltan requisitos obligatorios: ${missing.join(', ')}.`,
      );
    }

    const branchCalc = validateBirthDateAndBranch(current.childBirthDate, {
      allowAdultResponsables: true,
    });
    const now = new Date();

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.CENSADO,
        reviewedAt: current.reviewedAt ?? now,
        reviewedById: current.reviewedById ?? context?.actorId ?? null,
        admittedAt: now,
        admittedById: context?.actorId ?? null,
        censusSolarRound: branchCalc.solarRound.label,
        censusBranch: branchCalc.branch,
        enrollmentToken: null,
        enrollmentTokenHash: null,
        tokenExpiresAt: null,
      },
      include: { enrollment: true },
    });

    await this.recordAudit(
      context,
      'APPLICATION_CENSUS_ADMITTED',
      `applicant:${id}:round=${branchCalc.solarRound.label}:branch=${branchCalc.branch}`,
    );
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // Acción 7: Dar de baja o cerrar expediente con motivo estructurado
  async deactivate(
    id: string,
    dto: DeactivateApplicationDto,
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    if (current.status === ApplicationStatus.BAJA) {
      throw new BadRequestException('El expediente ya se encuentra en estado de Baja.');
    }

    assertTransitionAllowed(current.status, ApplicationStatus.BAJA, 'Dar de baja / cerrar');

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        previousStatus: current.status,
        status: ApplicationStatus.BAJA,
        closedAt: new Date(),
        closedById: context?.actorId ?? null,
        closureReason: dto.closureReason,
        closureNotes: normalizeOptionalString(dto.closureNotes),
        enrollmentToken: null,
        enrollmentTokenHash: null,
        tokenExpiresAt: null,
      },
      include: { enrollment: true },
    });

    await this.recordAudit(
      context,
      'APPLICATION_DEACTIVATED',
      `applicant:${id}:reason=${dto.closureReason}`,
    );
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // Acción 8: Reactivar un expediente dado de baja
  async reactivate(
    id: string,
    dto: ReactivateApplicationDto = {},
    context?: AuditContext,
  ): Promise<EnrichedApplicant> {
    const current = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!current) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    if (current.status !== ApplicationStatus.BAJA) {
      throw new BadRequestException('Solo se pueden reactivar expedientes que están en Baja.');
    }

    const completenessIfEnrolled = current.enrollment
      ? this.evaluateCensusReadiness(current).length === 0
      : false;
    const targetStatus = resolveReactivationTargetStatus(
      current.previousStatus,
      Boolean(current.enrollment),
      completenessIfEnrolled,
    );

    assertTransitionAllowed(current.status, targetStatus, 'Reactivar expediente');

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: targetStatus,
        closedAt: null,
        closedById: null,
        closureReason: null,
        closureNotes: null,
        previousStatus: null,
        ...(dto.notes
          ? {
              kraalInternalNotes: [current.kraalInternalNotes, `[Reactivación]: ${dto.notes}`]
                .filter(Boolean)
                .join('\n'),
            }
          : {}),
      },
      include: { enrollment: true },
    });

    await this.recordAudit(
      context,
      'APPLICATION_REACTIVATED',
      `applicant:${id}:to=${targetStatus}`,
    );
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // ============================================================================
  // FLUJO SEGURO DEL ENLACE MÁGICO (Un solo uso, atómico y minimización de datos)
  // ============================================================================

  private async lookupMagicApplicant(rawToken: string) {
    const cleanToken = rawToken.trim();
    if (!cleanToken) {
      throw new NotFoundException('El enlace de inscripción no es válido.');
    }

    const tokenHash = this.crypto.hashDeterministic(cleanToken);
    const applicant = this.prisma.applicant.findFirst
      ? await this.prisma.applicant.findFirst({
          where: {
            OR: [
              ...(tokenHash ? [{ enrollmentTokenHash: tokenHash }] : []),
              { enrollmentToken: cleanToken },
            ],
          },
          include: { enrollment: true },
        })
      : await this.prisma.applicant.findUnique({
          where: { enrollmentToken: cleanToken },
          include: { enrollment: true },
        });

    if (!applicant) {
      throw new NotFoundException('El enlace de inscripción no es válido o ya ha sido utilizado.');
    }

    if (
      applicant.status !== ApplicationStatus.PLAZA_OFERTADA ||
      applicant.tokenUsedAt !== null
    ) {
      throw new ForbiddenException(
        'Este enlace de inscripción ya fue utilizado o ya no está activo.',
      );
    }

    if (!applicant.tokenExpiresAt || new Date() > new Date(applicant.tokenExpiresAt)) {
      throw new BadRequestException(
        'El plazo para rellenar esta inscripción ha expirado. Contacta con Secretaría del Grupo IV para renovarlo.',
      );
    }

    return applicant;
  }

  // 7. Obtener datos mínimos necesarios mediante Token Mágico (Para la familia)
  async findByMagicToken(token: string): Promise<MagicEnrollmentPublicView> {
    const applicant = await this.lookupMagicApplicant(token);
    const calc = calculateScoutBranchForRound(applicant.childBirthDate);

    return {
      id: applicant.id,
      status: applicant.status,
      childFirstName: applicant.childFirstName,
      childLastName1: applicant.childLastName1,
      childLastName2: applicant.childLastName2,
      hasNoSecondLastName: applicant.hasNoSecondLastName,
      noSecondLastNameJustification: applicant.noSecondLastNameJustification,
      childLastName: applicant.childLastName,
      childBirthDate: applicant.childBirthDate,
      gender: applicant.gender,
      streetAddress: applicant.streetAddress,
      streetNumber: applicant.streetNumber,
      apartmentDoor: applicant.apartmentDoor,
      postalCode: applicant.postalCode,
      municipality: applicant.municipality,
      province: applicant.province,
      parent1FirstName: applicant.parent1FirstName,
      parent1LastName: applicant.parent1LastName,
      parent1Phone: applicant.parent1Phone,
      parent1Email: applicant.parent1Email,
      parent1Relationship: applicant.parent1Relationship,
      parent2FirstName: applicant.parent2FirstName,
      parent2LastName: applicant.parent2LastName,
      parent2Phone: applicant.parent2Phone,
      parent2Email: applicant.parent2Email,
      parent2Relationship: applicant.parent2Relationship,
      calculatedBranch: calc.branch,
      currentAge: calc.age,
      solarRound: calc.solarRound.label,
      tokenExpiresAt: applicant.tokenExpiresAt,
    };
  }

  // 8. Completar la inscripción oficial mediante enlace mágico (atómico e irreversible por token)
  async completeMagicEnrollment(
    token: string,
    dto: CompleteEnrollmentDto,
    context?: AuditContext,
  ) {
    const applicant = await this.lookupMagicApplicant(token);

    if (dto.gender !== Gender.MASCULINO && dto.gender !== Gender.FEMENINO) {
      throw new BadRequestException('Debes seleccionar Masculino o Femenino.');
    }

    if (dto.custodyType === 'CUSTODIA_CONJUNTA') {
      if (!dto.parent2Dni?.trim() || !dto.signatureParent2?.trim()) {
        throw new BadRequestException(
          'En caso de custodia conjunta son obligatorios el DNI y la firma de ambos progenitores/tutores.',
        );
      }
    }

    if (!dto.acceptsDataStorage || !dto.acceptsDataTransfer) {
      throw new BadRequestException(
        'Debes aceptar las autorizaciones obligatorias de protección de datos y cesión federativa.',
      );
    }
    if (!dto.authorizesEmergency) {
      throw new BadRequestException('Debes marcar la autorización médica de urgencia.');
    }
    if (!dto.authorizesSepa) {
      throw new BadRequestException('Debes aceptar la orden de domiciliación SEPA.');
    }

    const surnames =
      dto.childLastName1 !== undefined ||
      dto.childLastName2 !== undefined ||
      dto.hasNoSecondLastName !== undefined
        ? resolveAndValidateSurnames({
            childLastName1: dto.childLastName1 ?? applicant.childLastName1,
            childLastName2:
              dto.hasNoSecondLastName === true
                ? null
                : dto.childLastName2 !== undefined
                  ? dto.childLastName2
                  : applicant.childLastName2,
            hasNoSecondLastName: dto.hasNoSecondLastName ?? applicant.hasNoSecondLastName,
            noSecondLastNameJustification:
              dto.noSecondLastNameJustification ?? applicant.noSecondLastNameJustification,
          })
        : null;

    if (dto.childBirthDate) {
      validateBirthDateAndBranch(dto.childBirthDate, { allowAdultResponsables: true });
    }

    const cleanChildDni = normalizeDni(dto.childDni);
    const childDniHash = await this.assertUniqueChildDni(cleanChildDni, applicant.id, [
      dto.parent1Dni,
      dto.parent2Dni,
      dto.accountHolderDni,
    ]);

    const cleanIban = normalizeIban(dto.iban);
    const now = new Date();
    const doorValue = dto.apartmentDoor !== undefined ? dto.apartmentDoor : dto.ApartmentDoor;
    const encryptedFields = this.encryptEnrollmentData({
      childDni: cleanChildDni,
      parent1Dni: dto.parent1Dni,
      parent2Dni: dto.parent2Dni ?? null,
      accountHolderDni: dto.accountHolderDni,
      iban: cleanIban,
      chronicDiseases: dto.chronicDiseases ?? null,
      allergies: dto.allergies ?? null,
      medHeadache: dto.medHeadache ?? null,
      medFever: dto.medFever ?? null,
      medStomach: dto.medStomach ?? null,
      medThroat: dto.medThroat ?? null,
      medicalObservations: dto.medicalObservations ?? null,
      signatureParent1: dto.signatureParent1,
      signatureParent2: dto.signatureParent2 ?? null,
    });

    const p1FirstName = dto.parent1FirstName?.trim() || applicant.parent1FirstName;
    const p1LastName = dto.parent1LastName?.trim() || applicant.parent1LastName;
    const p2FirstName =
      dto.parent2FirstName !== undefined
        ? normalizeOptionalString(dto.parent2FirstName)
        : applicant.parent2FirstName;
    const p2LastName =
      dto.parent2LastName !== undefined
        ? normalizeOptionalString(dto.parent2LastName)
        : applicant.parent2LastName;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Consumo atómico del enlace mágico para prevenir condiciones de carrera y dobles envíos
      const claim = await tx.applicant.updateMany({
        where: {
          id: applicant.id,
          status: ApplicationStatus.PLAZA_OFERTADA,
          tokenUsedAt: null,
          tokenExpiresAt: { gt: now },
        },
        data: {
          status: ApplicationStatus.INSCRIPCION_COMPLETADA,
          enrollmentToken: null,
          enrollmentTokenHash: null,
          tokenExpiresAt: null,
          tokenUsedAt: now,
          ...(dto.childFirstName ? { childFirstName: dto.childFirstName.trim() } : {}),
          ...surnames,
          ...(dto.childBirthDate ? { childBirthDate: new Date(dto.childBirthDate) } : {}),
          gender: dto.gender,
          streetAddress: dto.streetAddress.trim(),
          streetNumber: normalizeOptionalString(dto.streetNumber),
          apartmentDoor: normalizeOptionalString(doorValue),
          postalCode: dto.postalCode.trim(),
          municipality: dto.municipality.trim(),
          province: dto.province.trim(),
          parent1FirstName: p1FirstName,
          parent1LastName: p1LastName,
          ...(dto.parent1Phone ? { parent1Phone: normalizePhone(dto.parent1Phone) } : {}),
          ...(dto.parent1Email ? { parent1Email: dto.parent1Email.trim().toLowerCase() } : {}),
          ...(dto.parent1Relationship !== undefined
            ? { parent1Relationship: normalizeOptionalString(dto.parent1Relationship) }
            : {}),
          parent2FirstName: p2FirstName,
          parent2LastName: p2LastName,
          ...(dto.parent2Phone !== undefined
            ? { parent2Phone: dto.parent2Phone ? normalizePhone(dto.parent2Phone) : null }
            : {}),
          ...(dto.parent2Email !== undefined
            ? { parent2Email: dto.parent2Email ? dto.parent2Email.trim().toLowerCase() : null }
            : {}),
          ...(dto.parent2Relationship !== undefined
            ? { parent2Relationship: normalizeOptionalString(dto.parent2Relationship) }
            : {}),
        },
      });

      if (claim.count === 0) {
        throw new ConflictException(
          'Esta inscripción ya ha sido completada anteriormente o el enlace ha expirado.',
        );
      }

      const enrollmentPayload = {
        childDni: encryptedFields.childDni ?? null,
        childDniHash,
        childPhone: dto.childPhone ? normalizePhone(dto.childPhone) : null,
        childEmail: dto.childEmail ? dto.childEmail.trim().toLowerCase() : null,
        legalStatus: dto.legalStatus ?? 'MENOR',
        circularPreference: dto.circularPreference ?? 'EMAIL',
        parent1Dni: encryptedFields.parent1Dni ?? '',
        parent2Dni: encryptedFields.parent2Dni ?? null,
        parentsMaritalStatus: normalizeOptionalString(dto.parentsMaritalStatus),
        custodyType: dto.custodyType ?? 'SIN_ESPECIFICAR',
        acceptsDataStorage: dto.acceptsDataStorage,
        acceptsDataTransfer: dto.acceptsDataTransfer,
        authorizesImages: dto.authorizesImages,
        consentTextVersion: dto.consentTextVersion ?? '2026.1',
        bloodType: normalizeOptionalString(dto.bloodType),
        chronicDiseases: encryptedFields.chronicDiseases ?? null,
        allergies: encryptedFields.allergies ?? null,
        medHeadache: encryptedFields.medHeadache ?? null,
        medFever: encryptedFields.medFever ?? null,
        medStomach: encryptedFields.medStomach ?? null,
        medThroat: encryptedFields.medThroat ?? null,
        medicalObservations: encryptedFields.medicalObservations ?? null,
        emergencyContactName: normalizeOptionalString(dto.emergencyContactName),
        emergencyContactPhone: dto.emergencyContactPhone
          ? normalizePhone(dto.emergencyContactPhone)
          : null,
        emergencyContactRelationship: normalizeOptionalString(dto.emergencyContactRelationship),
        authorizesEmergency: dto.authorizesEmergency,
        accountHolderName: dto.accountHolderName.trim(),
        accountHolderDni: encryptedFields.accountHolderDni ?? '',
        accountHolderAddress: normalizeOptionalString(dto.accountHolderAddress),
        accountHolderMunicipality: normalizeOptionalString(dto.accountHolderMunicipality),
        accountHolderPostalCode: normalizeOptionalString(dto.accountHolderPostalCode),
        iban: encryptedFields.iban ?? '',
        ibanLast4: encryptedFields.ibanLast4 ?? null,
        authorizesSepa: dto.authorizesSepa,
        sepaSignedAt: now,
        signer1FullName:
          normalizeOptionalString(dto.signer1FullName) ?? `${p1FirstName} ${p1LastName}`.trim(),
        signer1Dni: normalizeDni(dto.signer1Dni ?? dto.parent1Dni),
        signatureParent1: encryptedFields.signatureParent1 ?? '',
        signedAtParent1: now,
        signer2FullName: dto.signatureParent2
          ? normalizeOptionalString(dto.signer2FullName) ??
            ([p2FirstName, p2LastName].filter(Boolean).join(' ') || null)
          : null,
        signer2Dni: dto.signatureParent2 ? normalizeDni(dto.signer2Dni ?? dto.parent2Dni) : null,
        signatureParent2: encryptedFields.signatureParent2 ?? null,
        signedAtParent2: dto.signatureParent2 ? now : null,
      };

      await tx.enrollmentDetails.upsert({
        where: { applicantId: applicant.id },
        create: {
          applicantId: applicant.id,
          ...enrollmentPayload,
        },
        update: enrollmentPayload,
      });

      return tx.applicant.findUniqueOrThrow({
        where: { id: applicant.id },
        include: { enrollment: true },
      });
    });

    await this.recordAudit(context, 'APPLICATION_ENROLLMENT_COMPLETED', `applicant:${applicant.id}`);
    return this.enrichApplicant(updated, { projection: 'summary' });
  }

  // 9. Vista previa segura del mapeo preparado para Aurora (sin realizar peticiones externas)
  async getAuroraPreview(
    id: string,
    config: AuroraIntegrationConfig = {},
    context?: AuditContext,
  ) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!applicant) throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);

    const decryptedApplicant = applicant.enrollment
      ? { ...applicant, enrollment: this.decryptEnrollmentFields(applicant.enrollment) }
      : applicant;

    await this.recordAudit(context, 'APPLICATION_AURORA_PAYLOAD_PREVIEW', `applicant:${id}`);
    const payload = this.aurora.toCreateContactPayload(decryptedApplicant, config, {
      includeEphemeralCredentials: false,
    });
    if (context?.user && !canReadSensitiveMedicalOrBankData(context.user, 'medical')) {
      payload.diseases = null;
      payload.tin = null;
    }
    return payload;
  }

  // 10. Eliminar solicitud excepcionalmente (registrado en auditoría)
  async remove(id: string, context?: AuditContext) {
    const existing = await this.prisma.applicant.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);
    }

    const deleted = await this.prisma.applicant.delete({
      where: { id },
    });

    await this.recordAudit(
      context,
      'APPLICATION_DELETED',
      `applicant:${id}:prevStatus=${existing.status}`,
    );
    return deleted;
  }

  getClosureReasonLabels() {
    return CLOSURE_REASON_LABELS;
  }
}
