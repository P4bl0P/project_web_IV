import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fieldErrors?: Record<string, string>;
}

export default function Step3Bank({ formData, onChange, fieldErrors = {} }: Props) {
  const inputClass = (field: string, extra = '') =>
    `w-full rounded-xl border px-3 py-2 text-sm ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'
    } ${extra}`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">3. Domiciliación Bancaria (SEPA)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Titular de la Cuenta *</label>
          <input
            type="text"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={onChange}
            autoComplete="name"
            className={inputClass('accountHolderName')}
          />
          {fieldErrors.accountHolderName && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.accountHolderName}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">DNI del Titular *</label>
          <input
            type="text"
            name="accountHolderDni"
            value={formData.accountHolderDni}
            onChange={onChange}
            inputMode="text"
            maxLength={9}
            className={inputClass('accountHolderDni', 'uppercase')}
          />
          {fieldErrors.accountHolderDni && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.accountHolderDni}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN (ES + 22 dígitos) *</label>
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={onChange}
            inputMode="text"
            maxLength={24}
            placeholder="ES00 0000 0000 0000 0000 0000"
            className={inputClass('iban', 'font-mono uppercase tracking-wide')}
          />
          {fieldErrors.iban && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.iban}</p>}
        </div>
      </div>

      <label className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer text-xs text-slate-700 ${
        fieldErrors.authorizesSepa ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
      }`}>
        <input
          type="checkbox"
          name="authorizesSepa"
          checked={formData.authorizesSepa}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 rounded text-indigo-600"
        />
        <span>
          Autorizo a mi entidad bancaria a abonar las cuotas y actividades al Grupo Scout IV San José de Calasanz, aceptando el recargo en caso de devolución.
        </span>
      </label>
      {fieldErrors.authorizesSepa && <p className="text-[11px] text-red-600">{fieldErrors.authorizesSepa}</p>}
    </div>
  );
}