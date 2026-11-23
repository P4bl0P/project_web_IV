import { BadRequestException, Injectable } from '@nestjs/common';
import { ApplicationStatus, Gender, type Applicant, type EnrollmentDetails } from '@prisma/client';
import { randomBytes, randomUUID } from 'node:crypto';
import { calculateScoutBranchForRound, extractDateParts } from './scout-branch.util';

export type AuroraGenre = 'MALE' | 'FEMALE';

/**
 * Mapeo centralizado de ramas internas hacia el enumerado esperado por Aurora.
 * Los valores exactos finales (p. ej. enum o IDs de Aurora) podrán ajustarse en un único punto
 * sin acoplar el resto de la aplicación. Rutas y menores de 6 años están explícitamente excluidos.
 */
export const AURORA_BRANCH_MAP: Record<string, string | null> = {
  Castores: 'CASTORES',
  Lobatos: 'LOBATOS',
  Rangers: 'RANGERS',
  Pioneros: 'PIONEROS',
  Responsables: 'RESPONSABLES',
  Rutas: null,
  'Menor de 6 años': null,
};

/**
 * Configuración de referencia organizativa/geográfica externa de Aurora.
 * Estos identificadores no deben inventarse; deben proporcionarse desde configuración real de Aurora.
 */
export interface AuroraIntegrationConfig {
  countryId?: string | null;
  administrativeAreaLevel1Id?: string | null;
  administrativeAreaLevel2Id?: string | null;
  administrativeAreaLevel3Id?: string | null;
  organizationalEntityIds?: string[];
  unitName?: string | null;
  types?: string[];
}

export interface AuroraCreateContactPayload {
  // Campos obligatorios confirmados en mutación ScoutsCreateContact
  startAt: string; // Exclusivamente fecha efectiva de alta en censo (admittedAt)
  name: string;
  surname1: string;
  surname2: string | null;
  tin: string | null; // DNI opcional; único si existe
  genre: AuroraGenre;
  birthDate: string; // YYYY-MM-DD
  zip: string;
  locality: string;
  address1: string;
  address2: string | null;
  organizationalEntityIds: string[];
  branch: string;
  username?: string;
  password?: string;

  // Referencias geográficas y de catálogo (pendientes de parametrización real con Aurora)
  countryId: string | null;
  administrativeAreaLevel1Id: string | null;
  administrativeAreaLevel2Id: string | null;
  administrativeAreaLevel3Id: string | null;
  unitName: string | null;
  types: string[];
  parentRelationshipType: string | null;
  externalContactId: string;
  externalUserId: string | null;
  accountId: string | null;

  // Estado y consentimientos resumidos (los consentimientos detallados viven en nuestro backend)
  isActive: boolean;
  isCensusable: boolean;
  isBlocked: boolean;
  hasDataAgreement: boolean;
  hasPhotoAgreement: boolean;
  diseases: string | null;

  // Contactos principales
  principalContactName: string;
  principalContactMobile: string;
  principalContactEmail: string;
  secondaryContactName: string | null;
  secondaryContactMobile: string | null;
  secondaryContactEmail: string | null;
}

export type ApplicantWithEnrollment = Applicant & {
  enrollment?: EnrollmentDetails | null;
};

function formatIsoDateOnly(value: Date | string): string {
  const parts = extractDateParts(value);
  if (!parts) {
    throw new BadRequestException('Fecha no válida para mapear a Aurora.');
  }
  const yyyy = String(parts.year).padStart(4, '0');
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

@Injectable()
export class AuroraContactMapper {
  /**
   * Mapea el género interno a los únicos valores aceptados por Aurora (MALE / FEMALE).
   */
  mapGenre(gender: Gender | null | undefined): AuroraGenre {
    if (gender === Gender.MASCULINO) return 'MALE';
    if (gender === Gender.FEMENINO) return 'FEMALE';
    throw new BadRequestException(
      'El género del educando debe ser Masculino o Femenino para sincronizar con Aurora.',
    );
  }

  /**
   * Traduce la rama calculada al valor centralizado para Aurora.
   */
  mapBranch(branchName: string): string {
    const mapped = AURORA_BRANCH_MAP[branchName];
    if (!mapped) {
      throw new BadRequestException(
        `La rama "${branchName}" no es elegible para sincronizarse como miembro del Grupo IV en Aurora.`,
      );
    }
    return mapped;
  }

  /**
   * Genera credenciales técnicas efímeras únicamente en el momento de invocar a Aurora.
   * Nunca se persisten en base de datos, no se piden a las familias ni se exponen en fichas o logs.
   */
  generateEphemeralCredentials(applicantId: string): {
    username: string;
    password: string;
  } {
    const shortId = applicantId.replace(/-/g, '').slice(0, 8).toLowerCase();
    const suffix = randomBytes(4).toString('hex');
    const username = `g4_${shortId}_${suffix}`;
    const password = `${randomBytes(18).toString('base64url')}A1!`;
    return { username, password };
  }

  /**
   * Construye el payload preparado para Aurora sin ejecutar peticiones externas.
   * En previews de Secretaría (includeEphemeralCredentials = false), omite username y password.
   */
  toCreateContactPayload(
    applicant: ApplicantWithEnrollment,
    config: AuroraIntegrationConfig = {},
    options: { includeEphemeralCredentials?: boolean } = {},
  ): AuroraCreateContactPayload {
    if (applicant.status !== ApplicationStatus.CENSADO || !applicant.admittedAt) {
      throw new BadRequestException(
        'Solo un educando censado con fecha efectiva de alta (admittedAt) puede mapearse a Aurora.',
      );
    }

    const enrollment = applicant.enrollment;
    if (!enrollment) {
      throw new BadRequestException(
        'El educando debe disponer de ficha de inscripción completa para mapearse a Aurora.',
      );
    }

    if (
      !applicant.streetAddress?.trim() ||
      !applicant.postalCode?.trim() ||
      !applicant.municipality?.trim()
    ) {
      throw new BadRequestException(
        'Falta la dirección completa (calle, código postal y localidad) requerida por Aurora.',
      );
    }

    const branchCalc = calculateScoutBranchForRound(
      applicant.childBirthDate,
      applicant.censusSolarRound ?? applicant.admittedAt,
    );
    const branchName = applicant.censusBranch || branchCalc.branch;
    const auroraBranch = this.mapBranch(branchName);
    const genre = this.mapGenre(applicant.gender);

    const surname1 = applicant.childLastName1.trim();
    const surname2 = applicant.hasNoSecondLastName
      ? null
      : applicant.childLastName2?.trim() || null;

    const cleanChildDni = enrollment.childDni?.trim().toUpperCase() || null;
    const address1 = [applicant.streetAddress.trim(), applicant.streetNumber?.trim()]
      .filter(Boolean)
      .join(', ');
    const address2 = applicant.apartmentDoor?.trim() || null;

    const medicalSummaryParts = [
      enrollment.chronicDiseases?.trim()
        ? `Enfermedades: ${enrollment.chronicDiseases.trim()}`
        : null,
      enrollment.allergies?.trim() ? `Alergias: ${enrollment.allergies.trim()}` : null,
      enrollment.medicalObservations?.trim()
        ? `Obs: ${enrollment.medicalObservations.trim()}`
        : null,
    ].filter(Boolean);

    const secondaryContactName =
      [applicant.parent2FirstName?.trim(), applicant.parent2LastName?.trim()]
        .filter(Boolean)
        .join(' ') || null;

    const credentials = options.includeEphemeralCredentials
      ? this.generateEphemeralCredentials(applicant.id || randomUUID())
      : {};

    return {
      startAt: formatIsoDateOnly(applicant.admittedAt),
      name: applicant.childFirstName.trim(),
      surname1,
      surname2,
      tin: cleanChildDni,
      genre,
      birthDate: formatIsoDateOnly(applicant.childBirthDate),
      zip: applicant.postalCode.trim(),
      locality: applicant.municipality.trim(),
      address1,
      address2,
      organizationalEntityIds: config.organizationalEntityIds ?? [],
      branch: auroraBranch,
      ...credentials,
      countryId: config.countryId ?? null,
      administrativeAreaLevel1Id: config.administrativeAreaLevel1Id ?? null,
      administrativeAreaLevel2Id: config.administrativeAreaLevel2Id ?? null,
      administrativeAreaLevel3Id: config.administrativeAreaLevel3Id ?? null,
      unitName: config.unitName ?? null,
      types: config.types ?? (branchCalc.isAdultLeader ? ['LEADER'] : ['YOUTH_MEMBER']),
      parentRelationshipType: applicant.parent1Relationship?.trim() || null,
      externalContactId: applicant.id,
      externalUserId: null,
      accountId: null,
      isActive: applicant.status === ApplicationStatus.CENSADO,
      isCensusable: true,
      isBlocked: false,
      hasDataAgreement: Boolean(enrollment.acceptsDataStorage && enrollment.acceptsDataTransfer),
      hasPhotoAgreement: Boolean(enrollment.authorizesImages),
      diseases: medicalSummaryParts.length > 0 ? medicalSummaryParts.join(' | ') : null,
      principalContactName: `${applicant.parent1FirstName.trim()} ${applicant.parent1LastName.trim()}`.trim(),
      principalContactMobile: applicant.parent1Phone.trim(),
      principalContactEmail: applicant.parent1Email.trim(),
      secondaryContactName,
      secondaryContactMobile: applicant.parent2Phone?.trim() || null,
      secondaryContactEmail: applicant.parent2Email?.trim() || null,
    };
  }
}
