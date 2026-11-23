import {
  ApplicationStatus,
  CircularPreference,
  CustodyType,
  Gender,
  LegalStatus,
} from '@prisma/client';
import { AuroraContactMapper } from './aurora-contact.mapper';
import { SensitiveDataService } from './sensitive-data.service';

describe('SensitiveDataService y AuroraContactMapper', () => {
  describe('SensitiveDataService', () => {
    const cryptoService = new SensitiveDataService();

    it('cifra y descifra datos sensibles con AES-256-GCM y prefijo enc:v1:', () => {
      const original = 'ES1234567890123456789012';
      const encrypted = cryptoService.encrypt(original);

      expect(encrypted).not.toBeNull();
      expect(encrypted).not.toBe(original);
      expect(encrypted?.startsWith('enc:v1:')).toBe(true);
      expect(cryptoService.decrypt(encrypted)).toBe(original);
    });

    it('mantiene compatibilidad al leer valores heredados en texto plano sin prefijo', () => {
      expect(cryptoService.decrypt('12345678Z')).toBe('12345678Z');
    });

    it('genera hash determinista para DNI normalizado y devuelve null si está vacío', () => {
      expect(cryptoService.hashDni(null)).toBeNull();
      expect(cryptoService.hashDni('   ')).toBeNull();
      expect(cryptoService.hashDni('12345678z')).toBe(cryptoService.hashDni(' 12345678Z '));
    });

    it('enmascara IBAN conservando solo los 4 últimos dígitos', () => {
      const last4 = cryptoService.extractIbanLast4('ES12 3456 7890 1234 5678 9012');
      expect(last4).toBe('9012');
      expect(cryptoService.maskIban(last4)).toBe('ES** **** **** **** **** 9012');
    });
  });

  describe('AuroraContactMapper', () => {
    const mapper = new AuroraContactMapper();
    const baseCensado = {
      id: 'app-census-1',
      createdAt: new Date('2026-09-10T10:00:00.000Z'),
      updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      status: ApplicationStatus.CENSADO,
      childFirstName: 'Lucía',
      childLastName1: 'García',
      childLastName2: 'Pérez',
      hasNoSecondLastName: false,
      noSecondLastNameJustification: null,
      childLastName: 'García Pérez',
      childBirthDate: new Date('2017-12-23T00:00:00.000Z'), // 9 años en ronda 2026/2027 -> Lobatos
      gender: Gender.FEMENINO,
      streetAddress: 'Avda. de los Scouters',
      streetNumber: '14',
      apartmentDoor: '3º B',
      postalCode: '41089',
      municipality: 'Dos Hermanas',
      province: 'Sevilla',
      familyUnitId: 'fam-1',
      parent1FirstName: 'María',
      parent1LastName: 'Pérez Gómez',
      parent1Phone: '611223344',
      parent1Email: 'maria@ejemplo.es',
      parent1Relationship: 'Madre',
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
      kraalInternalNotes: 'Nota privada',
      enrollmentToken: null,
      enrollmentTokenHash: null,
      tokenExpiresAt: null,
      tokenUsedAt: null,
      reviewedAt: new Date('2026-10-01T12:00:00.000Z'),
      reviewedById: 'user-1',
      admittedAt: new Date('2026-10-02T09:30:00.000Z'),
      admittedById: 'user-1',
      censusSolarRound: '2026/2027',
      censusBranch: 'Lobatos',
      closedAt: null,
      closedById: null,
      closureReason: null,
      closureNotes: null,
      previousStatus: null,
      idempotencyKey: null,
      enrollment: {
        id: 'enr-1',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
        applicantId: 'app-census-1',
        childDni: null,
        childDniHash: null,
        childPhone: null,
        childEmail: null,
        legalStatus: LegalStatus.MENOR,
        circularPreference: CircularPreference.EMAIL,
        parent1Dni: '12345678Z',
        parent2Dni: null,
        parentsMaritalStatus: 'Soltera',
        custodyType: CustodyType.SIN_ESPECIFICAR,
        acceptsDataStorage: true,
        acceptsDataTransfer: true,
        authorizesImages: false,
        consentTextVersion: '2026.1',
        bloodType: 'O+',
        chronicDiseases: null,
        allergies: 'Frutos secos',
        medHeadache: null,
        medFever: null,
        medStomach: null,
        medThroat: null,
        medicalObservations: null,
        emergencyContactName: 'María Pérez Gómez',
        emergencyContactPhone: '611223344',
        emergencyContactRelationship: 'Madre',
        authorizesEmergency: true,
        accountHolderName: 'María Pérez Gómez',
        accountHolderDni: '12345678Z',
        accountHolderAddress: null,
        accountHolderMunicipality: null,
        accountHolderPostalCode: null,
        iban: 'ES1234567890123456789012',
        ibanLast4: '9012',
        authorizesSepa: true,
        sepaSignedAt: new Date('2026-10-01T10:00:00.000Z'),
        signer1FullName: 'María Pérez Gómez',
        signer1Dni: '12345678Z',
        signatureParent1: 'sig1',
        signedAtParent1: new Date('2026-10-01T10:00:00.000Z'),
        signer2FullName: null,
        signer2Dni: null,
        signatureParent2: null,
        signedAtParent2: null,
      },
    };

    it('mapea un censado al formato Aurora usando admittedAt como startAt y permitiendo tin null', () => {
      const payload = mapper.toCreateContactPayload(baseCensado, {
        organizationalEntityIds: ['org-grupo-iv'],
      });

      expect(payload.startAt).toBe('2026-10-02');
      expect(payload.name).toBe('Lucía');
      expect(payload.surname1).toBe('García');
      expect(payload.surname2).toBe('Pérez');
      expect(payload.tin).toBeNull();
      expect(payload.genre).toBe('FEMALE');
      expect(payload.birthDate).toBe('2017-12-23');
      expect(payload.branch).toBe('LOBATOS');
      expect(payload.address1).toBe('Avda. de los Scouters, 14');
      expect(payload.address2).toBe('3º B');
      expect(payload.hasDataAgreement).toBe(true);
      expect(payload.hasPhotoAgreement).toBe(false);
      expect(payload.username).toBeUndefined();
      expect(payload.password).toBeUndefined();
    });

    it('genera credenciales efímeras únicamente cuando se solicitan explícitamente', () => {
      const payload = mapper.toCreateContactPayload(
        baseCensado,
        {},
        { includeEphemeralCredentials: true },
      );

      expect(payload.username).toMatch(/^g4_/);
      expect(payload.password).toBeDefined();
      expect((payload.password || '').length).toBeGreaterThanOrEqual(20);
    });

    it('rechaza mapear expedientes no censados o sin fecha efectiva de alta', () => {
      expect(() =>
        mapper.toCreateContactPayload({
          ...baseCensado,
          status: ApplicationStatus.INSCRIPCION_COMPLETADA,
          admittedAt: null,
        }),
      ).toThrow();
    });
  });
});
