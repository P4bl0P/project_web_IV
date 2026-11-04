import type { ChangeEvent } from 'react';
import type { ApplicantRecord, CompleteEnrollmentPayload } from '../../services/api';

interface Props {
  applicant: ApplicantRecord;
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function Step1Legal({ applicant, formData, onChange }: Props) {
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
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase"
          />
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nº</label>
          <input
            type="text"
            name="streetNumber"
            value={formData.streetNumber}
            onChange={onChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">C.P. *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
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
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase"
          />
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
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase"
          />
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