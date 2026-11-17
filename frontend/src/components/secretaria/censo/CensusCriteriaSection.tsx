import type { DirectCensusPayload } from '../../../services/api';
import CensusField from './CensusField';
import { censusInputClass } from './censusStyles';
import type { CensusChangeHandler, CensusFieldErrors } from './censusForm';

interface Props {
  formData: DirectCensusPayload;
  fieldErrors: CensusFieldErrors;
  onChange: CensusChangeHandler;
}

export default function CensusCriteriaSection({ formData, fieldErrors, onChange }: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Información complementaria</h3>
        <p className="mt-1 text-xs text-slate-500">Estos datos son opcionales salvo que actives uno de los criterios.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" name="hasFamilyInGroup" checked={formData.hasFamilyInGroup} onChange={onChange} className="mt-0.5 h-4 w-4 rounded text-indigo-600" />
            <span>Familiar directo en el Grupo IV</span>
          </label>
          {formData.hasFamilyInGroup && (
            <CensusField label="Nombre y parentesco" required error={fieldErrors.familyMemberDetails} className="mt-3">
              <input name="familyMemberDetails" value={formData.familyMemberDetails} onChange={onChange} aria-invalid={Boolean(fieldErrors.familyMemberDetails)} className={censusInputClass(Boolean(fieldErrors.familyMemberDetails))} />
            </CensusField>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" name="comesFromOtherGroup" checked={formData.comesFromOtherGroup} onChange={onChange} className="mt-0.5 h-4 w-4 rounded text-indigo-600" />
            <span>Procede de otro grupo scout</span>
          </label>
          {formData.comesFromOtherGroup && (
            <CensusField label="Grupo de procedencia" required error={fieldErrors.originGroupDetails} className="mt-3">
              <input name="originGroupDetails" value={formData.originGroupDetails} onChange={onChange} aria-invalid={Boolean(fieldErrors.originGroupDetails)} className={censusInputClass(Boolean(fieldErrors.originGroupDetails))} />
            </CensusField>
          )}
        </div>
        <CensusField label="Motivación y observaciones" className="md:col-span-2">
          <textarea name="motivation" value={formData.motivation} onChange={onChange} rows={3} className={censusInputClass(false, 'resize-y')} />
        </CensusField>
      </div>
    </section>
  );
}
