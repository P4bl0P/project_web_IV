import type { ChangeEvent } from 'react';
import type { ApplicantRecord, CompleteEnrollmentPayload } from '../../services/api';
import SignatureBox from '../ui/SignatureBox';

interface Props {
  applicant: ApplicantRecord;
  formData: CompleteEnrollmentPayload;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSign1: (sig: string) => void;
  onSign2: (sig: string) => void;
}

export default function Step4Sign({ applicant, formData, onChange, onSign1, onSign2 }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">4. Autorizaciones y Firma</h2>

      <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="acceptsDataStorage"
            checked={formData.acceptsDataStorage}
            onChange={onChange}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600"
          />
          <span>
            <strong>Protección de Datos (Obligatorio):</strong> Autorizo el tratamiento de datos personales y la participación en las actividades del Grupo Scout.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="acceptsDataTransfer"
            checked={formData.acceptsDataTransfer}
            onChange={onChange}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600"
          />
          <span>
            <strong>Cesión MSC (Obligatorio):</strong> Autorizo la cesión federativa al Movimiento Scout Católico para seguros y censo.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
          <input
            type="checkbox"
            name="authorizesImages"
            checked={formData.authorizesImages}
            onChange={onChange}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600"
          />
          <span>
            <strong>Derechos de Imagen:</strong> Autorizo el uso no comercial de fotos y vídeos en actividades scouts (desmarcar si NO se autoriza).
          </span>
        </label>
      </div>

      <SignatureBox
        label={`Firma Tutor 1 (${applicant.parent1FirstName} - DNI ${formData.parent1Dni}) *`}
        onChange={onSign1}
      />

      {formData.custodyType === 'CUSTODIA_CONJUNTA' && (
        <SignatureBox
          label={`Segunda Firma por Custodia Conjunta (DNI ${formData.parent2Dni}) *`}
          onChange={onSign2}
        />
      )}
    </div>
  );
}