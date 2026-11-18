import type { ChangeEvent } from 'react';
import type { ApplicantRecord, CompleteEnrollmentPayload } from '../../services/api';
import FormField from '../ui/forms/FormField';
import FormSection from '../ui/forms/FormSection';
import { formInputClass } from '../ui/forms/formStyles';

interface Props {
  applicant: Pick<ApplicantRecord, 'parent1FirstName'>;
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  fieldErrors?: Record<string, string>;
}

export default function Step1Legal({ applicant, formData, onChange, fieldErrors = {} }: Props) {
  return (
    <FormSection title="1. Domicilio y datos legales">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="DNI del educando" hint="Si tiene">
          <input
            type="text"
            name="childDni"
            value={formData.childDni}
            onChange={onChange}
            placeholder="12345678A"
            className={formInputClass(Boolean(fieldErrors.childDni), 'uppercase')}
          />
        </FormField>
        <FormField label="Situación legal">
          <select
            name="legalStatus"
            value={formData.legalStatus}
            onChange={onChange}
            className={formInputClass(false, 'bg-white')}
          >
            <option value="MENOR">Menor de edad</option>
            <option value="MAYOR">Mayor de edad</option>
            <option value="EMANCIPADO">Emancipado</option>
          </select>
        </FormField>
        <FormField label="Preferencia de circulares">
          <select
            name="circularPreference"
            value={formData.circularPreference}
            onChange={onChange}
            className={formInputClass(false, 'bg-white')}
          >
            <option value="EMAIL">E-Mail</option>
            <option value="CORREO_POSTAL">Correo Postal</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 bg-[#f8f9fc] p-4 rounded-xl border border-slate-200/80">
        <FormField label="Dirección" required error={fieldErrors.streetAddress} className="md:col-span-2">
          <input
            type="text"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={onChange}
            autoComplete="street-address"
            className={formInputClass(Boolean(fieldErrors.streetAddress))}
          />
        </FormField>
        <FormField label="Número">
          <input
            type="text"
            name="streetNumber"
            value={formData.streetNumber}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.streetNumber))}
          />
        </FormField>
        <FormField label="Código postal" required error={fieldErrors.postalCode}>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            inputMode="numeric"
            maxLength={5}
            className={formInputClass(Boolean(fieldErrors.postalCode))}
          />
        </FormField>
        <FormField label="Municipio" required error={fieldErrors.municipality}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Teléfono del tutor 1" required error={fieldErrors.parent1Phone}>
          <input
            type="tel"
            name="parent1Phone"
            value={formData.parent1Phone}
            onChange={onChange}
            autoComplete="tel"
            inputMode="tel"
            className={formInputClass(Boolean(fieldErrors.parent1Phone))}
          />
        </FormField>
        <FormField label="Correo del tutor 1" required error={fieldErrors.parent1Email}>
          <input
            type="email"
            name="parent1Email"
            value={formData.parent1Email}
            onChange={onChange}
            autoComplete="email"
            className={formInputClass(Boolean(fieldErrors.parent1Email))}
          />
        </FormField>
        <FormField label="Teléfono del tutor 2" error={fieldErrors.parent2Phone}>
          <input
            type="tel"
            name="parent2Phone"
            value={formData.parent2Phone}
            onChange={onChange}
            inputMode="tel"
            className={formInputClass(Boolean(fieldErrors.parent2Phone))}
          />
        </FormField>
        <FormField label="Correo del tutor 2" error={fieldErrors.parent2Email}>
          <input
            type="email"
            name="parent2Email"
            value={formData.parent2Email}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.parent2Email))}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={`DNI del tutor 1 (${applicant.parent1FirstName})`} required error={fieldErrors.parent1Dni}>
          <input
            type="text"
            name="parent1Dni"
            value={formData.parent1Dni}
            onChange={onChange}
            placeholder="12345678A"
            className={formInputClass(Boolean(fieldErrors.parent1Dni), 'uppercase')}
          />
        </FormField>
        <FormField label="DNI del tutor 2" required={formData.custodyType === 'CUSTODIA_CONJUNTA'} hint={formData.custodyType === 'CUSTODIA_CONJUNTA' ? undefined : 'Opcional'} error={fieldErrors.parent2Dni}>
          <input
            type="text"
            name="parent2Dni"
            value={formData.parent2Dni}
            onChange={onChange}
            className={formInputClass(Boolean(fieldErrors.parent2Dni), 'uppercase')}
          />
        </FormField>
        <FormField label="Estado civil de los padres">
          <input
            type="text"
            name="parentsMaritalStatus"
            value={formData.parentsMaritalStatus}
            onChange={onChange}
            className={formInputClass()}
          />
        </FormField>
        <FormField label="Tipo de custodia">
          <select
            name="custodyType"
            value={formData.custodyType}
            onChange={onChange}
            className={formInputClass(false, 'bg-white')}
          >
            <option value="SIN_ESPECIFICAR">Estándar</option>
            <option value="CUSTODIA_UNICA">Custodia Única (1 firma)</option>
            <option value="CUSTODIA_CONJUNTA">Custodia Conjunta (2 firmas)</option>
            <option value="TUTELA_LEGAL">Tutela Legal</option>
          </select>
        </FormField>
      </div>
    </FormSection>
  );
}