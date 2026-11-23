import type { ChangeEvent } from 'react';
import { AlertTriangle, Compass, Sparkles } from 'lucide-react';
import type { CreateApplicationPayload } from '../../services/api';
import { getTodayIsoDate } from '../../utils/dateUtils';
import { calculatePreviewBranch, type SolicitudFieldErrors } from '../../utils/scoutValidators';
import DatePicker from '../shared/forms/DatePicker';
import FormField from '../shared/forms/FormField';
import FormSection from '../shared/forms/FormSection';
import { formCheckboxClass, formInputClass } from '../shared/forms/formStyles';

interface Props {
  formData: CreateApplicationPayload;
  fieldErrors: SolicitudFieldErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function EducandoSection({ formData, fieldErrors, onChange }: Props) {
  const branchPreview = calculatePreviewBranch(formData.childBirthDate);

  return (
    <FormSection>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
        <Compass className="text-indigo-600" size={20} /> 1. Datos del Niño, Niña o Joven
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre" required error={fieldErrors.childFirstName}>
          <input
            type="text"
            name="childFirstName"
            value={formData.childFirstName}
            onChange={onChange}
            placeholder="Ej. Lucas"
            className={formInputClass(Boolean(fieldErrors.childFirstName))}
          />
        </FormField>

        <FormField label="Primer apellido" required error={fieldErrors.childLastName1}>
          <input
            type="text"
            name="childLastName1"
            value={formData.childLastName1}
            onChange={onChange}
            placeholder="Ej. García"
            className={formInputClass(Boolean(fieldErrors.childLastName1))}
          />
        </FormField>

        <FormField
          label="Segundo apellido"
          required={!formData.hasNoSecondLastName}
          error={fieldErrors.childLastName2}
        >
          <input
            type="text"
            name="childLastName2"
            value={formData.hasNoSecondLastName ? '' : formData.childLastName2 || ''}
            onChange={onChange}
            disabled={Boolean(formData.hasNoSecondLastName)}
            placeholder={formData.hasNoSecondLastName ? 'Sin segundo apellido' : 'Ej. Pérez'}
            className={formInputClass(
              Boolean(fieldErrors.childLastName2),
              formData.hasNoSecondLastName ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : '',
            )}
          />
        </FormField>

        <FormField label="Fecha de nacimiento" required error={fieldErrors.childBirthDate}>
          <DatePicker
            name="childBirthDate"
            value={formData.childBirthDate}
            onChange={onChange}
            required
            hasError={Boolean(fieldErrors.childBirthDate)}
            max={getTodayIsoDate()}
            min={`${new Date().getFullYear() - 25}-01-01`}
            defaultViewYear={new Date().getFullYear() - 10}
            aria-label="Fecha de nacimiento"
          />
        </FormField>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            name="hasNoSecondLastName"
            checked={Boolean(formData.hasNoSecondLastName)}
            onChange={onChange}
            className={formCheckboxClass}
          />
          <span>
            El educando <strong>no dispone de segundo apellido</strong> en su documentación oficial.
          </span>
        </label>

        {formData.hasNoSecondLastName && (
          <FormField
            label="Motivo o justificación"
            required
            error={fieldErrors.noSecondLastNameJustification}
          >
            <input
              type="text"
              name="noSecondLastNameJustification"
              value={formData.noSecondLastNameJustification || ''}
              onChange={onChange}
              placeholder="Ej. Documento extranjero con un único apellido legal"
              className={formInputClass(Boolean(fieldErrors.noSecondLastNameJustification))}
            />
          </FormField>
        )}
      </div>

      {branchPreview && !fieldErrors.childBirthDate && (
        <div
          className={`mt-4 border rounded-xl p-3.5 flex items-center gap-3 ${
            branchPreview.isEligibleAsYouth
              ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          {branchPreview.isEligibleAsYouth ? (
            <Sparkles size={18} className="text-indigo-600 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          )}
          <p className="text-xs sm:text-sm">
            {branchPreview.isEligibleAsYouth ? (
              <>
                En la ronda solar <strong>{branchPreview.solarRoundLabel}</strong> cumple{' '}
                <strong>{branchPreview.age} años</strong> y corresponde a:{' '}
                <strong>{branchPreview.branch}</strong>.
              </>
            ) : branchPreview.isExternalRutas ? (
              <>
                Con <strong>{branchPreview.age} años</strong> en la ronda{' '}
                <strong>{branchPreview.solarRoundLabel}</strong> corresponde a{' '}
                <strong>Rutas</strong> (Agrupación de Rutas, fuera de las ramas gestionadas por el
                Grupo IV).
              </>
            ) : (
              <>
                Con <strong>{branchPreview.age} años</strong> en la ronda{' '}
                <strong>{branchPreview.solarRoundLabel}</strong> corresponde a{' '}
                <strong>{branchPreview.branch}</strong>.
              </>
            )}
          </p>
        </div>
      )}
    </FormSection>
  );
}
