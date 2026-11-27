import { CreditCard, FileDown, HeartPulse, Lock, Sparkles } from 'lucide-react';
import type { ApplicantRecord } from '../../../services/api';
import { formatIsoToHumanShort } from '../../../utils/dateUtils';
import FormField from '../../shared/forms/FormField';
import { formCheckboxClass, formInputClass } from '../../shared/forms/formStyles';
import { SecBadge, SecButton } from '../secretariaTheme';
import type { UnifiedFormState } from './applicantDetailForm';

interface ApplicantEnrollmentSectionProps {
  detail: ApplicantRecord;
  formState: UnifiedFormState;
  canUpdate: boolean;
  canEditFullEnrollment: boolean;
  auroraPreview: Record<string, unknown> | null;
  updateField: <K extends keyof UnifiedFormState>(key: K, value: UnifiedFormState[K]) => void;
  onDownloadPdf: () => void;
  onLoadAuroraPreview: () => void;
}

export default function ApplicantEnrollmentSection({
  detail,
  formState,
  canUpdate,
  canEditFullEnrollment,
  auroraPreview,
  updateField,
  onDownloadPdf,
  onLoadAuroraPreview,
}: ApplicantEnrollmentSectionProps) {
  if (!detail.enrollment) return null;
  const enr = detail.enrollment;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold uppercase tracking-wider text-[#000254]">
            Datos legales, DNI y consentimientos
          </h3>
          <SecButton variant="secondary" size="xs" onClick={onDownloadPdf}>
            <FileDown size={13} /> Descargar PDF oficial
          </SecButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="DNI / NIE del educando">
            <input
              type="text"
              disabled={!canEditFullEnrollment}
              value={formState.childDni}
              onChange={(e) => updateField('childDni', e.target.value)}
              placeholder="Sin DNI"
              className={formInputClass(false, 'uppercase')}
            />
          </FormField>
          <FormField label="Teléfono del educando">
            <input
              type="tel"
              disabled={!canEditFullEnrollment}
              value={formState.childPhone}
              onChange={(e) => updateField('childPhone', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Email del educando">
            <input
              type="email"
              disabled={!canEditFullEnrollment}
              value={formState.childEmail}
              onChange={(e) => updateField('childEmail', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
          <FormField label="Situación legal">
            <select
              disabled={!canEditFullEnrollment}
              value={formState.legalStatus}
              onChange={(e) =>
                updateField(
                  'legalStatus',
                  e.target.value as UnifiedFormState['legalStatus'],
                )
              }
              className={formInputClass(false, 'bg-white')}
            >
              <option value="MENOR">Menor de edad</option>
              <option value="MAYOR">Mayor de edad</option>
              <option value="EMANCIPADO">Emancipado</option>
            </select>
          </FormField>
          <FormField label="Recepción de circulares">
            <select
              disabled={!canEditFullEnrollment}
              value={formState.circularPreference}
              onChange={(e) =>
                updateField(
                  'circularPreference',
                  e.target.value as UnifiedFormState['circularPreference'],
                )
              }
              className={formInputClass(false, 'bg-white')}
            >
              <option value="EMAIL">Correo electrónico</option>
              <option value="CORREO_POSTAL">Correo postal</option>
            </select>
          </FormField>
          <FormField label="Régimen de custodia">
            <select
              disabled={!canEditFullEnrollment}
              value={formState.custodyType}
              onChange={(e) =>
                updateField(
                  'custodyType',
                  e.target.value as UnifiedFormState['custodyType'],
                )
              }
              className={formInputClass(false, 'bg-white')}
            >
              <option value="SIN_ESPECIFICAR">Estándar / Patria potestad</option>
              <option value="CUSTODIA_UNICA">Custodia Única</option>
              <option value="CUSTODIA_CONJUNTA">Custodia Conjunta</option>
              <option value="TUTELA_LEGAL">Tutela Legal</option>
            </select>
          </FormField>
          <FormField label="DNI / NIE Tutor 1">
            <input
              type="text"
              disabled={!canEditFullEnrollment}
              value={formState.parent1Dni}
              onChange={(e) => updateField('parent1Dni', e.target.value)}
              className={formInputClass(false, 'uppercase')}
            />
          </FormField>
          <FormField label="DNI / NIE Tutor 2">
            <input
              type="text"
              disabled={!canEditFullEnrollment}
              value={formState.parent2Dni}
              onChange={(e) => updateField('parent2Dni', e.target.value)}
              className={formInputClass(false, 'uppercase')}
            />
          </FormField>
          <FormField label="Situación familiar / estado civil">
            <input
              type="text"
              disabled={!canEditFullEnrollment}
              value={formState.parentsMaritalStatus}
              onChange={(e) => updateField('parentsMaritalStatus', e.target.value)}
              className={formInputClass()}
            />
          </FormField>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <SecBadge tone={enr.acceptsDataStorage ? 'emerald' : 'rose'}>
            Protección datos: {enr.acceptsDataStorage ? 'Sí' : 'No'}
          </SecBadge>
          <SecBadge tone={enr.acceptsDataTransfer ? 'emerald' : 'rose'}>
            Cesión MSC: {enr.acceptsDataTransfer ? 'Sí' : 'No'}
          </SecBadge>
          <SecBadge tone={enr.authorizesImages ? 'emerald' : 'amber'}>
            Imágenes: {enr.authorizesImages ? 'Autoriza' : 'NO autoriza'}
          </SecBadge>
          <SecBadge tone="neutral">
            Versión v{enr.consentTextVersion || '2026.1'}
          </SecBadge>
        </div>

        {detail.admittedAt && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Alta oficial en censo:</strong>{' '}
              {formatIsoToHumanShort(detail.admittedAt)} · Ronda{' '}
              {detail.censusSolarRound || detail.solarRound} · Rama{' '}
              {detail.censusBranch || detail.calculatedBranch}
            </span>
            {canUpdate && (
              <SecButton variant="secondary" size="xs" onClick={onLoadAuroraPreview}>
                <Sparkles size={12} /> Ver mapeo Aurora
              </SecButton>
            )}
          </div>
        )}

        {auroraPreview && (
          <pre className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-3 text-[11px] overflow-x-auto">
            {JSON.stringify(auroraPreview, null, 2)}
          </pre>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
          <HeartPulse size={14} className="text-rose-600" /> Ficha médica y emergencia
        </h3>
        {enr.medicalAccessRestricted ? (
          <p className="inline-flex items-center gap-1.5 text-slate-500">
            <Lock size={13} /> Acceso restringido: tu perfil solo tiene permiso de lectura general.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Grupo sanguíneo">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.bloodType}
                  onChange={(e) => updateField('bloodType', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Enfermedades crónicas" className="sm:col-span-2">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.chronicDiseases}
                  onChange={(e) => updateField('chronicDiseases', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Alergias" className="sm:col-span-3">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Dolor de cabeza">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.medHeadache}
                  onChange={(e) => updateField('medHeadache', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Fiebre">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.medFever}
                  onChange={(e) => updateField('medFever', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Dolor de estómago">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.medStomach}
                  onChange={(e) => updateField('medStomach', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Dolor de garganta">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.medThroat}
                  onChange={(e) => updateField('medThroat', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Observaciones médicas" className="sm:col-span-2">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.medicalObservations}
                  onChange={(e) => updateField('medicalObservations', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Contacto de emergencia">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.emergencyContactName}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Teléfono de emergencia">
                <input
                  type="tel"
                  disabled={!canEditFullEnrollment}
                  value={formState.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Vínculo emergencia">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.emergencyContactRelationship}
                  onChange={(e) =>
                    updateField('emergencyContactRelationship', e.target.value)
                  }
                  className={formInputClass()}
                />
              </FormField>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEditFullEnrollment}
                checked={formState.authorizesEmergency}
                onChange={(e) => updateField('authorizesEmergency', e.target.checked)}
                className={formCheckboxClass}
              />
              <span>Autorización médica de urgencia activa</span>
            </label>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-[#000254] inline-flex items-center gap-1.5">
          <CreditCard size={14} className="text-[#01317b]" /> Datos bancarios (SEPA)
        </h3>
        {enr.bankAccessRestricted ? (
          <p className="inline-flex items-center gap-1.5 text-slate-500">
            <Lock size={13} /> IBAN enmascarado: {enr.ibanMasked}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Titular de la cuenta">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.accountHolderName}
                  onChange={(e) => updateField('accountHolderName', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="DNI del titular">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.accountHolderDni}
                  onChange={(e) => updateField('accountHolderDni', e.target.value)}
                  className={formInputClass(false, 'uppercase')}
                />
              </FormField>
              <FormField label="IBAN">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.iban}
                  onChange={(e) => updateField('iban', e.target.value)}
                  className={formInputClass(false, 'font-mono uppercase')}
                />
              </FormField>
              <FormField label="Dirección del titular">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.accountHolderAddress}
                  onChange={(e) => updateField('accountHolderAddress', e.target.value)}
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Localidad del titular">
                <input
                  type="text"
                  disabled={!canEditFullEnrollment}
                  value={formState.accountHolderMunicipality}
                  onChange={(e) =>
                    updateField('accountHolderMunicipality', e.target.value)
                  }
                  className={formInputClass()}
                />
              </FormField>
              <FormField label="Código postal del titular">
                <input
                  type="text"
                  maxLength={5}
                  disabled={!canEditFullEnrollment}
                  value={formState.accountHolderPostalCode}
                  onChange={(e) =>
                    updateField('accountHolderPostalCode', e.target.value)
                  }
                  className={formInputClass()}
                />
              </FormField>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEditFullEnrollment}
                checked={formState.authorizesSepa}
                onChange={(e) => updateField('authorizesSepa', e.target.checked)}
                className={formCheckboxClass}
              />
              <span>Orden de domiciliación SEPA autorizada</span>
            </label>
          </div>
        )}
      </section>

      {/* Firmas digitales registradas (siempre en solo lectura por integridad legal) */}
      {(enr.signatureParent1 || enr.signatureParent2) && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#000254]">
            Firmas registradas (solo lectura)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enr.signatureParent1 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8f9fc] p-3 space-y-1.5">
                <p className="font-semibold text-slate-700">
                  Firma 1 · {enr.signer1FullName || detail.parent1FirstName}{' '}
                  ({formatIsoToHumanShort(enr.signedAtParent1)})
                </p>
                <img
                  src={enr.signatureParent1}
                  alt="Firma tutor 1"
                  className="h-24 max-w-full object-contain"
                />
              </div>
            )}
            {enr.signatureParent2 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8f9fc] p-3 space-y-1.5">
                <p className="font-semibold text-slate-700">
                  Firma 2 · {enr.signer2FullName || detail.parent2FirstName}{' '}
                  {enr.signedAtParent2
                    ? `(${formatIsoToHumanShort(enr.signedAtParent2)})`
                    : ''}
                </p>
                <img
                  src={enr.signatureParent2}
                  alt="Firma tutor 2"
                  className="h-24 max-w-full object-contain"
                />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
