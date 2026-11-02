import type { ChangeEvent } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import { calculatePreviewBranch, type SolicitudFieldErrors } from '../../utils/scoutValidators';

interface Props {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function EducandoSection({ formData, fieldErrors, onChange }: Props) {
  const branchPreview = calculatePreviewBranch(formData.childBirthDate);

  const inputClass = (field: keyof CreateApplicationPayload) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
      fieldErrors[field]
        ? 'border-red-500 bg-red-50/40 focus:border-red-600'
        : 'border-slate-300 bg-white focus:border-indigo-600'
    }`;

  return (
    <section className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Compass className="text-indigo-600" size={20} />
        1. Datos del Niño, Niña o Joven
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
          <input
            type="text"
            name="childFirstName"
            value={formData.childFirstName}
            onChange={onChange}
            placeholder="Ej. Lucas"
            className={inputClass('childFirstName')}
          />
          {fieldErrors.childFirstName && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.childFirstName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
          <input
            type="text"
            name="childLastName"
            value={formData.childLastName}
            onChange={onChange}
            placeholder="Ej. García Pérez"
            className={inputClass('childLastName')}
          />
          {fieldErrors.childLastName && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.childLastName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de nacimiento *</label>
          <input
            type="date"
            name="childBirthDate"
            value={formData.childBirthDate}
            onChange={onChange}
            className={inputClass('childBirthDate')}
          />
          {fieldErrors.childBirthDate && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.childBirthDate}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sexo * <span className="text-xs text-slate-400 font-normal">(Ratio de rama)</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={onChange}
            className={inputClass('gender')}
          >
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>

      {branchPreview && !fieldErrors.childBirthDate && (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex items-center gap-3 text-indigo-900">
          <Sparkles size={18} className="text-indigo-600 shrink-0" />
          <p className="text-xs sm:text-sm">
            Por su año de nacimiento ({branchPreview.age} años en esta ronda solar), solicita
            plaza para: <strong>{branchPreview.branch}</strong>
          </p>
        </div>
      )}
    </section>
  );
}