import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CriteriosSection from '../components/solicitud/CriteriosSection';
import EducandoSection from '../components/solicitud/EducandoSection';
import FamilySection from '../components/solicitud/FamilySection';
import SolicitudSuccess from '../components/solicitud/SolicitudSuccess';
import {
  buildSolicitudSubmissionPayload,
  clearLegacySolicitudDraftStorage,
  createInitialFormState,
  findFirstInvalidSolicitudField,
  getOrderedSolicitudErrors,
} from '../components/solicitud/solicitudForm';
import SolicitudPage from '../pages/SolicitudPage';
import { validateSolicitudForm } from '../utils/scoutValidators';

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
  match(actual: string, pattern: RegExp, message?: string) {
    if (!pattern.test(actual)) {
      throw new Error(
        message ?? `Expected output to match ${pattern.toString()}, got: ${actual.slice(0, 300)}`,
      );
    }
  },
  doesNotMatch(actual: string, pattern: RegExp, message?: string) {
    if (pattern.test(actual)) {
      throw new Error(message ?? `Expected output NOT to match ${pattern.toString()}`);
    }
  },
};

export async function runSolicitudFormTests() {
  const cases: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  const test = (name: string, fn: () => void | Promise<void>) => {
    cases.push({ name, fn });
  };

  test('createInitialFormState genera un estado limpio y familyUnitId único por instancia', () => {
    const first = createInitialFormState();
    const second = createInitialFormState();

    assert.equal(first.childFirstName, '');
    assert.equal(first.childLastName1, '');
    assert.equal(first.childLastName2, '');
    assert.equal(first.hasNoSecondLastName, false);
    assert.equal(first.noSecondLastNameJustification, '');
    assert.equal(first.childBirthDate, '');
    assert.equal(first.parent1FirstName, '');
    assert.equal(first.parent1LastName, '');
    assert.equal(first.parent1Phone, '');
    assert.equal(first.parent1Email, '');
    assert.equal(first.parent2FirstName, '');
    assert.equal(first.parent2LastName, '');
    assert.equal(first.parent2Phone, '');
    assert.equal(first.parent2Email, '');
    assert.equal(first.motivation, '');
    assert.equal(first.hasFamilyInGroup, false);
    assert.equal(first.familyMemberDetails, '');
    assert.equal(first.comesFromOtherGroup, false);
    assert.equal(first.originGroupDetails, '');
    assert.ok(first.familyUnitId && first.familyUnitId !== second.familyUnitId, 'Cada instancia debe tener un familyUnitId distinto');
  });

  test('SolicitudPage renderiza todos los campos originales limpios, sin errores iniciales ni datos de localStorage', () => {
    const prevWindow = (globalThis as { window?: unknown }).window;
    const removedKeys: string[] = [];

    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: () => JSON.stringify({ childFirstName: 'DatoAntiguo', parent1Email: 'viejo@example.com' }),
        removeItem: (k: string) => removedKeys.push(k),
      },
      sessionStorage: {
        removeItem: (k: string) => removedKeys.push(k),
      },
    };

    try {
      clearLegacySolicitudDraftStorage();
      assert.ok(
        removedKeys.includes('grupo_iv_solicitud_draft_v2'),
        'Debe limpiar cualquier clave heredada de localStorage',
      );

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <SolicitudPage />
        </MemoryRouter>,
      );

      assert.doesNotMatch(html, /DatoAntiguo/);
      assert.doesNotMatch(html, /viejo@example\.com/);
      assert.doesNotMatch(html, /role="alert"/);
      assert.match(html, /autoComplete="off"/i);

      for (const fieldName of [
        'childFirstName',
        'childLastName1',
        'childLastName2',
        'childBirthDate',
        'hasNoSecondLastName',
        'parent1FirstName',
        'parent1LastName',
        'parent1Phone',
        'parent1Email',
        'hasFamilyInGroup',
        'comesFromOtherGroup',
        'motivation',
      ]) {
        assert.match(html, new RegExp(`name="${fieldName}"`), `Falta el campo ${fieldName}`);
      }
    } finally {
      (globalThis as { window?: unknown }).window = prevWindow;
    }
  });

  test('findFirstInvalidSolicitudField y getOrderedSolicitudErrors respetan el orden visual del formulario', () => {
    const errors = {
      originGroupDetails: 'Indica el grupo de procedencia.',
      parent1Email: 'Email no válido.',
      childLastName1: 'Introduce el primer apellido (mín. 2 letras).',
    };

    assert.equal(findFirstInvalidSolicitudField(errors), 'childLastName1');
    const ordered = getOrderedSolicitudErrors(errors);
    assert.equal(ordered.length, 3);
    assert.equal(ordered[0].field, 'childLastName1');
    assert.equal(ordered[1].field, 'parent1Email');
    assert.equal(ordered[2].field, 'originGroupDetails');
  });

  test('Las secciones muestran errores accesibles (aria-invalid, aria-describedby y role=alert)', () => {
    const data = {
      ...createInitialFormState(),
      hasNoSecondLastName: true,
      hasFamilyInGroup: true,
      comesFromOtherGroup: true,
    };
    const errors = validateSolicitudForm(data, true);

    const educandoHtml = renderToStaticMarkup(
      <EducandoSection formData={data} fieldErrors={errors} onChange={() => undefined} />,
    );
    assert.match(educandoHtml, /id="solicitud-field-childFirstName"[^>]*aria-invalid="true"/);
    assert.match(educandoHtml, /aria-describedby="solicitud-error-childFirstName"/);
    assert.match(educandoHtml, /id="solicitud-error-childFirstName"[^>]*role="alert"/);
    assert.match(educandoHtml, /id="solicitud-error-noSecondLastNameJustification"[^>]*role="alert"/);

    const familyHtml = renderToStaticMarkup(
      <FamilySection
        formData={{ ...data, parent2Phone: '123' }}
        fieldErrors={validateSolicitudForm({ ...data, parent2Phone: '123' }, true)}
        showSecondParent
        onToggleSecondParent={() => undefined}
        onChange={() => undefined}
      />,
    );
    assert.match(familyHtml, /id="solicitud-error-parent1Phone"[^>]*role="alert"/);
    assert.match(familyHtml, /id="solicitud-error-parent2Phone"[^>]*role="alert"/);

    const criteriosHtml = renderToStaticMarkup(
      <CriteriosSection formData={data} fieldErrors={errors} onChange={() => undefined} />,
    );
    assert.match(criteriosHtml, /id="solicitud-field-familyMemberDetails"[^>]*aria-invalid="true"/);
    assert.match(criteriosHtml, /id="solicitud-error-familyMemberDetails"[^>]*role="alert"/);
    assert.match(criteriosHtml, /id="solicitud-field-originGroupDetails"[^>]*aria-invalid="true"/);
    assert.match(criteriosHtml, /id="solicitud-error-originGroupDetails"[^>]*role="alert"/);
  });

  test('buildSolicitudSubmissionPayload conserva exactamente el contrato del backend', () => {
    const payload = buildSolicitudSubmissionPayload(
      {
        childFirstName: '  Lucía ',
        childLastName1: ' Peña ',
        childLastName2: ' Álvarez ',
        hasNoSecondLastName: false,
        noSecondLastNameJustification: 'ignorado',
        childBirthDate: '2015-04-12',
        familyUnitId: 'fam-123',
        parent1FirstName: ' Elena ',
        parent1LastName: ' Álvarez ',
        parent1Phone: '600 11 22 33',
        parent1Email: ' elena@example.org ',
        parent2FirstName: ' Carlos ',
        parent2LastName: ' Peña ',
        parent2Phone: '600 44 55 66',
        parent2Email: ' carlos@example.org ',
        motivation: '  Ilusión por el grupo ',
        hasFamilyInGroup: true,
        familyMemberDetails: ' Hermano en Lobatos ',
        comesFromOtherGroup: false,
        originGroupDetails: 'No debe enviarse',
      },
      false,
      'idem-abc',
    );

    assert.equal(payload.childFirstName, 'Lucía');
    assert.equal(payload.childLastName1, 'Peña');
    assert.equal(payload.childLastName2, 'Álvarez');
    assert.equal(payload.noSecondLastNameJustification, undefined);
    assert.equal(payload.parent1Phone, '600112233');
    assert.equal(payload.parent1Email, 'elena@example.org');
    assert.equal(payload.parent2FirstName, undefined);
    assert.equal(payload.parent2LastName, undefined);
    assert.equal(payload.parent2Phone, undefined);
    assert.equal(payload.parent2Email, undefined);
    assert.equal(payload.familyMemberDetails, 'Hermano en Lobatos');
    assert.equal(payload.originGroupDetails, undefined);
    assert.equal(payload.motivation, 'Ilusión por el grupo');
    assert.equal(payload.idempotencyKey, 'idem-abc');

    const payloadSecondParent = buildSolicitudSubmissionPayload(
      {
        childFirstName: 'Chloe',
        childLastName1: 'Dupont',
        childLastName2: 'Ignorado',
        hasNoSecondLastName: true,
        noSecondLastNameJustification: ' Documento francés ',
        childBirthDate: '2016-05-10',
        familyUnitId: 'fam-456',
        parent1FirstName: 'Claire',
        parent1LastName: 'Dupont',
        parent1Phone: '611 22 33 44',
        parent1Email: 'claire@example.org',
        parent2FirstName: ' Marc ',
        parent2LastName: ' Martin ',
        parent2Phone: '622 33 44 55',
        parent2Email: ' marc@example.org ',
        motivation: '',
        hasFamilyInGroup: false,
        familyMemberDetails: 'Ignorado',
        comesFromOtherGroup: true,
        originGroupDetails: ' Grupo Scout Lyon ',
      },
      true,
      'idem-def',
    );

    assert.equal(payloadSecondParent.childLastName2, undefined);
    assert.equal(payloadSecondParent.hasNoSecondLastName, true);
    assert.equal(payloadSecondParent.noSecondLastNameJustification, 'Documento francés');
    assert.equal(payloadSecondParent.parent2FirstName, 'Marc');
    assert.equal(payloadSecondParent.parent2LastName, 'Martin');
    assert.equal(payloadSecondParent.parent2Phone, '622334455');
    assert.equal(payloadSecondParent.parent2Email, 'marc@example.org');
    assert.equal(payloadSecondParent.familyMemberDetails, undefined);
    assert.equal(payloadSecondParent.originGroupDetails, 'Grupo Scout Lyon');
    assert.equal(payloadSecondParent.motivation, undefined);
  });

  test('SolicitudSuccess muestra los educandos registrados y las acciones de hermano y nueva solicitud', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SolicitudSuccess
          submittedChildren={[{ name: 'Lucía Peña Álvarez', branch: 'Lobatos' }]}
          onAddSibling={() => undefined}
          onStartFresh={() => undefined}
        />
      </MemoryRouter>,
    );

    assert.match(html, /¡Solicitud registrada con éxito!/);
    assert.match(html, /Lucía Peña Álvarez/);
    assert.match(html, /Lobatos/);
    assert.match(html, /Inscribir a otro hermano\/a/);
    assert.match(html, /Realizar una nueva solicitud desde cero/);
  });

  let passed = 0;
  for (const c of cases) {
    await c.fn();
    passed += 1;
    console.log(`PASS: ${c.name}`);
  }
  console.log(`\n${passed}/${cases.length} solicitud form tests passed.`);
}
