import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { applicationsApi, type CreateApplicationPayload } from '../services/api';
import { validateSolicitudForm, type SolicitudFieldErrors } from '../utils/scoutValidators';
import CriteriosSection from '../components/solicitud/CriteriosSection';
import EducandoSection from '../components/solicitud/EducandoSection';
import FamilySection from '../components/solicitud/FamilySection';
import SolicitudSuccess from '../components/solicitud/SolicitudSuccess';
import {
  buildSolicitudSubmissionPayload,
  clearLegacySolicitudDraftStorage,
  createIdempotencyKey,
  createInitialFormState,
  findFirstInvalidSolicitudField,
  getOrderedSolicitudErrors,
  getSolicitudFieldId,
  SECOND_PARENT_FIELDS,
} from '../components/solicitud/solicitudForm';
import FormAlert from '../components/shared/forms/FormAlert';

interface FamilySiblingContext {
  familyUnitId?: string;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent2FirstName?: string;
  parent2LastName?: string;
  parent2Phone?: string;
  parent2Email?: string;
  showSecondParent: boolean;
}

const VALIDATABLE_FIELDS: ReadonlyArray<keyof CreateApplicationPayload> = [
  'childFirstName',
  'childLastName1',
  'childLastName2',
  'noSecondLastNameJustification',
  'childBirthDate',
  'parent1FirstName',
  'parent1LastName',
  'parent1Phone',
  'parent1Email',
  'parent2Phone',
  'parent2Email',
  'familyMemberDetails',
  'originGroupDetails',
];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToTopAccessible(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

export default function SolicitudPage() {
  const [formData, setFormData] = useState<CreateApplicationPayload>(() =>
    createInitialFormState(),
  );
  const [showSecondParent, setShowSecondParent] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<SolicitudFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof CreateApplicationPayload, boolean>>
  >({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedChildren, setSubmittedChildren] = useState<
    Array<{ name: string; branch: string }>
  >([]);
  const [lastFamilyContext, setLastFamilyContext] = useState<FamilySiblingContext | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const idempotencyKeyRef = useRef<string>('');

  useEffect(() => {
    clearLegacySolicitudDraftStorage();
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }
  }, []);

  const liveValidationErrors = useMemo(
    () => validateSolicitudForm(formData, showSecondParent),
    [formData, showSecondParent],
  );

  const validFields = useMemo(() => {
    const valid: Partial<Record<keyof CreateApplicationPayload, boolean>> = {};
    for (const field of VALIDATABLE_FIELDS) {
      if (field === 'childLastName2' && formData.hasNoSecondLastName) continue;
      if (field === 'noSecondLastNameJustification' && !formData.hasNoSecondLastName) continue;
      if (field === 'familyMemberDetails' && !formData.hasFamilyInGroup) continue;
      if (field === 'originGroupDetails' && !formData.comesFromOtherGroup) continue;
      if ((field === 'parent2Phone' || field === 'parent2Email') && !showSecondParent) continue;

      const raw = formData[field];
      const hasValue = typeof raw === 'string' && raw.trim().length > 0;
      if (hasValue && !liveValidationErrors[field] && !fieldErrors[field]) {
        valid[field] = true;
      }
    }
    return valid;
  }, [formData, liveValidationErrors, fieldErrors, showSecondParent]);

  const orderedErrors = useMemo(() => getOrderedSolicitudErrors(fieldErrors), [fieldErrors]);

  const hasAnyUserInput = useMemo(
    () =>
      Boolean(
        formData.childFirstName ||
          formData.childLastName1 ||
          formData.childLastName2 ||
          formData.hasNoSecondLastName ||
          formData.noSecondLastNameJustification ||
          formData.childBirthDate ||
          formData.parent1FirstName ||
          formData.parent1LastName ||
          formData.parent1Phone ||
          formData.parent1Email ||
          formData.parent2FirstName ||
          formData.parent2LastName ||
          formData.parent2Phone ||
          formData.parent2Email ||
          formData.motivation ||
          formData.hasFamilyInGroup ||
          formData.familyMemberDetails ||
          formData.comesFromOtherGroup ||
          formData.originGroupDetails,
      ),
    [formData],
  );

  const focusAndScrollToField = (field: keyof CreateApplicationPayload) => {
    if (SECOND_PARENT_FIELDS.has(field) && !showSecondParent) {
      setShowSecondParent(true);
    }

    if (typeof window === 'undefined') return;

    const locateAndFocus = () => {
      const targetEl =
        document.getElementById(getSolicitudFieldId(field)) ??
        document.querySelector<HTMLElement>(`[name="${String(field)}"]`);

      if (!targetEl) return;

      targetEl.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });

      if (
        typeof targetEl.focus === 'function' &&
        !('disabled' in targetEl && (targetEl as HTMLInputElement).disabled)
      ) {
        try {
          targetEl.focus({ preventScroll: true });
        } catch {
          targetEl.focus();
        }
      }
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(locateAndFocus);
    });
  };

  const resetToEmptyForm = (keepSuccessHistory = false) => {
    clearLegacySolicitudDraftStorage();
    idempotencyKeyRef.current = createIdempotencyKey();
    setFormData(createInitialFormState());
    setShowSecondParent(false);
    setFieldErrors({});
    setTouchedFields({});
    setHasSubmitted(false);
    setServerError(null);
    if (!keepSuccessHistory) {
      setSubmittedChildren([]);
      setLastFamilyContext(null);
      setShowSuccessScreen(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof CreateApplicationPayload;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    idempotencyKeyRef.current = createIdempotencyKey();

    const nextFormData: CreateApplicationPayload = (() => {
      if (fieldName === 'hasNoSecondLastName' && val === true) {
        return { ...formData, hasNoSecondLastName: true, childLastName2: '' };
      }
      if (fieldName === 'hasNoSecondLastName' && val === false) {
        return { ...formData, hasNoSecondLastName: false, noSecondLastNameJustification: '' };
      }
      return { ...formData, [fieldName]: val };
    })();

    setFormData(nextFormData);
    if (serverError) setServerError(null);

    const nextLiveErrors = validateSolicitudForm(nextFormData, showSecondParent);

    setFieldErrors((prev) => {
      const next = { ...prev };

      if (fieldName === 'hasNoSecondLastName') {
        delete next.childLastName2;
        delete next.noSecondLastNameJustification;
        return next;
      }

      if (fieldName === 'hasFamilyInGroup' && val === false) {
        delete next.familyMemberDetails;
        return next;
      }

      if (fieldName === 'comesFromOtherGroup' && val === false) {
        delete next.originGroupDetails;
        return next;
      }

      if (!nextLiveErrors[fieldName]) {
        delete next[fieldName];
      } else if (hasSubmitted || prev[fieldName]) {
        next[fieldName] = nextLiveErrors[fieldName];
      }

      return next;
    });
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const fieldName = e.target.name as keyof CreateApplicationPayload;
    if (!fieldName) return;

    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));

    const rawValue = formData[fieldName];
    const hasEnteredText = typeof rawValue === 'string' && rawValue.trim().length > 0;
    const currentError = liveValidationErrors[fieldName];

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (!currentError) {
        delete next[fieldName];
      } else if (hasSubmitted || hasEnteredText) {
        next[fieldName] = currentError;
      }
      return next;
    });
  };

  const handleToggleSecondParent = (checked: boolean) => {
    setShowSecondParent(checked);
    if (!checked) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.parent2Phone;
        delete next.parent2Email;
        return next;
      });
    } else if (hasSubmitted) {
      const nextErrors = validateSolicitudForm(formData, true);
      setFieldErrors((prev) => ({
        ...prev,
        parent2Phone: nextErrors.parent2Phone,
        parent2Email: nextErrors.parent2Email,
      }));
    }
  };

  const handleClearDraft = () => {
    resetToEmptyForm(false);
    scrollToTopAccessible();
  };

  const handleAddSibling = () => {
    const lastChild = submittedChildren[submittedChildren.length - 1];
    clearLegacySolicitudDraftStorage();
    idempotencyKeyRef.current = createIdempotencyKey();

    const base = createInitialFormState();
    if (lastFamilyContext) {
      setFormData({
        ...base,
        familyUnitId: lastFamilyContext.familyUnitId ?? base.familyUnitId,
        parent1FirstName: lastFamilyContext.parent1FirstName,
        parent1LastName: lastFamilyContext.parent1LastName,
        parent1Phone: lastFamilyContext.parent1Phone,
        parent1Email: lastFamilyContext.parent1Email,
        parent2FirstName: lastFamilyContext.parent2FirstName ?? '',
        parent2LastName: lastFamilyContext.parent2LastName ?? '',
        parent2Phone: lastFamilyContext.parent2Phone ?? '',
        parent2Email: lastFamilyContext.parent2Email ?? '',
        hasFamilyInGroup: true,
        familyMemberDetails: lastChild ? `Hermano/a de ${lastChild.name}` : '',
      });
      setShowSecondParent(lastFamilyContext.showSecondParent);
    } else {
      setFormData({
        ...base,
        hasFamilyInGroup: true,
        familyMemberDetails: lastChild ? `Hermano/a de ${lastChild.name}` : '',
      });
      setShowSecondParent(false);
    }

    setFieldErrors({});
    setTouchedFields({});
    setHasSubmitted(false);
    setServerError(null);
    setShowSuccessScreen(false);
    scrollToTopAccessible();
  };

  const handleStartFreshFromSuccess = () => {
    resetToEmptyForm(false);
    scrollToTopAccessible();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    setHasSubmitted(true);

    const validationErrors = validateSolicitudForm(formData, showSecondParent);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const firstInvalidField = findFirstInvalidSolicitudField(validationErrors);
      if (firstInvalidField) {
        focusAndScrollToField(firstInvalidField);
      } else {
        scrollToTopAccessible();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = createIdempotencyKey();
      }
      const payload = buildSolicitudSubmissionPayload(
        formData,
        showSecondParent,
        idempotencyKeyRef.current,
      );

      const result = await applicationsApi.submitApplication(payload);
      clearLegacySolicitudDraftStorage();

      setLastFamilyContext({
        familyUnitId: result.familyUnitId ?? formData.familyUnitId,
        parent1FirstName: formData.parent1FirstName.trim(),
        parent1LastName: formData.parent1LastName.trim(),
        parent1Phone: formData.parent1Phone.replace(/\s+/g, ''),
        parent1Email: formData.parent1Email.trim(),
        parent2FirstName: showSecondParent ? formData.parent2FirstName?.trim() || '' : '',
        parent2LastName: showSecondParent ? formData.parent2LastName?.trim() || '' : '',
        parent2Phone: showSecondParent ? formData.parent2Phone?.replace(/\s+/g, '') || '' : '',
        parent2Email: showSecondParent ? formData.parent2Email?.trim() || '' : '',
        showSecondParent,
      });

      setSubmittedChildren((prev) => [
        ...prev,
        {
          name: `${result.childFirstName} ${result.childLastName}`,
          branch: result.calculatedBranch,
        },
      ]);

      // Limpiar completamente el formulario tras confirmar el envío exitoso
      resetToEmptyForm(true);
      setShowSuccessScreen(true);
      scrollToTopAccessible();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado al enviar la solicitud.');
      scrollToTopAccessible();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccessScreen) {
    return (
      <SolicitudSuccess
        submittedChildren={submittedChildren}
        onAddSibling={handleAddSibling}
        onStartFresh={handleStartFreshFromSuccess}
      />
    );
  }

  const touchedCount = Object.values(touchedFields).filter(Boolean).length;

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-[#f8fafd] via-white to-[#f5f7fb] pt-8 pb-16 min-[801px]:pt-12 min-[801px]:pb-24">
      <div className="page-width max-w-4xl">
        <header className="reveal relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#000254] via-[#01317b] to-[#061844] px-6 py-7 sm:px-9 sm:py-9 text-white shadow-[0_20px_50px_-12px_rgba(0,2,84,0.25)] mb-7">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#e22328]/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-5 min-[801px]:flex-row min-[801px]:items-start min-[801px]:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">
                <span className="h-2 w-2 rounded-full bg-[#e22328]" aria-hidden="true" />
                Fase 1 · Solicitud de plaza
              </span>
              <h1 className="mt-3.5 text-[clamp(26px,4vw,40px)] font-extrabold leading-[1.08] tracking-[-0.04em] text-white">
                Solicitud de Entrada al Grupo IV
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-blue-100/85">
                Grupo Scout San José de Calasanz · Montequinto. Completa los datos básicos del educando y de contacto familiar para incorporarte a la lista de espera oficial.
              </p>
            </div>

            {hasAnyUserInput && (
              <button
                type="button"
                onClick={handleClearDraft}
                disabled={isSubmitting}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Limpiar formulario</span>
              </button>
            )}
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-2.5 border-t border-white/15 pt-5 text-[11px] sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3.5 py-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e22328] text-[10px] font-extrabold text-white">
                1
              </span>
              <span className="text-blue-50">Rellenas esta solicitud inicial</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3.5 py-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-extrabold text-white">
                2
              </span>
              <span className="text-blue-50">El Kraal revisa la lista de espera</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3.5 py-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-extrabold text-white">
                3
              </span>
              <span className="text-blue-50">Aviso directo por WhatsApp si hay plaza</span>
            </div>
          </div>
        </header>

        {(serverError || orderedErrors.length > 0) && (
          <div className="mb-6 animate-sec-expand">
            <FormAlert>
              {serverError ? (
                <>
                  <p className="font-bold text-rose-950">No se pudo completar el envío</p>
                  <p className="mt-1">{serverError}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-rose-950">
                    Por favor, revisa los {orderedErrors.length}{' '}
                    {orderedErrors.length === 1 ? 'campo señalado' : 'campos señalados'} antes de continuar:
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Campos con error">
                    {orderedErrors.map((item) => (
                      <li key={String(item.field)}>
                        <button
                          type="button"
                          onClick={() => focusAndScrollToField(item.field)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100/60"
                        >
                          <span>{item.label}</span>
                          <ArrowRight size={11} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </FormAlert>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">
          <EducandoSection
            formData={formData}
            fieldErrors={fieldErrors}
            validFields={validFields}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <FamilySection
            formData={formData}
            fieldErrors={fieldErrors}
            validFields={validFields}
            showSecondParent={showSecondParent}
            onToggleSecondParent={handleToggleSecondParent}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <CriteriosSection
            formData={formData}
            fieldErrors={fieldErrors}
            validFields={validFields}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_10px_32px_-8px_rgba(0,2,84,0.07)]">
            <div className="flex items-start gap-3 text-xs text-[#53617a]">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#01317b]/[0.08] text-[#01317b]"
                aria-hidden="true"
              >
                <ShieldCheck size={18} />
              </span>
              <div className="space-y-0.5">
                <p className="font-semibold text-[#000254]">
                  Los campos marcados con <span className="text-rose-600">*</span> son obligatorios
                </p>
                <p className="leading-relaxed">
                  Para proteger tu privacidad en dispositivos compartidos, los datos no se almacenan en el navegador entre solicitudes.
                  {touchedCount > 0 && orderedErrors.length === 0 && (
                    <span className="ml-1 inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 size={12} aria-hidden="true" />
                      Revisión en curso
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="inline-flex min-h-[48px] w-full sm:w-auto shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#01317b] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(1,49,123,0.24),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-150 hover:bg-[#000254] hover:shadow-[0_12px_28px_rgba(0,2,84,0.3)] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-3 focus-visible:outline-[#01317b]/30 focus-visible:outline-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                  <span>Validando y enviando…</span>
                </>
              ) : (
                <>
                  <Send size={16} aria-hidden="true" />
                  <span>Enviar Solicitud de Entrada</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
