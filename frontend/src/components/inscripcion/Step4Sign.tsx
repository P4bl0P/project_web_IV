import type { ChangeEvent } from 'react';
import type { CompleteEnrollmentPayload } from '../../services/api';
import SignatureBox from '../shared/SignatureBox';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass } from '../shared/forms/formStyles';

interface Props {
  applicant: {
    parent1FirstName?: string;
    parent2FirstName?: string | null;
  };
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSign1: (sig: string) => void;
  onSign2: (sig: string) => void;
  readOnly?: boolean;
}

export default function Step4Sign({
  applicant,
  formData,
  onChange,
  onSign1,
  onSign2,
  readOnly = false,
}: Props) {
  const tutor1Label = formData.parent1FirstName || applicant.parent1FirstName || 'Tutor 1';
  const version = formData.consentTextVersion || '2026.1';

  return (
    <FormSection
      title="4. Autorizaciones y firma"
      description={`Revisa cada autorización de forma independiente (documento v${version}) y completa las firmas necesarias.`}
    >
      <div className="space-y-3 bg-[#f8f9fc] p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="acceptsDataStorage"
            checked={formData.acceptsDataStorage}
            onChange={onChange}
            className={formCheckboxClass}
          />
          <span>
            <strong>Tratamiento de Datos Personales (Obligatorio):</strong> Autorizo el tratamiento de datos personales y la participación en las actividades del Grupo Scout IV.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="acceptsDataTransfer"
            checked={formData.acceptsDataTransfer}
            onChange={onChange}
            className={formCheckboxClass}
          />
          <span>
            <strong>Cesión Federativa MSC (Obligatorio):</strong> Autorizo la cesión de datos necesaria al Movimiento Scout Católico para seguros y censo oficial.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
          <input
            type="checkbox"
            name="authorizesImages"
            checked={formData.authorizesImages}
            onChange={onChange}
            className={formCheckboxClass}
          />
          <span>
            <strong>Derechos de Imagen y Vídeos:</strong> Autorizo el uso no comercial de fotografías y vídeos en actividades scouts (desmarcar si NO se autoriza).
          </span>
        </label>
      </div>

      <SignatureBox
        label={`Firma Tutor 1 (${tutor1Label} · DNI ${formData.parent1Dni || 'pendiente'}) *`}
        onChange={onSign1}
        readOnly={readOnly}
        value={formData.signatureParent1}
      />

      {formData.custodyType === 'CUSTODIA_CONJUNTA' && (
        <SignatureBox
          label={`Segunda Firma por Custodia Conjunta (DNI ${formData.parent2Dni || 'pendiente'}) *`}
          onChange={onSign2}
          readOnly={readOnly}
          value={formData.signatureParent2}
        />
      )}
    </FormSection>
  );
}
