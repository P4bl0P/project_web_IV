import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  ClosureReason,
  Gender,
  LegalStatus,
  CircularPreference,
  CustodyType,
} from '@prisma/client';
import { ApplicationsService, normalizeSearchText } from './applications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { QueryApplicationsDto } from './dto/query-applications.dto';
import type { CreateApplicationDto } from './dto/create-application.dto';
import type { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { SensitiveDataService } from './sensitive-data.service';

function makeBaseApplicant(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-10-15T10:00:00.000Z');
  return {
    id: 'app-1',
    createdAt: now,
    updatedAt: now,
    status: ApplicationStatus.PENDIENTE_REVISION,
    childFirstName: 'Lucía',
    childLastName: 'García Pérez',
    childLastName1: 'García',
    childLastName2: 'Pérez',
    hasNoSecondLastName: false,
    noSecondLastNameJustification: null,
    childBirthDate: new Date('2015-05-10T00:00:00.000Z'),
    gender: Gender.FEMENINO,
    streetAddress: 'Calle Real 12',
    streetNumber: '12',
    apartmentDoor: '2B',
    postalCode: '41089',
    municipality: 'Dos Hermanas',
    province: 'Sevilla',
    familyUnitId: null,
    parent1FirstName: 'María',
    parent1LastName: 'Pérez Gómez',
    parent1Phone: '611223344',
    parent1Email: 'maria.perez@correo.es',
    parent1Relationship: null,
    parent2FirstName: 'Antonio',
    parent2LastName: 'García López',
    parent2Phone: '699887766',
    parent2Email: 'antonio.garcia@correo.es',
    parent2Relationship: null,
    motivation: 'Nos encanta el escultismo',
    hasFamilyInGroup: false,
    familyMemberDetails: null,
    comesFromOtherGroup: false,
    originGroupDetails: null,
    socialInclusionPriority: false,
    kraalInternalNotes: null,
    enrollmentToken: null,
    enrollmentTokenHash: null,
    tokenExpiresAt: null,
    tokenUsedAt: null,
    reviewedAt: null,
    reviewedById: null,
    admittedAt: null,
    admittedById: null,
    censusSolarRound: null,
    censusBranch: null,
    closedAt: null,
    closedById: null,
    closureReason: null,
    closureNotes: null,
    previousStatus: null,
    idempotencyKey: null,
    enrollment: null,
    ...overrides,
  };
}

function makeCompleteEnrollment(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-10-20T10:00:00.000Z');
  return {
    id: 'enr-1',
    createdAt: now,
    updatedAt: now,
    applicantId: 'app-1',
    childDni: null,
    childDniHash: null,
    childPhone: null,
    childEmail: null,
    legalStatus: LegalStatus.MENOR,
    circularPreference: CircularPreference.EMAIL,
    parent1Dni: '12345678Z',
    parent2Dni: null,
    parentsMaritalStatus: 'Casados',
    custodyType: CustodyType.SIN_ESPECIFICAR,
    acceptsDataStorage: true,
    acceptsDataTransfer: true,
    authorizesImages: true,
    consentTextVersion: '2026.1',
    bloodType: 'A+',
    chronicDiseases: 'Ninguna',
    allergies: 'Ninguna',
    medHeadache: null,
    medFever: null,
    medStomach: null,
    medThroat: null,
    medicalObservations: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    authorizesEmergency: true,
    accountHolderName: 'María Pérez Gómez',
    accountHolderDni: '12345678Z',
    accountHolderAddress: null,
    accountHolderMunicipality: null,
    accountHolderPostalCode: null,
    iban: 'ES1234567890123456789012',
    ibanLast4: '9012',
    authorizesSepa: true,
    sepaSignedAt: now,
    signer1FullName: 'María Pérez Gómez',
    signer1Dni: '12345678Z',
    signatureParent1: 'data:image/png;base64,AAA',
    signedAtParent1: now,
    signer2FullName: null,
    signer2Dni: null,
    signatureParent2: null,
    signedAtParent2: null,
    ...overrides,
  };
}

describe('ApplicationsService - Buscador inteligente, filtros y ordenación en Secretaría', () => {
  let service: ApplicationsService;
  let mockFindMany: jest.Mock;

  beforeEach(() => {
    mockFindMany = jest.fn();
    const mockPrisma = {
      applicant: {
        findMany: mockFindMany,
      },
    } as unknown as PrismaService;
    service = new ApplicationsService(mockPrisma);
  });

  describe('normalizeSearchText', () => {
    it('elimina tildes, convierte a minúsculas y normaliza espacios', () => {
      expect(normalizeSearchText('  Lucía   GÓMEZ  Pérez ')).toBe('lucia gomez perez');
    });
  });

  describe('Evaluación de datos incompletos por tipo de registro', () => {
    it('NO marca una solicitud inicial (PENDIENTE_REVISION) como incompleta por carecer de inscripción (Fase 2)', () => {
      const initialApplicant = makeBaseApplicant({
        status: ApplicationStatus.PENDIENTE_REVISION,
        enrollment: null,
      });

      const result = service.evaluateCompleteness(initialApplicant);
      expect(result.isIncomplete).toBe(false);
      expect(result.missingFields).toEqual([]);
    });

    it('marca una solicitud inicial como incompleta si le falta un campo obligatorio de la Fase 1', () => {
      const invalidInitial = makeBaseApplicant({
        status: ApplicationStatus.PENDIENTE_REVISION,
        parent1Phone: '123', // teléfono inválido
        hasFamilyInGroup: true,
        familyMemberDetails: '', // obligatorio cuando hasFamilyInGroup es true
      });

      const result = service.evaluateCompleteness(invalidInitial);
      expect(result.isIncomplete).toBe(true);
      expect(result.missingFields).toContain('Teléfono del tutor 1');
      expect(result.missingFields).toContain('Detalles del familiar en el grupo');
    });

    it('NO marca una solicitud en LISTA_ESPERA sin ficha de inscripción (Fase 2) como incompleta si su Fase 1 es válida', () => {
      const waitlistApplicant = makeBaseApplicant({
        status: ApplicationStatus.LISTA_ESPERA,
        streetAddress: null,
        postalCode: null,
        municipality: null,
        province: null,
        gender: null,
        enrollment: null,
      });

      const result = service.evaluateCompleteness(waitlistApplicant);
      expect(result.isIncomplete).toBe(false);
      expect(result.missingFields).toEqual([]);
    });

    it('marca una inscripción completada o registro CENSADO sin ficha de inscripción como incompleto', () => {
      const censusWithoutEnrollment = makeBaseApplicant({
        status: ApplicationStatus.CENSADO,
        enrollment: null,
      });

      const result = service.evaluateCompleteness(censusWithoutEnrollment);
      expect(result.isIncomplete).toBe(true);
      expect(result.missingFields).toContain('Ficha de inscripción completa');
    });

    it('marca un registro CENSADO con inscripción completa y fecha de alta como completo', () => {
      const completeCensus = makeBaseApplicant({
        status: ApplicationStatus.CENSADO,
        admittedAt: new Date('2026-10-25T10:00:00.000Z'),
        enrollment: makeCompleteEnrollment(),
      });

      const result = service.evaluateCompleteness(completeCensus);
      expect(result.isIncomplete).toBe(false);
      expect(result.missingFields).toEqual([]);
    });

    it('exige DNI y firma del segundo tutor cuando hay CUSTODIA_CONJUNTA en inscripción/censo', () => {
      const jointCustodyIncomplete = makeBaseApplicant({
        status: ApplicationStatus.CENSADO,
        admittedAt: new Date('2026-10-25T10:00:00.000Z'),
        enrollment: makeCompleteEnrollment({
          custodyType: CustodyType.CUSTODIA_CONJUNTA,
          parent2Dni: null,
          signatureParent2: null,
        }),
      });

      const result = service.evaluateCompleteness(jointCustodyIncomplete);
      expect(result.isIncomplete).toBe(true);
      expect(result.missingFields).toContain('DNI del tutor 2 (custodia conjunta)');
      expect(result.missingFields).toContain('Firma del tutor 2 (custodia conjunta)');
    });
  });

  describe('Buscador inteligente, filtros combinados, ordenación y paginación', () => {
    const sampleRecords = [
      makeBaseApplicant({
        id: '1',
        status: ApplicationStatus.CENSADO,
        childFirstName: 'Álvaro',
        childLastName: 'Martínez Ruiz',
        childBirthDate: new Date('2018-04-12T00:00:00.000Z'), // Castores
        gender: Gender.MASCULINO,
        parent1FirstName: 'Carlos',
        parent1LastName: 'Martínez Soto',
        parent1Phone: '600111222',
        parent1Email: 'carlos.martinez@example.com',
        admittedAt: new Date('2026-09-10T10:00:00.000Z'),
        enrollment: makeCompleteEnrollment({ applicantId: '1' }),
      }),
      makeBaseApplicant({
        id: '2',
        status: ApplicationStatus.CENSADO,
        childFirstName: 'Lucía',
        childLastName: 'Gómez Fernández',
        childBirthDate: new Date('2014-06-20T00:00:00.000Z'), // Rangers
        gender: Gender.FEMENINO,
        parent1FirstName: 'Elena',
        parent1LastName: 'Fernández Díaz',
        parent1Phone: '655444333',
        parent1Email: 'elena.fdz@example.com',
        admittedAt: new Date('2026-10-05T10:00:00.000Z'),
        enrollment: makeCompleteEnrollment({
          applicantId: '2',
          iban: 'INVALID', // Incompleto en censo
        }),
      }),
      makeBaseApplicant({
        id: '3',
        status: ApplicationStatus.PENDIENTE_REVISION,
        childFirstName: 'Mateo',
        childLastName: 'Sánchez Ortega',
        childBirthDate: new Date('2016-02-15T00:00:00.000Z'), // Lobatos
        gender: Gender.MASCULINO,
        parent1FirstName: 'Laura',
        parent1LastName: 'Ortega Gil',
        parent1Phone: '677888999',
        parent1Email: 'laura.ortega@example.com',
        enrollment: null, // Solicitud inicial sin Fase 2 (completa para su fase)
      }),
    ];

    beforeEach(() => {
      mockFindMany.mockResolvedValue(sampleRecords);
    });

    it('encuentra coincidencias ignorando tildes, mayúsculas y con nombre/apellidos en distinto orden', async () => {
      const results1 = await service.findAll({ search: 'ruiz alvaro' } as QueryApplicationsDto);
      expect(results1.map((r) => r.id)).toEqual(['1']);

      const results2 = await service.findAll({ search: 'FERNANDEZelena' } as QueryApplicationsDto);
      expect(results2).toHaveLength(0);

      const resultsTutorReversed = await service.findAll({
        search: 'diaz elena',
      } as QueryApplicationsDto);
      expect(resultsTutorReversed.map((r) => r.id)).toEqual(['2']);

      const resultsPhoneFragment = await service.findAll({
        search: '444 333',
      } as QueryApplicationsDto);
      expect(resultsPhoneFragment.map((r) => r.id)).toEqual(['2']);
    });

    it('permite combinar múltiples filtros avanzados simultáneamente', async () => {
      const results = await service.findAll({
        status: ApplicationStatus.CENSADO,
        gender: Gender.FEMENINO,
        tutorName: 'Fernandez Elena',
        incompleteOnly: 'true',
      } as QueryApplicationsDto);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('ordena correctamente por nombre, apellidos, edad y fecha de alta en el censo', async () => {
      const byFirstNameAsc = await service.findAll({
        sortBy: 'childFirstName',
        sortOrder: 'asc',
      } as QueryApplicationsDto);
      expect(byFirstNameAsc.map((r) => r.childFirstName)).toEqual(['Álvaro', 'Lucía', 'Mateo']);

      const byFirstNameDesc = await service.findAll({
        sortBy: 'childFirstName',
        sortOrder: 'desc',
      } as QueryApplicationsDto);
      expect(byFirstNameDesc.map((r) => r.childFirstName)).toEqual(['Mateo', 'Lucía', 'Álvaro']);

      const byAgeDesc = await service.findAll({
        sortBy: 'age',
        sortOrder: 'desc',
      } as QueryApplicationsDto);
      // Lucía (2014) -> Mateo (2016) -> Álvaro (2018)
      expect(byAgeDesc.map((r) => r.id)).toEqual(['2', '3', '1']);
    });

    it('aplica la paginación después de filtrar y ordenar el conjunto completo', async () => {
      const page1 = await service.findAll({
        sortBy: 'childFirstName',
        sortOrder: 'asc',
        page: 1,
        pageSize: 2,
      } as QueryApplicationsDto);
      const page2 = await service.findAll({
        sortBy: 'childFirstName',
        sortOrder: 'asc',
        page: 2,
        pageSize: 2,
      } as QueryApplicationsDto);

      expect(page1.map((r) => r.childFirstName)).toEqual(['Álvaro', 'Lucía']);
      expect(page2.map((r) => r.childFirstName)).toEqual(['Mateo']);
    });
  });
});

function makeCompleteMagicDto(overrides: Partial<CompleteEnrollmentDto> = {}): CompleteEnrollmentDto {
  return {
    gender: Gender.FEMENINO,
    streetAddress: 'Avda. Madre Paula Montalt',
    streetNumber: '12',
    apartmentDoor: '2B',
    postalCode: '41089',
    municipality: 'Dos Hermanas',
    province: 'Sevilla',
    parent1Relationship: 'Madre',
    parent1Dni: '12345678Z',
    legalStatus: LegalStatus.MENOR,
    circularPreference: CircularPreference.EMAIL,
    custodyType: CustodyType.SIN_ESPECIFICAR,
    acceptsDataStorage: true,
    acceptsDataTransfer: true,
    authorizesImages: true,
    bloodType: 'O+',
    chronicDiseases: 'Asma leve',
    allergies: 'Polen',
    emergencyContactName: 'Abuela Carmen',
    emergencyContactPhone: '622334455',
    emergencyContactRelationship: 'Abuela',
    authorizesEmergency: true,
    accountHolderName: 'Pedro Pagador Gómez',
    accountHolderDni: '87654321X',
    accountHolderAddress: 'Calle Otra 5',
    accountHolderMunicipality: 'Sevilla',
    accountHolderPostalCode: '41001',
    iban: 'ES1234567890123456789012',
    authorizesSepa: true,
    signatureParent1: 'data:image/png;base64,SIG1',
    ...overrides,
  };
}

describe('ApplicationsService - Reglas de negocio, ciclo de vida, seguridad, cifrado y paginación', () => {
  let service: ApplicationsService;
  let applicantsStore: Array<Record<string, any>>;
  let enrollmentsStore: Array<Record<string, any>>;
  let auditEventsStore: Array<Record<string, any>>;
  let mockPrisma: Record<string, any>;
  const cryptoHelper = new SensitiveDataService();

  beforeEach(() => {
    applicantsStore = [];
    enrollmentsStore = [];
    auditEventsStore = [];

    const matchesWhere = (record: Record<string, any>, where: Record<string, any> = {}): boolean => {
      for (const [key, cond] of Object.entries(where)) {
        if (cond === undefined) continue;
        if (key === 'OR' && Array.isArray(cond)) {
          if (!cond.some((sub) => matchesWhere(record, sub))) return false;
          continue;
        }
        if (key === 'id' && typeof cond === 'object' && cond !== null && 'not' in cond) {
          if (record.id === cond.not) return false;
          continue;
        }
        if (key === 'applicantId' && typeof cond === 'object' && cond !== null && 'not' in cond) {
          if (record.applicantId === cond.not) return false;
          continue;
        }
        if (key === 'status' && typeof cond === 'object' && cond !== null) {
          if ('in' in cond && !cond.in.includes(record.status)) return false;
          if ('not' in cond && record.status === cond.not) return false;
          continue;
        }
        if (key === 'createdAt' && typeof cond === 'object' && cond !== null && 'gte' in cond) {
          if (new Date(record.createdAt) < new Date(cond.gte)) return false;
          continue;
        }
        if (key === 'tokenExpiresAt' && typeof cond === 'object' && cond !== null && 'gt' in cond) {
          if (!record.tokenExpiresAt || new Date(record.tokenExpiresAt) <= new Date(cond.gt)) {
            return false;
          }
          continue;
        }
        if (record[key] !== cond) return false;
      }
      return true;
    };

    const attachEnrollment = (app: Record<string, any>, include?: Record<string, any>) => {
      if (!include?.enrollment) return { ...app };
      const enr = enrollmentsStore.find((e) => e.applicantId === app.id) ?? null;
      return { ...app, enrollment: enr ? { ...enr } : null };
    };

    const applicantRepo = {
      create: jest.fn(async ({ data, include }: any) => {
        const id = data.id ?? `app-${applicantsStore.length + 1}`;
        const now = new Date();
        const created: Record<string, any> = {
          id,
          createdAt: now,
          updatedAt: now,
          status: data.status ?? ApplicationStatus.PENDIENTE_REVISION,
          gender: null,
          streetAddress: null,
          streetNumber: null,
          apartmentDoor: null,
          postalCode: null,
          municipality: null,
          province: null,
          familyUnitId: null,
          parent1Relationship: null,
          parent2FirstName: null,
          parent2LastName: null,
          parent2Phone: null,
          parent2Email: null,
          parent2Relationship: null,
          motivation: null,
          hasFamilyInGroup: false,
          familyMemberDetails: null,
          comesFromOtherGroup: false,
          originGroupDetails: null,
          socialInclusionPriority: false,
          kraalInternalNotes: null,
          enrollmentToken: null,
          enrollmentTokenHash: null,
          tokenExpiresAt: null,
          tokenUsedAt: null,
          reviewedAt: null,
          reviewedById: null,
          admittedAt: null,
          admittedById: null,
          censusSolarRound: null,
          censusBranch: null,
          closedAt: null,
          closedById: null,
          closureReason: null,
          closureNotes: null,
          previousStatus: null,
          idempotencyKey: null,
          ...data,
        };
        delete created.enrollment;
        applicantsStore.push(created);

        if (data.enrollment?.create) {
          enrollmentsStore.push({
            id: `enr-${enrollmentsStore.length + 1}`,
            createdAt: now,
            updatedAt: now,
            applicantId: id,
            ...data.enrollment.create,
          });
        }
        return attachEnrollment(created, include);
      }),
      findMany: jest.fn(async ({ where, include }: any = {}) => {
        return applicantsStore
          .filter((r) => matchesWhere(r, where))
          .map((r) => attachEnrollment(r, include));
      }),
      findFirst: jest.fn(async ({ where, include }: any = {}) => {
        const found = applicantsStore.find((r) => matchesWhere(r, where));
        return found ? attachEnrollment(found, include) : null;
      }),
      findUnique: jest.fn(async ({ where, include }: any = {}) => {
        const found = applicantsStore.find((r) => matchesWhere(r, where));
        return found ? attachEnrollment(found, include) : null;
      }),
      findUniqueOrThrow: jest.fn(async ({ where, include }: any) => {
        const found = applicantsStore.find((r) => matchesWhere(r, where));
        if (!found) throw new Error('Not found');
        return attachEnrollment(found, include);
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const idx = applicantsStore.findIndex((r) => matchesWhere(r, where));
        if (idx === -1) throw new Error('Not found');
        applicantsStore[idx] = {
          ...applicantsStore[idx],
          ...data,
          updatedAt: new Date(),
        };
        return attachEnrollment(applicantsStore[idx], include);
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        applicantsStore = applicantsStore.map((r) => {
          if (matchesWhere(r, where)) {
            count++;
            return { ...r, ...data, updatedAt: new Date() };
          }
          return r;
        });
        return { count };
      }),
      delete: jest.fn(async ({ where }: any) => {
        const idx = applicantsStore.findIndex((r) => matchesWhere(r, where));
        if (idx === -1) throw new Error('Not found');
        const [removed] = applicantsStore.splice(idx, 1);
        enrollmentsStore = enrollmentsStore.filter((e) => e.applicantId !== removed.id);
        return removed;
      }),
    };

    const enrollmentRepo = {
      findFirst: jest.fn(async ({ where }: any) => {
        return enrollmentsStore.find((e) => matchesWhere(e, where)) ?? null;
      }),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const idx = enrollmentsStore.findIndex((e) => e.applicantId === where.applicantId);
        const now = new Date();
        if (idx >= 0) {
          enrollmentsStore[idx] = { ...enrollmentsStore[idx], ...update, updatedAt: now };
          return enrollmentsStore[idx];
        }
        const created = {
          id: `enr-${enrollmentsStore.length + 1}`,
          createdAt: now,
          updatedAt: now,
          ...create,
        };
        enrollmentsStore.push(created);
        return created;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = enrollmentsStore.findIndex((e) => e.applicantId === where.applicantId);
        if (idx === -1) throw new Error('Enrollment not found');
        enrollmentsStore[idx] = { ...enrollmentsStore[idx], ...data, updatedAt: new Date() };
        return enrollmentsStore[idx];
      }),
    };

    const auditRepo = {
      create: jest.fn(async ({ data }: any) => {
        const ev = { id: `audit-${auditEventsStore.length + 1}`, createdAt: new Date(), ...data };
        auditEventsStore.push(ev);
        return ev;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        const prefix = where?.resource?.startsWith;
        return auditEventsStore
          .filter((e) => !prefix || (e.resource && e.resource.startsWith(prefix)))
          .reverse();
      }),
    };

    mockPrisma = {
      applicant: applicantRepo,
      enrollmentDetails: enrollmentRepo,
      auditEvent: auditRepo,
      $transaction: jest.fn(async (fn: (tx: any) => Promise<any>) => fn(mockPrisma)),
    };

    service = new ApplicationsService(mockPrisma as unknown as PrismaService);
  });

  describe('Solicitudes de plaza (Fase 1)', () => {
    const makeValidSolicitud = (
      overrides: Partial<CreateApplicationDto> = {},
    ): CreateApplicationDto =>
      ({
        childFirstName: 'Sofía',
        childLastName1: 'Navarro',
        childLastName2: 'Ruiz',
        childBirthDate: '2017-11-15',
        parent1FirstName: 'Carmen',
        parent1LastName: 'Ruiz López',
        parent1Phone: '611223344',
        parent1Email: 'carmen.ruiz@example.com',
        motivation: 'Nos gustaría mucho que creciera en valores scouts.',
        hasFamilyInGroup: false,
        comesFromOtherGroup: false,
        ...overrides,
      }) as CreateApplicationDto;

    it('crea solicitud completa de Fase 1 sin pedir dirección, DNI ni género, y sin defaults artificiales', async () => {
      const created = await service.create(makeValidSolicitud(), {
        actorId: null,
        ipAddress: '10.0.0.1',
      });

      expect(created.status).toBe(ApplicationStatus.PENDIENTE_REVISION);
      expect(created.gender).toBeNull();
      expect(created.streetAddress).toBeNull();
      expect(created.postalCode).toBeNull();
      expect(created.municipality).toBeNull();
      expect(created.province).toBeNull();
      expect(created.childLastName1).toBe('Navarro');
      expect(created.childLastName2).toBe('Ruiz');
      expect(created.isIncomplete).toBe(false);
      expect(auditEventsStore.some((e) => e.action === 'APPLICATION_CREATED')).toBe(true);
    });

    it('exige segundo apellido por norma general y permite excepción explícita y justificada', async () => {
      await expect(
        service.create(
          makeValidSolicitud({
            childLastName2: undefined,
            hasNoSecondLastName: false,
          }),
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(
          makeValidSolicitud({
            childLastName2: undefined,
            hasNoSecondLastName: true,
            noSecondLastNameJustification: 'abc', // demasiado corta
          }),
        ),
      ).rejects.toThrow(BadRequestException);

      const exceptionAllowed = await service.create(
        makeValidSolicitud({
          childLastName2: undefined,
          hasNoSecondLastName: true,
          noSecondLastNameJustification: 'Documento oficial británico con único apellido',
        }),
      );
      expect(exceptionAllowed.hasNoSecondLastName).toBe(true);
      expect(exceptionAllowed.childLastName2).toBeNull();
      expect(exceptionAllowed.childLastName).toBe('Navarro');
    });

    it('permite segundo tutor opcional, agrupa hermanos por unidad familiar y detecta posibles duplicados sin bloquear casos legítimos', async () => {
      const sibling1 = await service.create(
        makeValidSolicitud({
          idempotencyKey: 'idem-1',
        }),
      );
      const sibling2 = await service.create(
        makeValidSolicitud({
          childFirstName: 'Mateo',
          childBirthDate: '2015-03-10',
          parent2FirstName: 'Jorge',
          parent2LastName: 'Navarro Soto',
          parent2Phone: '699112233',
          parent2Email: 'jorge@example.com',
          idempotencyKey: 'idem-2',
        }),
      );

      expect(sibling2.familyUnitId).toBe(sibling1.familyUnitId);
      expect(sibling2.parent2FirstName).toBe('Jorge');

      // Reintento con misma idempotencyKey no duplica
      const retry = await service.create(
        makeValidSolicitud({
          idempotencyKey: 'idem-1',
        }),
      );
      expect(retry.id).toBe(sibling1.id);
      expect(applicantsStore).toHaveLength(2);

      // Otra solicitud con mismo nombre y nacimiento (ej. reenvío posterior) se marca como posible duplicado
      const possibleDup = await service.create(
        makeValidSolicitud({
          parent1Phone: '677889900',
          parent1Email: 'otro@example.com',
          idempotencyKey: 'idem-3',
        }),
      );
      const list = await service.findAll();
      const dupRecord = list.find((item) => item.id === possibleDup.id);
      expect(dupRecord?.potentialDuplicateIds).toContain(sibling1.id);
    });

    it('rechaza solicitudes en edades de Rutas (18-20) o menores de 6 años sin asignarlas a Pioneros', async () => {
      const roundStart = service.calculateScoutBranch(new Date('2017-12-23')).solarRoundLabel;
      const startYear = Number(roundStart.split('/')[0]);

      // 19 años en la ronda actual -> Rutas (fuera de grupo)
      await expect(
        service.create(
          makeValidSolicitud({
            childBirthDate: `${startYear + 1 - 19}-05-10`,
          }),
        ),
      ).rejects.toThrow(BadRequestException);

      // 5 años en la ronda actual -> Menor de 6 años
      await expect(
        service.create(
          makeValidSolicitud({
            childBirthDate: `${startYear + 1 - 5}-05-10`,
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Máquina de estados, enlaces mágicos de un solo uso y seguridad', () => {
    let appId: string;
    let rawMagicToken: string;

    beforeEach(async () => {
      const created = await service.create({
        childFirstName: 'Lucas',
        childLastName1: 'Morales',
        childLastName2: 'Vega',
        childBirthDate: '2016-06-12',
        parent1FirstName: 'Ana',
        parent1LastName: 'Vega Díaz',
        parent1Phone: '600112233',
        parent1Email: 'ana@example.com',
        kraalInternalNotes: undefined,
      } as CreateApplicationDto);
      appId = created.id;
      applicantsStore[0].kraalInternalNotes = 'Nota confidencial del Kraal';

      await service.validateApplication(appId, { actorId: 'sec-1', ipAddress: '127.0.0.1' });
      const offered = await service.offerSpot(appId, { daysValid: 7 }, { actorId: 'sec-1' });
      rawMagicToken = offered.enrollmentToken!;
    });

    it('impide modificar el estado libremente desde update o censar sin inscripción completa', async () => {
      await expect(
        service.admitToCensus(appId, { actorId: 'sec-1' }),
      ).rejects.toThrow(BadRequestException);

      // Crear otra solicitud sin completar Fase 2 y comprobar que no se puede censar
      const app2 = await service.create({
        childFirstName: 'Hugo',
        childLastName1: 'Vega',
        childLastName2: 'Soler',
        childBirthDate: '2016-04-01',
        parent1FirstName: 'Luis',
        parent1LastName: 'Vega',
        parent1Phone: '655443322',
        parent1Email: 'luis@example.com',
      });
      await expect(
        service.admitToCensus(app2.id, { actorId: 'sec-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('el GET mágico devuelve solo datos mínimos necesarios (sin notas del Kraal ni datos sensibles)', async () => {
      const magicView = await service.findByMagicToken(rawMagicToken);
      expect(magicView.childFirstName).toBe('Lucas');
      expect(magicView.parent1Email).toBe('ana@example.com');
      expect((magicView as any).kraalInternalNotes).toBeUndefined();
      expect((magicView as any).priorityScore).toBeUndefined();
      expect((magicView as any).enrollment).toBeUndefined();
    });

    it('rechaza token caducado y permite renovarlo invalidando el anterior', async () => {
      applicantsStore[0].tokenExpiresAt = new Date(Date.now() - 60_000);
      await expect(service.findByMagicToken(rawMagicToken)).rejects.toThrow(BadRequestException);

      const renewed = await service.renewMagicLink(appId, { daysValid: 7 }, { actorId: 'sec-1' });
      expect(renewed.enrollmentToken).toBeTruthy();
      expect(renewed.enrollmentToken).not.toBe(rawMagicToken);

      // El token anterior deja de funcionar
      await expect(service.findByMagicToken(rawMagicToken)).rejects.toThrow(NotFoundException);
      // El nuevo token funciona
      const view = await service.findByMagicToken(renewed.enrollmentToken!);
      expect(view.id).toBe(appId);
    });

    it('completa la inscripción una sola vez atómicamente, cifra en reposo, invalida el token e impide reutilización o doble petición concurrente', async () => {
      const result = await service.completeMagicEnrollment(
        rawMagicToken,
        makeCompleteMagicDto({ childDni: '' }),
        { ipAddress: '88.1.2.3' },
      );

      expect(result.status).toBe(ApplicationStatus.INSCRIPCION_COMPLETADA);
      expect(result.enrollmentToken).toBeNull();
      expect(applicantsStore[0].enrollmentToken).toBeNull();
      expect(applicantsStore[0].enrollmentTokenHash).toBeNull();
      expect(applicantsStore[0].tokenUsedAt).toBeInstanceOf(Date);

      // Verificar cifrado AES-256-GCM en base de datos y childDni normalizado a null
      const storedEnr = enrollmentsStore[0];
      expect(storedEnr.childDni).toBeNull();
      expect(storedEnr.childDniHash).toBeNull();
      expect(storedEnr.iban.startsWith('enc:v1:')).toBe(true);
      expect(storedEnr.parent1Dni.startsWith('enc:v1:')).toBe(true);
      expect(storedEnr.allergies.startsWith('enc:v1:')).toBe(true);
      expect(storedEnr.signatureParent1.startsWith('enc:v1:')).toBe(true);
      expect(cryptoHelper.decrypt(storedEnr.iban)).toBe('ES1234567890123456789012');

      // El mismo token ya no puede consultarse ni reenviarse
      await expect(service.findByMagicToken(rawMagicToken)).rejects.toThrow(NotFoundException);
      await expect(
        service.completeMagicEnrollment(rawMagicToken, makeCompleteMagicDto()),
      ).rejects.toThrow(NotFoundException);

      // Doble petición concurrente cuando otro proceso ya consumió el token en updateMany
      const renewed = await service.renewMagicLink(appId, { daysValid: 7 }, { actorId: 'sec-1' });
      const secondToken = renewed.enrollmentToken!;
      const originalUpdateMany = mockPrisma.applicant.updateMany;
      mockPrisma.applicant.updateMany = jest.fn(async () => ({ count: 0 }));

      await expect(
        service.completeMagicEnrollment(secondToken, makeCompleteMagicDto()),
      ).rejects.toThrow(ConflictException);
      mockPrisma.applicant.updateMany = originalUpdateMany;

      // Si tokenUsedAt está marcado o estado no es PLAZA_OFERTADA aunque el hash aún existiera, bloquea con ForbiddenException
      applicantsStore[0].tokenUsedAt = new Date();
      await expect(service.findByMagicToken(secondToken)).rejects.toThrow(ForbiddenException);
    });

    it('exige segundo DNI y segunda firma en custodia conjunta al completar la inscripción y actualiza fechas de firma', async () => {
      await expect(
        service.completeMagicEnrollment(
          rawMagicToken,
          makeCompleteMagicDto({
            custodyType: CustodyType.CUSTODIA_CONJUNTA,
            parent2Dni: undefined,
            signatureParent2: undefined,
          }),
        ),
      ).rejects.toThrow(BadRequestException);

      const completed = await service.completeMagicEnrollment(
        rawMagicToken,
        makeCompleteMagicDto({
          custodyType: CustodyType.CUSTODIA_CONJUNTA,
          parent2Dni: '23456789C',
          signatureParent2: 'data:image/png;base64,SIG2',
          gender: Gender.MASCULINO,
        }),
      );
      expect(completed.gender).toBe(Gender.MASCULINO);
      expect(completed.enrollment?.signedAtParent1).toBeTruthy();
      expect(completed.enrollment?.signedAtParent2).toBeTruthy();
    });

    it('permite múltiples educandos sin DNI, valida unicidad cuando existe y prohíbe usar el DNI de un tutor', async () => {
      // Educando 1 sin DNI -> válido
      await service.completeMagicEnrollment(
        rawMagicToken,
        makeCompleteMagicDto({ childDni: '   ' }),
      );

      // Educando 2 con DNI igual al del tutor -> rechazado
      const app2 = await service.create({
        childFirstName: 'Vera',
        childLastName1: 'Morales',
        childLastName2: 'Vega',
        childBirthDate: '2018-04-10',
        parent1FirstName: 'Ana',
        parent1LastName: 'Vega Díaz',
        parent1Phone: '600112233',
        parent1Email: 'ana@example.com',
      });
      const offer2 = await service.offerSpot(app2.id, { daysValid: 7 });
      await expect(
        service.completeMagicEnrollment(
          offer2.enrollmentToken!,
          makeCompleteMagicDto({ childDni: '12345678Z', parent1Dni: '12345678Z' }),
        ),
      ).rejects.toThrow(BadRequestException);

      // Educando 2 con DNI propio válido -> aceptado
      await service.completeMagicEnrollment(
        offer2.enrollmentToken!,
        makeCompleteMagicDto({ childDni: '11223344B' }),
      );

      // Educando 3 con el MISMO DNI del educando 2 -> rechazado por unicidad
      const app3 = await service.create({
        childFirstName: 'Leo',
        childLastName1: 'Martín',
        childLastName2: 'Gil',
        childBirthDate: '2019-02-05',
        parent1FirstName: 'Rosa',
        parent1LastName: 'Gil',
        parent1Phone: '611998877',
        parent1Email: 'rosa@example.com',
      });
      const offer3 = await service.offerSpot(app3.id, { daysValid: 7 });
      await expect(
        service.completeMagicEnrollment(
          offer3.enrollmentToken!,
          makeCompleteMagicDto({ childDni: '11223344b' }),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('protege datos médicos y bancarios en listados y en findOne según mínimo privilegio, auditando sin exponer secretos', async () => {
      await service.completeMagicEnrollment(rawMagicToken, makeCompleteMagicDto());

      // Listados generales nunca devuelven IBAN completo, firmas en base64 ni campos médicos en bruto
      const list = await service.findAll();
      const summaryEnr = list[0].enrollment as any;
      expect(summaryEnr.iban).toBeUndefined();
      expect(summaryEnr.ibanMasked).toBe('ES** **** **** **** **** 9012');
      expect(summaryEnr.allergies).toBeUndefined();
      expect(summaryEnr.signatureParent1).toBeUndefined();
      expect(summaryEnr.hasSignatureParent1).toBe(true);

      // Usuario lector externo sin permiso médico/bancario: findOne enmascara IBAN y oculta médicos
      const restrictedUser = {
        id: 'u-reader',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: {
          name: 'Kraal Lectura',
          permissions: [
            {
              canAccess: true,
              canRead: true,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              specialPermissions: [],
              module: { key: 'secretaria', name: 'Secretaría' },
            },
          ],
        },
      };
      const restrictedDetail = await service.findOne(appId, {
        actorId: 'u-reader',
        user: restrictedUser,
      });
      expect((restrictedDetail.enrollment as any).medicalAccessRestricted).toBe(true);
      expect((restrictedDetail.enrollment as any).bankAccessRestricted).toBe(true);
      expect((restrictedDetail.enrollment as any).allergies).toBeNull();
      expect((restrictedDetail.enrollment as any).iban).toBe('ES** **** **** **** **** 9012');

      // Incluso un cargo llamado "Secretaría" SIN permisos especiales no accede a datos médicos ni bancarios
      const secretariaNameOnlyUser = {
        id: 'u-sec-no-special',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: {
          name: 'Secretaría',
          permissions: [
            {
              canAccess: true,
              canRead: true,
              canCreate: false,
              canUpdate: true,
              canDelete: false,
              specialPermissions: [],
              module: { key: 'secretaria', name: 'Secretaría' },
            },
          ],
        },
      };
      const noSpecialDetail = await service.findOne(appId, {
        actorId: 'u-sec-no-special',
        user: secretariaNameOnlyUser,
      });
      expect((noSpecialDetail.enrollment as any).medicalAccessRestricted).toBe(true);
      expect((noSpecialDetail.enrollment as any).bankAccessRestricted).toBe(true);

      // Usuario autorizado con permisos especiales explícitos ve la ficha descifrada y se registra auditoría sin exponer valores sensibles
      const secretariaUser = {
        id: 'u-sec',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: {
          name: 'Secretaría',
          permissions: [
            {
              canAccess: true,
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              specialPermissions: ['read_medical_data', 'read_bank_data'],
              module: { key: 'secretaria', name: 'Secretaría' },
            },
          ],
        },
      };
      const fullDetail = await service.findOne(appId, {
        actorId: 'u-sec',
        ipAddress: '10.1.1.1',
        user: secretariaUser,
      });
      expect((fullDetail.enrollment as any).allergies).toBe('Polen');
      expect((fullDetail.enrollment as any).iban).toBe('ES1234567890123456789012');
      expect(auditEventsStore.some((e) => e.action === 'APPLICATION_SENSITIVE_READ')).toBe(true);
      for (const ev of auditEventsStore) {
        expect(ev.resource).not.toContain('ES1234567890123456789012');
        expect(ev.resource).not.toContain('Polen');
        expect(ev.resource).not.toContain('12345678Z');
      }
    });

    it('gestiona revisión, censo con fecha efectiva, baja con motivo estructurado, reactivación y retorno a lista de espera', async () => {
      // Retorno a lista de espera invalida token
      await service.returnToWaitlist(appId, { reason: 'Prefieren esperar al próximo trimestre' }, { actorId: 'sec-1' });
      expect(applicantsStore[0].status).toBe(ApplicationStatus.LISTA_ESPERA);
      await expect(service.findByMagicToken(rawMagicToken)).rejects.toThrow(NotFoundException);

      // Reofertar, completar inscripción, marcar revisada y censar
      const reoffered = await service.offerSpot(appId, { daysValid: 7 }, { actorId: 'sec-1' });
      await service.completeMagicEnrollment(reoffered.enrollmentToken!, makeCompleteMagicDto());
      const reviewed = await service.markEnrollmentReviewed(appId, { actorId: 'sec-1' });
      expect(reviewed.reviewedAt).toBeTruthy();

      const censado = await service.admitToCensus(appId, { actorId: 'sec-1' });
      expect(censado.status).toBe(ApplicationStatus.CENSADO);
      expect(censado.admittedAt).toBeTruthy();
      expect(censado.admittedById).toBe('sec-1');
      expect(censado.censusSolarRound).toBeTruthy();
      expect(censado.censusBranch).toBeTruthy();

      // Prohibido volver de CENSADO a LISTA_ESPERA o editar desde update básico
      await expect(service.returnToWaitlist(appId)).rejects.toThrow(BadRequestException);
      await expect(
        service.update(appId, { childFirstName: 'Otro' }),
      ).rejects.toThrow(BadRequestException);

      // Baja estructurada y reactivación autorizada
      const baja = await service.deactivate(
        appId,
        { closureReason: ClosureReason.BAJA_VOLUNTARIA, closureNotes: 'Cambio de domicilio' },
        { actorId: 'sec-1' },
      );
      expect(baja.status).toBe(ApplicationStatus.BAJA);
      expect(baja.closureReason).toBe(ClosureReason.BAJA_VOLUNTARIA);
      expect(baja.previousStatus).toBe(ApplicationStatus.CENSADO);

      await expect(
        service.update(appId, { kraalInternalNotes: 'Nota en baja' }),
      ).rejects.toThrow(BadRequestException);

      const reactivated = await service.reactivate(
        appId,
        { notes: 'Regresa al grupo' },
        { actorId: 'sec-1' },
      );
      expect(reactivated.status).toBe(ApplicationStatus.CENSADO);
      expect(reactivated.closureReason).toBeNull();

      // Edición unificada en CENSADO actualiza identidad, prioridad de inclusión y notas del Kraal
      const updatedCensus = await service.updateCensus(
        appId,
        {
          childFirstName: 'Sofía Modificada',
          socialInclusionPriority: true,
          kraalInternalNotes: 'Actualización desde expediente de detalle',
        },
        { actorId: 'sec-1' },
      );
      expect(updatedCensus.childFirstName).toBe('Sofía Modificada');
      expect(updatedCensus.socialInclusionPriority).toBe(true);
      expect(updatedCensus.kraalInternalNotes).toBe('Actualización desde expediente de detalle');
    });
  });

  describe('Paginación en servidor y rendimiento con múltiples registros', () => {
    it('filtra, ordena, pagina y calcula contadores exactos por sección en listados grandes', async () => {
      for (let i = 0; i < 120; i++) {
        const status =
          i < 30
            ? ApplicationStatus.PENDIENTE_REVISION
            : i < 65
              ? ApplicationStatus.LISTA_ESPERA
              : i < 85
                ? ApplicationStatus.PLAZA_OFERTADA
                : i < 110
                  ? ApplicationStatus.CENSADO
                  : ApplicationStatus.BAJA;

        applicantsStore.push(
          makeBaseApplicant({
            id: `bulk-${i}`,
            status,
            childFirstName: `Educando ${String(i).padStart(3, '0')}`,
            childLastName1: 'Apellido',
            childLastName2: 'Prueba',
            childLastName: 'Apellido Prueba',
            childBirthDate: new Date('2016-05-10T00:00:00.000Z'),
            admittedAt: status === ApplicationStatus.CENSADO ? new Date('2026-10-01') : null,
            enrollment:
              status === ApplicationStatus.CENSADO
                ? makeCompleteEnrollment({ applicantId: `bulk-${i}` })
                : null,
          }),
        );
      }

      const page1 = await service.findPaginated({
        stage: 'WAITLIST',
        sortBy: 'childFirstName',
        sortOrder: 'asc',
        page: 1,
        pageSize: 10,
      } as QueryApplicationsDto);

      expect(page1.sectionCounts).toEqual({
        INITIAL: 30,
        WAITLIST: 35,
        OFFERED: 20,
        CENSUS: 25,
        ARCHIVED: 10,
      });
      expect(page1.totalMatching).toBe(35);
      expect(page1.totalPages).toBe(4);
      expect(page1.items).toHaveLength(10);

      const page4 = await service.findPaginated({
        stage: 'WAITLIST',
        sortBy: 'childFirstName',
        sortOrder: 'asc',
        page: 4,
        pageSize: 10,
      } as QueryApplicationsDto);

      expect(page4.items).toHaveLength(5);
      expect(page4.items[0].childFirstName).toBe('Educando 060');
    });
  });
});
