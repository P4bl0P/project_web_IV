import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';
import FormField from '../ui/forms/FormField';
import FormSection from '../ui/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../ui/forms/formStyles';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fieldErrors?: Record<string, string>;
}

export default function Step3Bank({ formData, onChange, fieldErrors = {} }: Props) {
  return (
    <FormSection title="3. Domiciliación bancaria (SEPA)" description="Introduce los datos de la cuenta desde la que se gestionarán las cuotas.">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Titular de la cuenta" required error={fieldErrors.accountHolderName}>
          <input
            type="text"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={onChange}
            autoComplete="name"
            className={formInputClass(Boolean(fieldErrors.accountHolderName))}
          />
        </FormField>
        <FormField label="DNI del titular" required error={fieldErrors.accountHolderDni}>
          <input
            type="text"
            name="accountHolderDni"
            value={formData.accountHolderDni}
            onChange={onChange}
            inputMode="text"
            maxLength={9}
            className={formInputClass(Boolean(fieldErrors.accountHolderDni), 'uppercase')}
          />
        </FormField>
        <FormField label="IBAN" required hint="ES + 22 dígitos" error={fieldErrors.iban} className="md:col-span-2">
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={onChange}
            inputMode="text"
            maxLength={24}
            placeholder="ES00 0000 0000 0000 0000 0000"
            className={formInputClass(Boolean(fieldErrors.iban), 'font-mono uppercase tracking-wide')}
          />
        </FormField>
      </div>

      <label className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer text-xs text-slate-700 ${
        fieldErrors.authorizesSepa ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
      }`}>
        <input
          type="checkbox"
          name="authorizesSepa"
          checked={formData.authorizesSepa}
          onChange={onChange}
          className={formCheckboxClass}
        />
        <span>
          Autorizo a mi entidad bancaria a abonar las cuotas y actividades al Grupo Scout IV San José de Calasanz, aceptando el recargo en caso de devolución.
        </span>
      </label>
      {fieldErrors.authorizesSepa && <p className="text-[11px] text-red-600">{fieldErrors.authorizesSepa}</p>}
    </FormSection>
  );
}