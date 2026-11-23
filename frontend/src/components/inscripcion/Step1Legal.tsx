import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';
import { getTodayIsoDate } from '../../utils/dateUtils';
import DatePicker from '../shared/forms/DatePicker';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';

interface Props {
  applicant: {
    parent1FirstName?: string;
    parent2FirstName?: string | null;
  };
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  fieldErrors?: Record<string, string>;
  showIdentityRevision?: boolean;
}

const RELATIONSHIP_OPTIONS = [
  'Madre',
  'Padre',
  'Tutor/a legal',
  'Representante legal',
  'Otro familiar autorizado',
];

export default function Step1Legal({
  applicant,
  formData,
  onChange,
  fieldErrors = {},
  showIdentityRevision = true,
}: Props) {
  const tutor1Label = formData.parent1FirstName || applicant.parent1FirstName || 'Tutor 1';

  return (
    <FormSection
      title="1. Datos del educando, domicilio y situación legal"
      description="Revisa los datos recogidos en la solicitud y completa la información oficial necesaria."
    >
      {showIdentityRevision && (
        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-[#f8f9fc] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#000254]">
            Revisión de datos del educando
          </p>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <FormField label="Nombre" required error={fieldErrors.childFirstName}>
              <input
                type="text"
                name="childFirstName"
                value={formData.childFirstName || ''}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.childFirstName))}
              />
            </FormField>
            <FormField label="Primer apellido" required error={fieldErrors.childLastName1}>
              <input
                type="text"
                name="childLastName1"
                value={formData.childLastName1 || ''}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.childLastName1))}
              />
            </FormField>
            <FormField
              label="Segundo apellido"
              required={!formData.hasNoSecondLastName}
              error={fieldErrors.childLastName2}
            >
              <input
                type="text"
                name="childLastName2"
                disabled={Boolean(formData.hasNoSecondLastName)}
                value={formData.hasNoSecondLastName ? '' : formData.childLastName2 || ''}
                onChange={onChange}
                className={formInputClass(
                  Boolean(fieldErrors.childLastName2),
                  formData.hasNoSecondLastName ? 'bg-slate-100 text-slate-400' : '',
                )}
              />
            </FormField>
            <FormField label="Fecha de nacimiento" required error={fieldErrors.childBirthDate}>
              <DatePicker
                name="childBirthDate"
                value={formData.childBirthDate || ''}
                onChange={onChange}
                max={getTodayIsoDate()}
                min={`${new Date().getFullYear() - 25}-01-01`}
                defaultViewYear={new Date().getFullYear() - 10}
                hasError={Boolean(fieldErrors.childBirthDate)}
                aria-label="Fecha de nacimiento"
              />
            </FormField>
            <FormField label="Género" required error={fieldErrors.gender}>
              <select
                name="gender"
                value={formData.gender}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.gender), 'bg-white cursor-pointer')}
              >
                <option value="">Selecciona género…</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </FormField>
            <FormField
              label="DNI / NIE del educando"
              hint="Opcional · Déjalo vacío si no dispone"
              error={fieldErrors.childDni}
            >
              <input
                type="text"
                name="childDni"
                value={formData.childDni || ''}
                onChange={onChange}
                placeholder="Sin DNI"
                className={formInputClass(Boolean(fieldErrors.childDni), 'uppercase')}
              />
            </FormField>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="hasNoSecondLastName"
              checked={Boolean(formData.hasNoSecondLastName)}
              onChange={onChange}
              className={formCheckboxClass}
            />
            <span>El educando no dispone de segundo apellido</span>
          </label>
          {formData.hasNoSecondLastName && (
            <FormField
              label="Justificación de ausencia de segundo apellido"
              required
              error={fieldErrors.noSecondLastNameJustification}
            >
              <input
                type="text"
                name="noSecondLastNameJustification"
                value={formData.noSecondLastNameJustification || ''}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.noSecondLastNameJustification))}
              />
            </FormField>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {!showIdentityRevision && (
          <FormField
            label="DNI / NIE del educando"
            hint="Opcional · Si dispone"
            error={fieldErrors.childDni}
          >
            <input
              type="text"
              name="childDni"
              value={formData.childDni || ''}
              onChange={onChange}
              placeholder="Opcional"
              className={formInputClass(Boolean(fieldErrors.childDni), 'uppercase')}
            />
          </FormField>
        )}
        <FormField label="Teléfono del educando" hint="Solo mayores / Pioneros">
          <input
            type="tel"
            name="childPhone"
            value={formData.childPhone || ''}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.childPhone))}
          />
        </FormField>
        <FormField label="Correo del educando" hint="Opcional">
          <input
            type="email"
            name="childEmail"
            value={formData.childEmail || ''}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.childEmail))}
          />
        </FormField>
        <FormField label="Situación legal">
          <select
            name="legalStatus"
            value={formData.legalStatus}
            onChange={onChange}
            className={formInputClass(false, 'bg-white')}
          >
            <option value="MENOR">Menor de edad</option>
            <option value="MAYOR">Mayor de edad</option>
            <option value="EMANCIPADO">Emancipado</option>
          </select>
        </FormField>
        <FormField label="Recepción de circulares">
          <select
            name="circularPreference"
            value={formData.circularPreference}
            onChange={onChange}
            className={formInputClass(false, 'bg-white')}
          >
            <option value="EMAIL">Correo electrónico</option>
            <option value="CORREO_POSTAL">Correo postal</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3.5 bg-[#f8f9fc] p-4 rounded-xl border border-slate-200/80">
        <FormField label="Dirección principal" required error={fieldErrors.streetAddress} className="md:col-span-3">
          <input
            type="text"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={onChange}
            placeholder="Calle / Avenida / Plaza"
            autoComplete="street-address"
            className={formInputClass(Boolean(fieldErrors.streetAddress))}
          />
        </FormField>
        <FormField label="Número">
          <input
            type="text"
            name="streetNumber"
            value={formData.streetNumber || ''}
            onChange={onChange}
            placeholder="Nº"
            className={formInputClass(Boolean(fieldErrors.streetNumber))}
          />
        </FormField>
        <FormField label="Piso / Puerta" className="md:col-span-2">
          <input
            type="text"
            name="apartmentDoor"
            value={formData.apartmentDoor || ''}
            onChange={onChange}
            placeholder="Ej. 3º B"
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Código postal" required error={fieldErrors.postalCode}>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            inputMode="numeric"
            maxLength={5}
            placeholder="41089"
            className={formInputClass(Boolean(fieldErrors.postalCode))}
          />
        </FormField>
        <FormField label="Localidad" required error={fieldErrors.municipality} className="md:col-span-3">
          <input
            type="text"
            name="municipality"
            value={formData.municipality}
            onChange={onChange}
            placeholder="Localidad"
            className={formInputClass(Boolean(fieldErrors.municipality))}
          />
        </FormField>
        <FormField label="Provincia" required error={fieldErrors.province} className="md:col-span-2">
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={onChange}
            placeholder="Provincia"
            className={formInputClass(Boolean(fieldErrors.province))}
          />
        </FormField>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#000254]">
            Tutor o representante legal principal ({tutor1Label})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {showIdentityRevision && (
              <>
                <FormField label="Nombre" required error={fieldErrors.parent1FirstName}>
                  <input
                    type="text"
                    name="parent1FirstName"
                    value={formData.parent1FirstName || ''}
                    onChange={onChange}
                    className={formInputClass(Boolean(fieldErrors.parent1FirstName))}
                  />
                </FormField>
                <FormField label="Apellidos" required error={fieldErrors.parent1LastName}>
                  <input
                    type="text"
                    name="parent1LastName"
                    value={formData.parent1LastName || ''}
                    onChange={onChange}
                    className={formInputClass(Boolean(fieldErrors.parent1LastName))}
                  />
                </FormField>
              </>
            )}
            <FormField label="Relación con el educando">
              <select
                name="parent1Relationship"
                value={formData.parent1Relationship || ''}
                onChange={onChange}
                className={formInputClass(false, 'bg-white')}
              >
                <option value="">Selecciona relación…</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="DNI / NIE del tutor 1" required error={fieldErrors.parent1Dni}>
              <input
                type="text"
                name="parent1Dni"
                value={formData.parent1Dni}
                onChange={onChange}
                placeholder="12345678Z"
                className={formInputClass(Boolean(fieldErrors.parent1Dni), 'uppercase')}
              />
            </FormField>
            <FormField label="Teléfono" required error={fieldErrors.parent1Phone}>
              <input
                type="tel"
                name="parent1Phone"
                value={formData.parent1Phone || ''}
                onChange={onChange}
                autoComplete="tel"
                inputMode="tel"
                className={formInputClass(Boolean(fieldErrors.parent1Phone))}
              />
            </FormField>
            <FormField label="Correo electrónico" required error={fieldErrors.parent1Email}>
              <input
                type="email"
                name="parent1Email"
                value={formData.parent1Email || ''}
                onChange={onChange}
                autoComplete="email"
                className={formInputClass(Boolean(fieldErrors.parent1Email))}
              />
            </FormField>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Segundo tutor o representante legal (Opcional salvo custodia conjunta)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {showIdentityRevision && (
              <>
                <FormField label="Nombre">
                  <input
                    type="text"
                    name="parent2FirstName"
                    value={formData.parent2FirstName || ''}
                    onChange={onChange}
                    className={formInputClass()}
                  />
                </FormField>
                <FormField label="Apellidos">
                  <input
                    type="text"
                    name="parent2LastName"
                    value={formData.parent2LastName || ''}
                    onChange={onChange}
                    className={formInputClass()}
                  />
                </FormField>
              </>
            )}
            <FormField label="Relación con el educando">
              <select
                name="parent2Relationship"
                value={formData.parent2Relationship || ''}
                onChange={onChange}
                className={formInputClass(false, 'bg-white')}
              >
                <option value="">Selecciona relación…</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="DNI / NIE del tutor 2"
              required={formData.custodyType === 'CUSTODIA_CONJUNTA'}
              hint={formData.custodyType === 'CUSTODIA_CONJUNTA' ? undefined : 'Opcional'}
              error={fieldErrors.parent2Dni}
            >
              <input
                type="text"
                name="parent2Dni"
                value={formData.parent2Dni || ''}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.parent2Dni), 'uppercase')}
              />
            </FormField>
            <FormField label="Teléfono" error={fieldErrors.parent2Phone}>
              <input
                type="tel"
                name="parent2Phone"
                value={formData.parent2Phone || ''}
                onChange={onChange}
                inputMode="tel"
                className={formInputClass(Boolean(fieldErrors.parent2Phone))}
              />
            </FormField>
            <FormField label="Correo electrónico" error={fieldErrors.parent2Email}>
              <input
                type="email"
                name="parent2Email"
                value={formData.parent2Email || ''}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.parent2Email))}
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Situación familiar / estado civil">
          <input
            type="text"
            name="parentsMaritalStatus"
            value={formData.parentsMaritalStatus || ''}
            onChange={onChange}
            placeholder="Ej. Casados, familia monoparental, separados..."
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Régimen legal y custodia">
          <select
            name="custodyType"
            value={formData.custodyType}
            onChange={onChange}
            className={formInputClass(false, 'bg-white')}
          >
            <option value="SIN_ESPECIFICAR">Estándar / Patria potestad ordinaria</option>
            <option value="CUSTODIA_UNICA">Custodia Única (1 firma)</option>
            <option value="CUSTODIA_CONJUNTA">Custodia Conjunta (2 firmas obligatorias)</option>
            <option value="TUTELA_LEGAL">Tutela Legal</option>
          </select>
        </FormField>
      </div>
    </FormSection>
  );
}
