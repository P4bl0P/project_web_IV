import type { ChangeEvent } from 'react';
import { Users } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import type { SolicitudFieldErrors } from '../../utils/scoutValidators';

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
  const inputClass = (field: keyof CreateApplicationPayload) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
      fieldErrors[field]
        ? 'border-red-500 bg-red-50/40 focus:border-red-600'
        : 'border-slate-300 bg-white focus:border-indigo-600'
    }`;

  return (
    <>
      {/* Domicilio */}
      <section className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">2. Domicilio Familiar</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Calle / Plaza *</label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={onChange}
              placeholder="Avda. Madre Paula Montalt"
              className={inputClass('streetAddress')}
            />
            {fieldErrors.streetAddress && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.streetAddress}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
            <input
              type="text"
              name="streetNumber"
              value={formData.streetNumber}
              onChange={onChange}
              placeholder="Ej. 12"
              className={inputClass('streetNumber')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Piso / Puerta</label>
            <input
              type="text"
              name="ApartmentDoor"
              value={formData.ApartmentDoor}
              onChange={onChange}
              placeholder="Ej. 3º B"
              className={inputClass('ApartmentDoor')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal *</label>
            <input
              type="text"
              name="postalCode"
              maxLength={5}
              value={formData.postalCode}
              onChange={onChange}
              className={inputClass('postalCode')}
            />
            {fieldErrors.postalCode && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.postalCode}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio *</label>
            <input
              type="text"
              name="municipality"
              value={formData.municipality}
              onChange={onChange}
              className={inputClass('municipality')}
            />
            {fieldErrors.municipality && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.municipality}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Provincia *</label>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={onChange}
              className={inputClass('province')}
            />
            {fieldErrors.province && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.province}</p>
            )}
          </div>
        </div>
      </section>

      {/* Padres y Tutores */}
      <section className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          3. Datos de los Padres o Tutores
        </h2>

        <div className="mb-4">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">
            Tutor Principal *
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="parent1FirstName"
                value={formData.parent1FirstName}
                onChange={onChange}
                className={inputClass('parent1FirstName')}
              />
              {fieldErrors.parent1FirstName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1FirstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                name="parent1LastName"
                value={formData.parent1LastName}
                onChange={onChange}
                className={inputClass('parent1LastName')}
              />
              {fieldErrors.parent1LastName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1LastName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono (WhatsApp) *</label>
              <input
                type="tel"
                name="parent1Phone"
                value={formData.parent1Phone}
                onChange={onChange}
                placeholder="600112233"
                className={inputClass('parent1Phone')}
              />
              {fieldErrors.parent1Phone && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1Phone}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                name="parent1Email"
                value={formData.parent1Email}
                onChange={onChange}
                placeholder="familia@ejemplo.com"
                className={inputClass('parent1Email')}
              />
              {fieldErrors.parent1Email && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.parent1Email}</p>
              )}
            </div>
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="parent2FirstName"
                  value={formData.parent2FirstName}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  name="parent2LastName"
                  value={formData.parent2LastName}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="parent2Phone"
                  value={formData.parent2Phone}
                  onChange={formData.parent2Phone ? onChange : onChange}
                  className={inputClass('parent2Phone')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  name="parent2Email"
                  value={formData.parent2Email}
                  onChange={onChange}
                  className={inputClass('parent2Email')}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}