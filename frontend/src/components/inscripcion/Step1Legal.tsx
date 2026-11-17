import type { ChangeEvent } from 'react';
import type { ApplicantRecord, CompleteEnrollmentPayload } from '../../services/api';

interface Props {
  applicant: Pick<ApplicantRecord, 'parent1FirstName'>;
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  fieldErrors?: Record<string, string>;
}

export default function Step1Legal({ applicant, formData, onChange, fieldErrors = {} }: Props) {
  const inputClass = (field: string, extra = '') =>
    `w-full rounded-xl border px-3 py-2 text-sm ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'
    } ${extra}`;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">1. Domicilio y Datos Legales</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">DNI Educando (si tiene)</label>
          <input
            type="text"
            name="childDni"
            value={formData.childDni}
            onChange={onChange}
            placeholder="12345678A"
            className={inputClass('childDni', 'uppercase')}
          />
          {fieldErrors.childDni && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.childDni}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Situación</label>
          <select
            name="legalStatus"
            value={formData.legalStatus}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="MENOR">Menor de edad</option>
            <option value="MAYOR">Mayor de edad</option>
            <option value="EMANCIPADO">Emancipado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Circulares</label>
          <select
            name="circularPreference"
            value={formData.circularPreference}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="EMAIL">E-Mail</option>
            <option value="CORREO_POSTAL">Correo Postal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección *</label>
          <input
            type="text"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={onChange}
            autoComplete="street-address"
            className={inputClass('streetAddress', 'rounded-lg bg-white')}
          />
          {fieldErrors.streetAddress && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.streetAddress}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nº</label>
          <input
            type="text"
            name="streetNumber"
            value={formData.streetNumber}
            onChange={onChange}
            className={inputClass('streetNumber', 'rounded-lg bg-white')}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">C.P. *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            inputMode="numeric"
            maxLength={5}
            className={inputClass('postalCode', 'rounded-lg bg-white')}
          />
          {fieldErrors.postalCode && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.postalCode}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Municipio *</label>
          <input
            type="text"
            name="municipality"
            value={formData.municipality}
            onChange={onChange}
            className={inputClass('municipality', 'rounded-lg bg-white')}
          />
          {fieldErrors.municipality && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.municipality}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Provincia *</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={onChange}
            className={inputClass('province', 'rounded-lg bg-white')}
          />
          {fieldErrors.province && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.province}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Tutor 1 *</label>
          <input
            type="tel"
            name="parent1Phone"
            value={formData.parent1Phone}
            onChange={onChange}
            autoComplete="tel"
            inputMode="tel"
            className={inputClass('parent1Phone')}
          />
          {fieldErrors.parent1Phone && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.parent1Phone}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Tutor 1 *</label>
          <input
            type="email"
            name="parent1Email"
            value={formData.parent1Email}
            onChange={onChange}
            autoComplete="email"
            className={inputClass('parent1Email')}
          />
          {fieldErrors.parent1Email && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.parent1Email}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Tutor 2</label>
          <input
            type="tel"
            name="parent2Phone"
            value={formData.parent2Phone}
            onChange={onChange}
            inputMode="tel"
            className={inputClass('parent2Phone')}
          />
          {fieldErrors.parent2Phone && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.parent2Phone}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Tutor 2</label>
          <input
            type="email"
            name="parent2Email"
            value={formData.parent2Email}
            onChange={onChange}
            className={inputClass('parent2Email')}
          />
          {fieldErrors.parent2Email && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.parent2Email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            DNI Tutor 1 ({applicant.parent1FirstName}) *
          </label>
          <input
            type="text"
            name="parent1Dni"
            value={formData.parent1Dni}
            onChange={onChange}
            placeholder="12345678A"
            className={inputClass('parent1Dni', 'uppercase')}
          />
          {fieldErrors.parent1Dni && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.parent1Dni}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            DNI Tutor 2 {formData.custodyType === 'CUSTODIA_CONJUNTA' ? '*' : '(Opcional)'}
          </label>
          <input
            type="text"
            name="parent2Dni"
            value={formData.parent2Dni}
            onChange={onChange}
            className={inputClass('parent2Dni', 'uppercase')}
          />
          {fieldErrors.parent2Dni && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.parent2Dni}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Estado Civil Padres</label>
          <input
            type="text"
            name="parentsMaritalStatus"
            value={formData.parentsMaritalStatus}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Custodia</label>
          <select
            name="custodyType"
            value={formData.custodyType}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="SIN_ESPECIFICAR">Estándar</option>
            <option value="CUSTODIA_UNICA">Custodia Única (1 firma)</option>
            <option value="CUSTODIA_CONJUNTA">Custodia Conjunta (2 firmas)</option>
            <option value="TUTELA_LEGAL">Tutela Legal</option>
          </select>
        </div>
      </div>
    </div>
  );
}