import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { CreateDirectCensusDto, UpdateCensusDto } from './dto/direct-census.dto';
import { QueryApplicationsDto, SortField, SortOrder } from './dto/query-applications.dto';
import { ApplicationStatus, Applicant, EnrollmentDetails } from '@prisma/client';
import { randomUUID } from 'crypto';
import { calculateScoutBranchForRound } from './scout-branch.util';

export type EnrichedApplicant = Applicant & {
  enrollment?: EnrollmentDetails | null;
  calculatedBranch: string;
  currentAge: number;
  solarRound?: string;
  priorityScore: number;
  isIncomplete: boolean;
  missingFields: string[];
};

const VALIDATION_REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[6789]\d{8}$/,
  POSTAL_CODE: /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/,
  DNI: /^[XYZxyz]?\d{7,8}[A-Za-z]$/,
  IBAN: /^ES\d{22}$/i,
};

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
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDigits(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Evalúa los campos obligatorios según la fase/estado real del registro:
   * - PENDIENTE_REVISION / LISTA_ESPERA (Solicitudes iniciales / Lista de espera sin inscripción abierta):
   *   comprueba exclusivamente los campos obligatorios de la solicitud inicial (Fase 1), salvo que ya tenga
   *   inscripción completada asociada.
   * - PLAZA_OFERTADA / INSCRIPCION_COMPLETADA / CENSADO:
   *   comprueba además los campos obligatorios de la inscripción completa (Fase 2 / Censo).
   */
  evaluateCompleteness(
    applicant: Applicant & { enrollment?: EnrollmentDetails | null },
  ): { isIncomplete: boolean; missingFields: string[] } {
    const missing: string[] = [];

    // 1. Reglas de Fase 1 (Solicitud inicial)
    if (!applicant.childFirstName || applicant.childFirstName.trim().length < 2) {
      missing.push('Nombre del educando');
    }
    if (!applicant.childLastName || applicant.childLastName.trim().length < 2) {
      missing.push('Apellidos del educando');
    }
    if (!applicant.childBirthDate || Number.isNaN(new Date(applicant.childBirthDate).getTime())) {
      missing.push('Fecha de nacimiento');
    } else {
      const birth = new Date(applicant.childBirthDate);
      const now = new Date();
      if (birth > now || now.getFullYear() - birth.getFullYear() > 22) {
        missing.push('Fecha de nacimiento válida');
      }
    }
    if (!applicant.gender) {
      missing.push('Sexo');
    }
    if (!applicant.streetAddress || applicant.streetAddress.trim().length < 3) {
      missing.push('Dirección');
    }
    if (!applicant.postalCode || !VALIDATION_REGEX.POSTAL_CODE.test(applicant.postalCode.trim())) {
      missing.push('Código postal');
    }
    if (!applicant.municipality?.trim()) {
      missing.push('Municipio');
    }
    if (!applicant.province?.trim()) {
      missing.push('Provincia');
    }
    if (!applicant.parent1FirstName || applicant.parent1FirstName.trim().length < 2) {
      missing.push('Nombre del tutor 1');
    }
    if (!applicant.parent1LastName || applicant.parent1LastName.trim().length < 2) {
      missing.push('Apellidos del tutor 1');
    }
    if (
      !applicant.parent1Phone ||
      !VALIDATION_REGEX.PHONE.test(applicant.parent1Phone.replace(/\s+/g, ''))
    ) {
      missing.push('Teléfono del tutor 1');
    }
    if (!applicant.parent1Email || !VALIDATION_REGEX.EMAIL.test(applicant.parent1Email.trim())) {
      missing.push('Correo del tutor 1');
    }

    const hasSecondParent = Boolean(
      applicant.parent2FirstName?.trim() ||
        applicant.parent2LastName?.trim() ||
        applicant.parent2Phone?.trim() ||
        applicant.parent2Email?.trim(),
    );
    if (hasSecondParent) {
      const cleanP2 = (applicant.parent2Phone || '').replace(/\s+/g, '');
      if (cleanP2 && !VALIDATION_REGEX.PHONE.test(cleanP2)) {
        missing.push('Teléfono del tutor 2 válido');
      }
      if (
        applicant.parent2Email?.trim() &&
        !VALIDATION_REGEX.EMAIL.test(applicant.parent2Email.trim())
      ) {
        missing.push('Correo del tutor 2 válido');
      }
    }

    if (applicant.hasFamilyInGroup && !applicant.familyMemberDetails?.trim()) {
      missing.push('Detalles del familiar en el grupo');
    }
    if (applicant.comesFromOtherGroup && !applicant.originGroupDetails?.trim()) {
      missing.push('Grupo de procedencia');
    }

    // En solicitudes iniciales (PENDIENTE_REVISION), sólo se exigen los datos de Fase 1.
    if (applicant.status === ApplicationStatus.PENDIENTE_REVISION) {
      return { isIncomplete: missing.length > 0, missingFields: missing };
    }

    // En LISTA_ESPERA, PLAZA_OFERTADA, INSCRIPCION_COMPLETADA y CENSADO, se evalúa la inscripción completa
    const requiresEnrollment =
      applicant.status === ApplicationStatus.LISTA_ESPERA ||
      applicant.status === ApplicationStatus.PLAZA_OFERTADA ||
      applicant.status === ApplicationStatus.INSCRIPCION_COMPLETADA ||
      applicant.status === ApplicationStatus.CENSADO ||
      Boolean(applicant.enrollment);

    if (!requiresEnrollment) {
      return { isIncomplete: missing.length > 0, missingFields: missing };
    }

    // 2. Reglas de Fase 2 (Inscripción completa y Censo)
    const enrollment = applicant.enrollment;
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
    if (
      !enrollment.iban ||
      !VALIDATION_REGEX.IBAN.test(enrollment.iban.replace(/\s+/g, ''))
    ) {
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

    if (applicant.status === ApplicationStatus.CENSADO && !applicant.admittedAt) {
      missing.push('Fecha de alta en el censo');
    }

    return { isIncomplete: missing.length > 0, missingFields: missing };
  }

  /**
   * Enriquece un registro con su rama dinámica, puntuación de prioridad y estado de integridad
   */
  private enrichApplicant(
    applicant: Applicant & { enrollment?: EnrollmentDetails | null },
  ): EnrichedApplicant {
    const { branch, age } = this.calculateScoutBranch(applicant.childBirthDate);

    // Puntuación base para ordenar: Familiar (+100), Inclusión (+50), Otro grupo (+25)
    let priorityScore = 0;
    if (applicant.hasFamilyInGroup) priorityScore += 100;
    if (applicant.socialInclusionPriority) priorityScore += 50;
    if (applicant.comesFromOtherGroup) priorityScore += 25;

    const { isIncomplete, missingFields } = this.evaluateCompleteness(applicant);

    return {
      ...applicant,
      calculatedBranch: branch,
      currentAge: age,
      priorityScore,
      isIncomplete,
      missingFields,
    };
  }

  /**
   * Filtra y ordena un conjunto de registros enriquecidos según los criterios de búsqueda, filtros y ordenación
   */
  filterAndSortApplicants(
    records: EnrichedApplicant[],
    query?: QueryApplicationsDto,
  ): EnrichedApplicant[] {
    if (!query) return records;

    let result = [...records];

    // 1. Filtro por estado o fase
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

    // 2. Buscador inteligente (tokenizado, sin tildes, insensible a mayúsculas, orden libre)
    if (query.search) {
      const normalizedSearch = normalizeSearchText(query.search);
      const tokens = normalizedSearch.split(' ').filter(Boolean);

      if (tokens.length > 0) {
        result = result.filter((r) => {
          const isInitialPhase = r.status === ApplicationStatus.PENDIENTE_REVISION;
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

    // 3. Filtro por Sección Scout
    if (query.branch && query.branch !== 'Todas') {
      const normalizedBranch = normalizeSearchText(query.branch);
      result = result.filter((r) =>
        normalizeSearchText(r.calculatedBranch).startsWith(normalizedBranch),
      );
    }

    // 4. Filtro por Sexo
    if (query.gender) {
      result = result.filter((r) => r.gender === query.gender);
    }

    // 5. Filtro por Edad
    if (query.minAge !== undefined) {
      result = result.filter((r) => r.currentAge >= query.minAge!);
    }
    if (query.maxAge !== undefined) {
      result = result.filter((r) => r.currentAge <= query.maxAge!);
    }

    // 6. Filtro por Fecha de nacimiento
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

    // 7. Filtro por Nombre de tutor (permite fragmentos en distinto orden)
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

    // 8. Filtro por Correo electrónico
    if (query.email) {
      const emailTerm = normalizeSearchText(query.email);
      if (emailTerm) {
        result = result.filter((r) => {
          const isInitialPhase = r.status === ApplicationStatus.PENDIENTE_REVISION;
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

    // 9. Filtro por Teléfono
    if (query.phone) {
      const phoneTerm = normalizeSearchText(query.phone);
      const phoneDigits = normalizeDigits(query.phone);
      result = result.filter((r) => {
        const isInitialPhase = r.status === ApplicationStatus.PENDIENTE_REVISION;
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

    // 10. Filtro por Fecha de alta en el censo (solo aplicable a registros con admittedAt, normalmente CENSADO)
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

    // 11. Filtro por Datos incompletos
    if (query.incompleteOnly === 'true') {
      result = result.filter((r) => r.isIncomplete);
    } else if (query.incompleteOnly === 'false') {
      result = result.filter((r) => !r.isIncomplete);
    }

    // 12. Ordenación
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
        // Desempate por fecha exacta de nacimiento (mayor edad = nacimiento más antiguo)
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

      // Default ('priority'): mayor prioridad primero, luego fecha de solicitud más antigua
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return result;
  }

  // 1. Crear solicitud inicial (Fase 1)
  async create(dto: CreateApplicationDto): Promise<EnrichedApplicant> {
    const { childBirthDate, ApartmentDoor, ...rest } = dto;
    const normalizedLastName = rest.childLastName.trim();
    const [firstSurname, ...otherSurnames] = normalizedLastName.split(/\s+/);
    const created = await this.prisma.applicant.create({
      data: {
        ...rest,
        childLastName: normalizedLastName,
        childLastName1: firstSurname || normalizedLastName,
        childLastName2: otherSurnames.length > 0 ? otherSurnames.join(' ') : null,
        hasNoSecondLastName: otherSurnames.length === 0,
        apartmentDoor: ApartmentDoor,
        childBirthDate: new Date(childBirthDate),
      },
    });
    return this.enrichApplicant(created);
  }

  // 2. Listar todas las solicitudes/miembros enriquecidos (Para el panel /gestion)
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
      orderBy: { createdAt: 'asc' }, // Criterio base: fecha de solicitud
    });

    const enriched = applicants.map((app) => this.enrichApplicant(app));
    const filteredAndSorted = this.filterAndSortApplicants(enriched, query);

    if (query.page !== undefined && query.pageSize !== undefined) {
      const start = (query.page - 1) * query.pageSize;
      return filteredAndSorted.slice(start, start + query.pageSize);
    }

    return filteredAndSorted;
  }

  // 3. Obtener el Censo oficial (Estado CENSADO)
  async findCensus(query?: QueryApplicationsDto): Promise<EnrichedApplicant[]> {
    const censusQuery: QueryApplicationsDto = Object.assign(new QueryApplicationsDto(), query, {
      status: ApplicationStatus.CENSADO,
    });
    return this.findAll(censusQuery);
  }

  // Alta administrativa: crea directamente la solicitud base y su inscripción definitiva.
  async createDirectCensus(dto: CreateDirectCensusDto): Promise<EnrichedApplicant> {
    const {
      childBirthDate,
      streetAddress,
      streetNumber,
      ApartmentDoor,
      postalCode,
      municipality,
      province,
      parent1Phone,
      parent1Email,
      parent2Phone,
      parent2Email,
      childFirstName,
      childLastName,
      gender,
      parent1FirstName,
      parent1LastName,
      parent2FirstName,
      parent2LastName,
      motivation,
      hasFamilyInGroup,
      familyMemberDetails,
      comesFromOtherGroup,
      originGroupDetails,
      ...enrollmentData
    } = dto;

    const created = await this.prisma.$transaction(async (tx) => {
      const normalizedLastName = childLastName.trim();
      const [firstSurname, ...otherSurnames] = normalizedLastName.split(/\s+/);
      return tx.applicant.create({
        data: {
          childFirstName,
          childLastName: normalizedLastName,
          childLastName1: firstSurname || normalizedLastName,
          childLastName2: otherSurnames.length > 0 ? otherSurnames.join(' ') : null,
          hasNoSecondLastName: otherSurnames.length === 0,
          childBirthDate: new Date(childBirthDate),
          gender,
          streetAddress,
          streetNumber,
          apartmentDoor: ApartmentDoor,
          postalCode,
          municipality,
          province,
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
          status: ApplicationStatus.CENSADO,
          admittedAt: new Date(),
          enrollment: {
            create: {
              ...enrollmentData,
              iban: enrollmentData.iban.replace(/\s+/g, '').toUpperCase(),
              ...(enrollmentData.signatureParent2
                ? { signedAtParent2: new Date() }
                : {}),
            },
          },
        },
        include: { enrollment: true },
      });
    });

    return this.enrichApplicant(created);
  }

  // 4. Obtener un solicitante por ID
  async findOne(id: string): Promise<EnrichedApplicant> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!applicant) {
      throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);
    }
    return this.enrichApplicant(applicant);
  }

  // 5. Actualizar datos o estado desde el panel del Kraal
  async update(id: string, dto: UpdateApplicationDto): Promise<EnrichedApplicant> {
    await this.findOne(id);
    const { childBirthDate, status, ...rest } = dto;

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        ...rest,
        ...(status ? { status } : {}),
        ...(status === ApplicationStatus.CENSADO ? { admittedAt: new Date() } : {}),
        ...(childBirthDate ? { childBirthDate: new Date(childBirthDate) } : {}),
      },
      include: { enrollment: true },
    });

    return this.enrichApplicant(updated);
  }

  async updateCensus(id: string, dto: UpdateCensusDto): Promise<EnrichedApplicant> {
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
      childLastName,
      gender,
      streetAddress,
      streetNumber,
      ApartmentDoor,
      postalCode,
      municipality,
      province,
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
      ...enrollmentData
    } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      const applicant = await tx.applicant.update({
        where: { id },
        data: {
          ...(childFirstName !== undefined ? { childFirstName } : {}),
          ...(childLastName !== undefined ? { childLastName } : {}),
          ...(childBirthDate !== undefined ? { childBirthDate: new Date(childBirthDate) } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(streetAddress !== undefined ? { streetAddress } : {}),
          ...(streetNumber !== undefined ? { streetNumber } : {}),
          ...(ApartmentDoor !== undefined ? { apartmentDoor: ApartmentDoor } : {}),
          ...(postalCode !== undefined ? { postalCode } : {}),
          ...(municipality !== undefined ? { municipality } : {}),
          ...(province !== undefined ? { province } : {}),
          ...(parent1FirstName !== undefined ? { parent1FirstName } : {}),
          ...(parent1LastName !== undefined ? { parent1LastName } : {}),
          ...(parent1Phone !== undefined ? { parent1Phone } : {}),
          ...(parent1Email !== undefined ? { parent1Email } : {}),
          ...(parent2FirstName !== undefined ? { parent2FirstName } : {}),
          ...(parent2LastName !== undefined ? { parent2LastName } : {}),
          ...(parent2Phone !== undefined ? { parent2Phone } : {}),
          ...(parent2Email !== undefined ? { parent2Email } : {}),
          ...(motivation !== undefined ? { motivation } : {}),
          ...(hasFamilyInGroup !== undefined ? { hasFamilyInGroup } : {}),
          ...(familyMemberDetails !== undefined ? { familyMemberDetails } : {}),
          ...(comesFromOtherGroup !== undefined ? { comesFromOtherGroup } : {}),
          ...(originGroupDetails !== undefined ? { originGroupDetails } : {}),
        },
      });

      if (!current.enrollment) {
        throw new BadRequestException('El censado no tiene una inscripción asociada.');
      }

      await tx.enrollmentDetails.update({
        where: { applicantId: id },
        data: {
          ...enrollmentData,
          ...(enrollmentData.iban !== undefined
            ? { iban: enrollmentData.iban.replace(/\s+/g, '').toUpperCase() }
            : {}),
        },
      });

      return tx.applicant.findUniqueOrThrow({
        where: { id: applicant.id },
        include: { enrollment: true },
      });
    });

    return this.enrichApplicant(updated);
  }

  // 6. Ofertar plaza y generar Enlace Mágico (+7 días de validez)
  async offerSpot(id: string, daysValid = 7): Promise<EnrichedApplicant> {
    await this.findOne(id);
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.PLAZA_OFERTADA,
        enrollmentToken: token,
        tokenExpiresAt: expiresAt,
      },
      include: { enrollment: true },
    });

    return this.enrichApplicant(updated);
  }

  // 7. Validar y obtener datos públicos mediante el Token Mágico (Para los padres)
  async findByMagicToken(token: string): Promise<EnrichedApplicant> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { enrollmentToken: token },
      include: { enrollment: true },
    });

    if (!applicant) {
      throw new NotFoundException('El enlace de inscripción no es válido.');
    }

    if (
      applicant.tokenExpiresAt &&
      new Date() > new Date(applicant.tokenExpiresAt) &&
      applicant.status === ApplicationStatus.PLAZA_OFERTADA
    ) {
      throw new BadRequestException(
        'El plazo para rellenar esta inscripción ha expirado. Contacta con el Grupo IV.',
      );
    }

    return this.enrichApplicant(applicant);
  }

  // 8. Guardar la Fase 2 (Hoja de Inscripción, Ficha Médica, SEPA y Firmas)
  async completeMagicEnrollment(
    token: string,
    dto: CompleteEnrollmentDto,
  ): Promise<EnrichedApplicant> {
    const applicant = await this.findByMagicToken(token);

    if (
      dto.custodyType === 'CUSTODIA_CONJUNTA' &&
      !dto.signatureParent2
    ) {
      throw new BadRequestException(
        'En caso de custodia conjunta es obligatoria la firma de ambos progenitores.',
      );
    }

    const {
      streetAddress,
      streetNumber,
      ApartmentDoor,
      postalCode,
      municipality,
      province,
      parent1Phone,
      parent1Email,
      parent2Phone,
      parent2Email,
      ...enrollmentData
    } = dto;

    const cleanIban = enrollmentData.iban.replace(/\s+/g, '').toUpperCase();

    const updated = await this.prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        status: ApplicationStatus.INSCRIPCION_COMPLETADA,
        ...(streetAddress ? { streetAddress } : {}),
        ...(streetNumber !== undefined ? { streetNumber } : {}),
        ...(ApartmentDoor !== undefined ? { apartmentDoor: ApartmentDoor } : {}),
        ...(postalCode ? { postalCode } : {}),
        ...(municipality ? { municipality } : {}),
        ...(province ? { province } : {}),
        ...(parent1Phone ? { parent1Phone } : {}),
        ...(parent1Email ? { parent1Email } : {}),
        ...(parent2Phone !== undefined ? { parent2Phone } : {}),
        ...(parent2Email !== undefined ? { parent2Email } : {}),
        enrollment: {
          upsert: {
            create: {
              ...enrollmentData,
              iban: cleanIban,
              ...(enrollmentData.signatureParent2
                ? { signedAtParent2: new Date() }
                : {}),
            },
            update: {
              ...enrollmentData,
              iban: cleanIban,
              ...(enrollmentData.signatureParent2
                ? { signedAtParent2: new Date() }
                : {}),
            },
          },
        },
      },
      include: { enrollment: true },
    });

    return this.enrichApplicant(updated);
  }

  // 9. Eliminar solicitud
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.applicant.delete({
      where: { id },
    });
  }
}
