import { ApplicationStatus, Gender, LegalStatus, CircularPreference, CustodyType } from '@prisma/client';
import { ApplicationsService, normalizeSearchText } from './applications.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { QueryApplicationsDto } from './dto/query-applications.dto';

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

    it('marca un registro en LISTA_ESPERA o CENSADO sin ficha de inscripción completa como incompleto', () => {
      const waitlistWithoutEnrollment = makeBaseApplicant({
        status: ApplicationStatus.LISTA_ESPERA,
        enrollment: null,
      });

      const result = service.evaluateCompleteness(waitlistWithoutEnrollment);
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
