import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function Step2Medical({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">2. Ficha Médica</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Grupo Sanguíneo</label>
          <input
            type="text"
            name="bloodType"
            value={formData.bloodType}
            onChange={onChange}
            placeholder="Ej. A+, 0-"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Enfermedades Crónicas</label>
          <input
            type="text"
            name="chronicDiseases"
            value={formData.chronicDiseases}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Alergias</label>
        <textarea
          name="allergies"
          rows={2}
          value={formData.allergies}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
        {([
          ['medHeadache', 'Dolor de Cabeza'],
          ['medFever', 'Fiebre'],
          ['medStomach', 'Estómago'],
          ['medThroat', 'Garganta'],
        ] as const).map(([field, label]) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={onChange}
              placeholder="Qué administrarle..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones Médicas</label>
        <textarea
          name="medicalObservations"
          rows={2}
          value={formData.medicalObservations}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer text-xs text-amber-950">
        <input
          type="checkbox"
          name="authorizesEmergency"
          checked={formData.authorizesEmergency}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 rounded text-indigo-600"
        />
        <span>
          <strong>Autorización médica de urgencia:</strong> Autorizo a los responsables del Grupo Scout a tomar la decisión médica oportuna en caso de urgencia si no es posible localizarme.
        </span>
      </label>
    </div>
  );
}