import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';

interface Props {
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFillHolderFromTutor1?: () => void;
  fieldErrors?: Record<string, string>;
}

export default function Step3Bank({
  formData,
  onChange,
  onFillHolderFromTutor1,
  fieldErrors = {},
}: Props) {
  return (
    <FormSection
      title="3. Domiciliación bancaria (SEPA)"
      description="Introduce los datos del titular y la cuenta bancaria. El titular puede ser distinto del tutor principal."
    >
      {onFillHolderFromTutor1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onFillHolderFromTutor1}
            className="text-xs font-semibold text-[#01317b] hover:underline cursor-pointer"
          >
            Rellenar con los datos del Tutor 1 y domicilio familiar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Titular de la cuenta" required error={fieldErrors.accountHolderName}>
          <input
            type="text"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={onChange}
            autoComplete="name"
            placeholder="Nombre y apellidos del titular bancario"
            className={formInputClass(Boolean(fieldErrors.accountHolderName))}
          />
        </FormField>
        <FormField label="DNI / NIE del titular" required error={fieldErrors.accountHolderDni}>
          <input
            type="text"
            name="accountHolderDni"
            value={formData.accountHolderDni}
            onChange={onChange}
            inputMode="text"
            maxLength={9}
            placeholder="12345678Z"
            className={formInputClass(Boolean(fieldErrors.accountHolderDni), 'uppercase')}
          />
        </FormField>

        <FormField label="Dirección del titular" className="md:col-span-2">
          <input
            type="text"
            name="accountHolderAddress"
            value={formData.accountHolderAddress || ''}
            onChange={onChange}
            placeholder="Si es distinta a la del educando, indícala aquí"
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Localidad del titular">
          <input
            type="text"
            name="accountHolderMunicipality"
            value={formData.accountHolderMunicipality || ''}
            onChange={onChange}
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Código postal del titular" error={fieldErrors.accountHolderPostalCode}>
          <input
            type="text"
            name="accountHolderPostalCode"
            value={formData.accountHolderPostalCode || ''}
            onChange={onChange}
            inputMode="numeric"
            maxLength={5}
            className={formInputClass(Boolean(fieldErrors.accountHolderPostalCode))}
          />
        </FormField>

        <FormField label="IBAN" required hint="ES + 22 dígitos" error={fieldErrors.iban} className="md:col-span-2">
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={onChange}
            inputMode="text"
            maxLength={29}
            placeholder="ES00 0000 0000 0000 0000 0000"
            className={formInputClass(Boolean(fieldErrors.iban), 'font-mono uppercase tracking-wide')}
          />
        </FormField>
      </div>

      <label
        className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer text-xs transition-colors ${
          fieldErrors.authorizesSepa
            ? 'border-rose-400 bg-rose-50 text-rose-900'
            : 'border-slate-200/80 bg-[#f8f9fc] text-slate-700'
        }`}
      >
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
      {fieldErrors.authorizesSepa && (
        <p className="text-[11px] font-medium text-rose-600">{fieldErrors.authorizesSepa}</p>
      )}
    </FormSection>
  );
}
