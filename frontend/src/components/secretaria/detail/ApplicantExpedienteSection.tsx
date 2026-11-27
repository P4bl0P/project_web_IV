import { Users } from 'lucide-react';
import type { ApplicantRecord } from '../../../services/api';
import DatePicker from '../../shared/forms/DatePicker';
import FormField from '../../shared/forms/FormField';
import { formCheckboxClass, formInputClass } from '../../shared/forms/formStyles';
import { getStatusVisualConfig } from '../secretariaTokens';
import { RELATIONSHIP_OPTIONS, type UnifiedFormState } from './applicantDetailForm';

interface ApplicantExpedienteSectionProps {
  detail: ApplicantRecord;
  formState: UnifiedFormState;
  canUpdate: boolean;
  canEditIdentity: boolean;
  canEditCriteria: boolean;
  isCensusEditable: boolean;
  updateField: <K extends keyof UnifiedFormState>(key: K, value: UnifiedFormState[K]) => void;
  onSelectRecord: (id: string) => void;
}

export default function ApplicantExpedienteSection({
  detail,
  formState,
  canUpdate,
  canEditIdentity,
  canEditCriteria,
  isCensusEditable,
  updateField,
  onSelectRecord,
}: ApplicantExpedienteSectionProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
            Datos del educando
          </h3>
          {detail.status === 'INSCRIPCION_COMPLETADA' && (
            <span className="text-[11px] text-slate-500">
              Inscripción firmada por la familia · Si necesita corrección, renueva el enlace.
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Nombre">
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formState.childFirstName}
              onChange={(e) => updateField('childFirstName', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Primer apellido">
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formState.childLastName1}
              onChange={(e) => updateField('childLastName1', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Segundo apellido">
            <input
              type="text"
              disabled={!canEditIdentity || formState.hasNoSecondLastName}
              value={formState.hasNoSecondLastName ? '' : formState.childLastName2}
              onChange={(e) => updateField('childLastName2', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Fecha de nacimiento">
            <DatePicker
              name="childBirthDate"
              disabled={!canEditIdentity}
              value={formState.childBirthDate}
              onValueChange={(iso) => updateField('childBirthDate', iso)}
            />
          </FormField>

          {(isCensusEditable || detail.gender) && (
            <FormField label="Género">
              <select
                disabled={!isCensusEditable || !canUpdate}
                value={formState.gender}
                onChange={(e) =>
                  updateField(
                    'gender',
                    e.target.value as 'MASCULINO' | 'FEMENINO' | '',
                  )
                }
                className={formInputClass(false, 'bg-white')}
              >
                <option value="">Selecciona género…</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </FormField>
          )}
        </div>

        {canEditIdentity && (
          <div className="space-y-2 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.hasNoSecondLastName}
                onChange={(e) => {
                  updateField('hasNoSecondLastName', e.target.checked);
                  if (e.target.checked) updateField('childLastName2', '');
                }}
                className={formCheckboxClass}
              />
              <span>Sin segundo apellido (excepción justificada)</span>
            </label>
            {formState.hasNoSecondLastName && (
              <FormField label="Justificación">
                <input
                  type="text"
                  value={formState.noSecondLastNameJustification}
                  onChange={(e) =>
                    updateField('noSecondLastNameJustification', e.target.value)
                  }
                  className={formInputClass()}
                />
              </FormField>
            )}
          </div>
        )}
      </section>

      {(isCensusEditable || detail.streetAddress) && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
            Domicilio postal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <FormField label="Dirección principal" className="sm:col-span-3">
              <input
                type="text"
                disabled={!isCensusEditable || !canUpdate}
                value={formState.streetAddress}
                onChange={(e) => updateField('streetAddress', e.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Número">
              <input
                type="text"
                disabled={!isCensusEditable || !canUpdate}
                value={formState.streetNumber}
                onChange={(e) => updateField('streetNumber', e.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Piso / Puerta" className="sm:col-span-2">
              <input
                type="text"
                disabled={!isCensusEditable || !canUpdate}
                value={formState.apartmentDoor}
                onChange={(e) => updateField('apartmentDoor', e.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Código postal">
              <input
                type="text"
                maxLength={5}
                disabled={!isCensusEditable || !canUpdate}
                value={formState.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Localidad" className="sm:col-span-3">
              <input
                type="text"
                disabled={!isCensusEditable || !canUpdate}
                value={formState.municipality}
                onChange={(e) => updateField('municipality', e.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Provincia" className="sm:col-span-2">
              <input
                type="text"
                disabled={!isCensusEditable || !canUpdate}
                value={formState.province}
                onChange={(e) => updateField('province', e.target.value)}
                className={formInputClass()}
              />
            </FormField>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
          Tutores de contacto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2.5 rounded-xl bg-[#f8f9fc] p-3 border border-slate-200/70">
            <p className="text-[11px] font-bold text-slate-700">Tutor principal</p>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Nombre">
                <input
                  type="text"
                  disabled={!canEditIdentity}
                  value={formState.parent1FirstName}
                  onChange={(e) => updateField('parent1FirstName', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Apellidos">
                <input
                  type="text"
                  disabled={!canEditIdentity}
                  value={formState.parent1LastName}
                  onChange={(e) => updateField('parent1LastName', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Teléfono">
                <input
                  type="tel"
                  disabled={!canEditIdentity}
                  value={formState.parent1Phone}
                  onChange={(e) => updateField('parent1Phone', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  disabled={!canEditIdentity}
                  value={formState.parent1Email}
                  onChange={(e) => updateField('parent1Email', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              {isCensusEditable && (
                <FormField label="Relación con el educando" className="col-span-2">
                  <select
                    disabled={!canUpdate}
                    value={formState.parent1Relationship}
                    onChange={(e) => updateField('parent1Relationship', e.target.value)}
                    className={formInputClass(false, 'bg-white')}
                  >
                    <option value="">Selecciona relación…</option>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl bg-[#f8f9fc] p-3 border border-slate-200/70">
            <p className="text-[11px] font-bold text-slate-700">
              Segundo tutor (opcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Nombre">
                <input
                  type="text"
                  disabled={!canEditIdentity}
                  value={formState.parent2FirstName}
                  onChange={(e) => updateField('parent2FirstName', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Apellidos">
                <input
                  type="text"
                  disabled={!canEditIdentity}
                  value={formState.parent2LastName}
                  onChange={(e) => updateField('parent2LastName', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Teléfono">
                <input
                  type="tel"
                  disabled={!canEditIdentity}
                  value={formState.parent2Phone}
                  onChange={(e) => updateField('parent2Phone', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  disabled={!canEditIdentity}
                  value={formState.parent2Email}
                  onChange={(e) => updateField('parent2Email', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              {isCensusEditable && (
                <FormField label="Relación con el educando" className="col-span-2">
                  <select
                    disabled={!canUpdate}
                    value={formState.parent2Relationship}
                    onChange={(e) => updateField('parent2Relationship', e.target.value)}
                    className={formInputClass(false, 'bg-white')}
                  >
                    <option value="">Selecciona relación…</option>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
          Criterios de prioridad, motivación y notas internas del Kraal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEditCriteria}
              checked={formState.hasFamilyInGroup}
              onChange={(e) => updateField('hasFamilyInGroup', e.target.checked)}
              className={formCheckboxClass}
            />
            <span>
              <strong>Familiar en el grupo (+100)</strong>
            </span>
          </label>
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEditCriteria}
              checked={formState.socialInclusionPriority}
              onChange={(e) =>
                updateField('socialInclusionPriority', e.target.checked)
              }
              className={formCheckboxClass}
            />
            <span>
              <strong>Prioridad inclusión (+50)</strong>
            </span>
          </label>
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEditCriteria}
              checked={formState.comesFromOtherGroup}
              onChange={(e) => updateField('comesFromOtherGroup', e.target.checked)}
              className={formCheckboxClass}
            />
            <span>
              <strong>Otro grupo scout (+25)</strong>
            </span>
          </label>
        </div>

        {formState.hasFamilyInGroup && (
          <FormField label="Detalles del familiar en el Grupo IV">
            <input
              type="text"
              disabled={!canEditCriteria}
              value={formState.familyMemberDetails}
              onChange={(e) => updateField('familyMemberDetails', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
        )}

        {formState.comesFromOtherGroup && (
          <FormField label="Grupo scout de procedencia">
            <input
              type="text"
              disabled={!canEditCriteria}
              value={formState.originGroupDetails}
              onChange={(e) => updateField('originGroupDetails', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
        )}

        <FormField label="Motivación de la familia">
          <textarea
            rows={2}
            disabled={!canEditCriteria}
            value={formState.motivation}
            onChange={(e) => updateField('motivation', e.target.value)}
            className={formInputClass(false, 'resize-y')}
          />
        </FormField>

        <FormField label="Notas internas del Kraal (privadas)">
          <textarea
            rows={3}
            disabled={!canEditCriteria}
            value={formState.kraalInternalNotes}
            onChange={(e) => updateField('kraalInternalNotes', e.target.value)}
            placeholder="Observaciones internas de valoración del Kraal..."
            className={formInputClass(false, 'resize-y')}
          />
        </FormField>
      </section>

      {detail.familySiblings && detail.familySiblings.length > 0 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
            <Users size={13} /> Hermanos / expedientes vinculados a la misma familia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {detail.familySiblings.map((sib) => (
              <button
                key={sib.id}
                type="button"
                onClick={() => onSelectRecord(sib.id)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2 text-left text-xs hover:border-[#01317b] transition cursor-pointer"
              >
                <span className="font-semibold text-[#0c1933]">
                  {sib.childFirstName} {sib.childLastName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {sib.calculatedBranch} · {getStatusVisualConfig(sib.status).label}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
