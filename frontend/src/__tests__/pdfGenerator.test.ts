import { PDFDocument } from 'pdf-lib';
import type { ApplicantRecord } from '../services/api';
import { PDF_LAYOUT_CONFIG, buildOfficialScoutPdfBytes } from '../utils/pdfGenerator';

const assert = {
  ok(condition: unknown, message: string) {
    if (!condition) {
      throw new Error(message);
    }
  },
  equal<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      throw new Error(message ?? `Expected ${String(actual)} to equal ${String(expected)}`);
    }
  },
  includes(haystack: string, needle: string, message?: string) {
    if (!haystack.includes(needle)) {
      throw new Error(message ?? `Expected string to include "${needle}"`);
    }
  },
  notIncludes(haystack: string, needle: string, message?: string) {
    if (haystack.includes(needle)) {
      throw new Error(message ?? `Expected string NOT to include "${needle}"`);
    }
  },
};

const SAMPLE_PNG_SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function createBaseRecord(overrides: Partial<ApplicantRecord> = {}): ApplicantRecord {
  return {
    id: 'app-test-1',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    status: 'INSCRIPCION_COMPLETADA',
    childFirstName: 'Lucía',
    childLastName1: 'Peña',
    childLastName2: 'Álvarez',
    hasNoSecondLastName: false,
    childLastName: 'Peña Álvarez',
    childBirthDate: '2015-04-12T00:00:00.000Z',
    gender: 'FEMENINO',
    streetAddress: 'Calle Gran Vía',
    streetNumber: '15',
    apartmentDoor: '4º A',
    postalCode: '21003',
    municipality: 'Huelva',
    province: 'Huelva',
    parent1FirstName: 'Elena',
    parent1LastName: 'Álvarez Martín',
    parent1Phone: '600112233',
    parent1Email: 'elena@example.org',
    parent2FirstName: 'Carlos',
    parent2LastName: 'Peña Díaz',
    parent2Phone: '600445566',
    parent2Email: 'carlos@example.org',
    hasFamilyInGroup: false,
    comesFromOtherGroup: false,
    socialInclusionPriority: false,
    calculatedBranch: 'Lobatos',
    currentAge: 11,
    priorityScore: 0,
    enrollment: {
      id: 'enr-test-1',
      applicantId: 'app-test-1',
      createdAt: '2026-11-20T10:00:00.000Z',
      legalStatus: 'MENOR',
      circularPreference: 'EMAIL',
      parent1Dni: '29112233A',
      parent2Dni: '29445566B',
      parentsMaritalStatus: 'Casados',
      custodyType: 'CUSTODIA_CONJUNTA',
      acceptsDataStorage: true,
      acceptsDataTransfer: true,
      authorizesImages: true,
      bloodType: 'A+',
      chronicDiseases: 'Ninguna',
      allergies: 'Polen gramíneas',
      medHeadache: 'Paracetamol 500mg',
      medFever: 'Ibuprofeno 400mg',
      medStomach: 'Suero oral',
      medThroat: 'Miel y limón',
      medicalObservations: 'Sin incidencias reseñables.',
      emergencyContactName: 'Elena Álvarez',
      emergencyContactPhone: '600112233',
      emergencyContactRelationship: 'Madre',
      authorizesEmergency: true,
      accountHolderName: 'Elena Álvarez Martín',
      accountHolderDni: '29112233A',
      accountHolderAddress: 'Calle Gran Vía, 15, 4º A',
      accountHolderMunicipality: 'Huelva',
      accountHolderPostalCode: '21003',
      iban: 'ES91 2100 0418 4502 0005 1332',
      authorizesSepa: true,
      signatureParent1: SAMPLE_PNG_SIGNATURE,
      signedAtParent1: '2026-11-20T10:00:00.000Z',
      signatureParent2: SAMPLE_PNG_SIGNATURE,
      signedAtParent2: '2026-11-20T10:05:00.000Z',
    },
    ...overrides,
  };
}

export async function runPdfGeneratorTests(templateBytes: Uint8Array) {
  const cases: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  const test = (name: string, fn: () => Promise<void> | void) => {
    cases.push({ name, fn });
  };

  test('PDF_LAYOUT_CONFIG define las 3 páginas dentro de los límites A4 (595.2 x 841.92)', () => {
    assert.equal(PDF_LAYOUT_CONFIG.page1.childFirstName.page, 1);
    assert.equal(PDF_LAYOUT_CONFIG.page2.bloodType.page, 2);
    assert.equal(PDF_LAYOUT_CONFIG.page3.ibanGrid.page, 3);
    assert.equal(PDF_LAYOUT_CONFIG.page3.ibanGrid.cells, 22);
    assert.ok(
      PDF_LAYOUT_CONFIG.page1.childLastNames.x + PDF_LAYOUT_CONFIG.page1.childLastNames.maxWidth < 595.2,
      'childLastNames debe caber en ancho A4',
    );
  });

  test('buildOfficialScoutPdfBytes falla si el expediente no tiene Hoja de Inscripción', async () => {
    const record = createBaseRecord({ enrollment: null });
    let threw = false;
    try {
      await buildOfficialScoutPdfBytes(record, templateBytes);
    } catch (err) {
      threw = true;
      assert.includes((err as Error).message, 'Hoja de Inscripción');
    }
    assert.ok(threw, 'Debe lanzar error cuando enrollment es null');
  });

  test('buildOfficialScoutPdfBytes genera un PDF válido de 3 páginas A4 con datos completos y caracteres españoles', async () => {
    const record = createBaseRecord({
      childFirstName: 'Íñigo José',
      childLastName1: 'Núñez-Peña',
      childLastName2: 'Águila',
      streetAddress: 'Avenida de la Constitución Española, Bloque 3',
    });

    const bytes = await buildOfficialScoutPdfBytes(record, templateBytes);
    assert.ok(bytes.byteLength > 1000, 'El PDF generado debe tener contenido');

    const loaded = await PDFDocument.load(bytes);
    assert.equal(loaded.getPageCount(), 3, 'El PDF debe conservar exactamente 3 páginas');
    for (const page of loaded.getPages()) {
      const { width, height } = page.getSize();
      assert.ok(Math.abs(width - 595.2) < 0.5, `Ancho esperado A4 (~595.2), obtenido ${width}`);
      assert.ok(Math.abs(height - 841.92) < 0.5, `Alto esperado A4 (~841.92), obtenido ${height}`);
    }
  });

  test('buildOfficialScoutPdfBytes maneja campos opcionales nulos, sin segundo apellido, mayor de edad y caracteres Unicode no WinAnsi', async () => {
    const base = createBaseRecord();
    const record = createBaseRecord({
      childFirstName: 'Chloe',
      childLastName1: 'Dupont',
      childLastName2: null,
      hasNoSecondLastName: true,
      childLastName: 'Dupont',
      apartmentDoor: null,
      parent2FirstName: null,
      parent2LastName: null,
      parent2Phone: null,
      parent2Email: null,
      enrollment: {
        ...base.enrollment!,
        childDni: null,
        childPhone: null,
        childEmail: null,
        legalStatus: 'MAYOR',
        circularPreference: 'CORREO_POSTAL',
        custodyType: 'SIN_ESPECIFICAR',
        parent2Dni: null,
        authorizesImages: false,
        bloodType: null,
        chronicDiseases: 'Sin datos — observación “especial” 😊',
        allergies: null,
        medHeadache: null,
        medFever: null,
        medStomach: null,
        medThroat: null,
        medicalObservations: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelationship: null,
        accountHolderAddress: null,
        accountHolderMunicipality: null,
        accountHolderPostalCode: null,
        signatureParent2: undefined,
      },
    });

    const bytes = await buildOfficialScoutPdfBytes(record, templateBytes);
    const loaded = await PDFDocument.load(bytes);
    assert.equal(loaded.getPageCount(), 3);

    // Verificar que los streams de contenido no contienen "null" ni "undefined" literales
    const rawPdfLatin1 = new TextDecoder('latin1').decode(bytes);
    assert.notIncludes(rawPdfLatin1, '(null)');
    assert.notIncludes(rawPdfLatin1, '(undefined)');
  });

  let passed = 0;
  for (const c of cases) {
    await c.fn();
    passed += 1;
    console.log(`PASS: ${c.name}`);
  }
  console.log(`\n${passed}/${cases.length} PDF generator tests passed.`);
}
