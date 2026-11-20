import type { ChangeEvent } from 'react';
import { Users } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import type { SolicitudFieldErrors } from '../../utils/scoutValidators';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formInputClass } from '../shared/forms/formStyles';

interface Props {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  showSecondParent: boolean;
  onToggleSecondParent: (checked: boolean) => void;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function FamilySection({
  formData,
  fieldErrors,
  showSecondParent,
  onToggleSecondParent,
  onChange,
}: Props) {
  return (
    <>
      {/* Domicilio */}
      <FormSection title="2. Domicilio Familiar">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Calle / Plaza" required error={fieldErrors.streetAddress} className="md:col-span-2">
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={onChange}
              placeholder="Avda. Madre Paula Montalt"
              className={formInputClass(Boolean(fieldErrors.streetAddress))}
            />
          </FormField>

          <FormField label="Número">
            <input
              type="text"
              name="streetNumber"
              value={formData.streetNumber}
              onChange={onChange}
              placeholder="Ej. 12"
              className={formInputClass(Boolean(fieldErrors.streetNumber))}
            />
          </FormField>

          <FormField label="Piso / Puerta">
            <input
              type="text"
              name="ApartmentDoor"
              value={formData.ApartmentDoor}
              onChange={onChange}
              placeholder="Ej. 3º B"
              className={formInputClass(Boolean(fieldErrors.ApartmentDoor))}
            />
          </FormField>

          <FormField label="Código Postal" required error={fieldErrors.postalCode}>
            <input
              type="text"
              name="postalCode"
              maxLength={5}
              value={formData.postalCode}
              onChange={onChange}
              className={formInputClass(Boolean(fieldErrors.postalCode))}
            />
          </FormField>

          <FormField label="Municipio" required error={fieldErrors.municipality} className="md:col-span-2">
            <input
              type="text"
              name="municipality"
              value={formData.municipality}
              onChange={onChange}
              className={formInputClass(Boolean(fieldErrors.municipality))}
            />
          </FormField>

          <FormField label="Provincia" required error={fieldErrors.province}>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={onChange}
              className={formInputClass(Boolean(fieldErrors.province))}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Padres y Tutores */}
      <FormSection>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Users className="text-indigo-600" size={20} />
          3. Datos de los Padres o Tutores
        </h2>

        <div className="mb-4">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">
            Tutor Principal *
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre" required error={fieldErrors.parent1FirstName}>
              <input
                type="text"
                name="parent1FirstName"
                value={formData.parent1FirstName}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.parent1FirstName))}
              />
            </FormField>
            <FormField label="Apellidos" required error={fieldErrors.parent1LastName}>
              <input
                type="text"
                name="parent1LastName"
                value={formData.parent1LastName}
                onChange={onChange}
                className={formInputClass(Boolean(fieldErrors.parent1LastName))}
              />
            </FormField>
            <FormField label="Teléfono (WhatsApp)" required error={fieldErrors.parent1Phone}>
              <input
                type="tel"
                name="parent1Phone"
                value={formData.parent1Phone}
                onChange={onChange}
                placeholder="600112233"
                className={formInputClass(Boolean(fieldErrors.parent1Phone))}
              />
            </FormField>
            <FormField label="Correo electrónico" required error={fieldErrors.parent1Email}>
              <input
                type="email"
                name="parent1Email"
                value={formData.parent1Email}
                onChange={onChange}
                placeholder="familia@ejemplo.com"
                className={formInputClass(Boolean(fieldErrors.parent1Email))}
              />
            </FormField>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-700">
            <input
              type="checkbox"
              checked={showSecondParent}
              onChange={(e) => onToggleSecondParent(e.target.checked)}
              className="rounded text-indigo-600 h-4 w-4"
            />
            Añadir segundo progenitor / tutor (Opcional)
          </label>

          {showSecondParent && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <FormField label="Nombre">
                <input
                  type="text"
                  name="parent2FirstName"
                  value={formData.parent2FirstName}
                  onChange={onChange}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Apellidos">
                <input
                  type="text"
                  name="parent2LastName"
                  value={formData.parent2LastName}
                  onChange={onChange}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Teléfono" error={fieldErrors.parent2Phone}>
                <input
                  type="tel"
                  name="parent2Phone"
                  value={formData.parent2Phone}
                  onChange={onChange}
                  className={formInputClass(Boolean(fieldErrors.parent2Phone))}
                />
              </FormField>
              <FormField label="Correo electrónico" error={fieldErrors.parent2Email}>
                <input
                  type="email"
                  name="parent2Email"
                  value={formData.parent2Email}
                  onChange={onChange}
                  className={formInputClass(Boolean(fieldErrors.parent2Email))}
                />
              </FormField>
            </div>
          )}
        </div>
      </FormSection>
    </>
  );
}