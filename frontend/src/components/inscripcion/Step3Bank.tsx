import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function Step3Bank({ formData, onChange }: Props) {
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
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">DNI del Titular *</label>
          <input
            type="text"
            name="accountHolderDni"
            value={formData.accountHolderDni}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN (ES + 22 dígitos) *</label>
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={onChange}
            placeholder="ES00 0000 0000 0000 0000 0000"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs text-slate-700">
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
    </div>
  );
}