import {
  CheckCircle2,
  Send,
  MessageCircle,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  FileCheck2,
  UserCheck,
  FileDown,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { CLOSURE_REASON_LABELS, type ApplicantRecord } from '../../services/api';
import { formatIsoToHumanShort } from '../../utils/dateUtils';
import { evaluateRecordCompleteness, type SecretariaTab } from '../../utils/secretariaSearchFilter';
import { SecBadge, SecButton } from './secretariaTheme';
import { getBranchVisualConfig, secTokens } from './secretariaTokens';

interface Props {
  record: ApplicantRecord;
  index: number;
  activeTab: SecretariaTab;
  safeModeWhatsApp: boolean;
  copiedId: string | null;
  canUpdate: boolean;
  onValidate: (record: ApplicantRecord) => void;
  onOfferSpot: (record: ApplicantRecord) => void;
  onRenewToken: (record: ApplicantRecord) => void;
  onAdmitCensus: (record: ApplicantRecord) => void;
  onReactivate: (record: ApplicantRecord) => void;
  onOpenWhatsApp: (record: ApplicantRecord) => void;
  onCopyLink: (record: ApplicantRecord) => void;
  onDownloadPdf: (record: ApplicantRecord) => void;
  onViewDetail: (record: ApplicantRecord) => void;
}

const GENDER_SHORT_LABELS: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
};

export default function ApplicantCard({
  record,
  index,
  activeTab,
  safeModeWhatsApp,
  copiedId,
  canUpdate,
  onValidate,
  onOfferSpot,
  onRenewToken,
  onAdmitCensus,
  onReactivate,
  onOpenWhatsApp,
  onCopyLink,
  onDownloadPdf,
  onViewDetail,
}: Props) {
  const branchConfig = getBranchVisualConfig(record.calculatedBranch);

  const birthDate =
    formatIsoToHumanShort(record.childBirthDate) ||
    new Date(record.childBirthDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const requestedDate =
    formatIsoToHumanShort(record.createdAt) ||
    new Date(record.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const admittedDate =
    activeTab === 'CENSUS' && record.admittedAt
      ? formatIsoToHumanShort(record.admittedAt) ||
        new Date(record.admittedAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;

  const completeness = evaluateRecordCompleteness(record);
  const hasDuplicates = Boolean(record.potentialDuplicateIds && record.potentialDuplicateIds.length > 0);

  const hasPriorityBadges =
    record.hasFamilyInGroup ||
    record.comesFromOtherGroup ||
    record.socialInclusionPriority ||
    activeTab === 'OFFERED' ||
    activeTab === 'ARCHIVED' ||
    completeness.isIncomplete ||
    hasDuplicates;

  return (
    <article
      className={`${secTokens.cardInteractive} p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
    >
      {/* Bloque izquierdo: Identidad, etiquetas de prioridad/estado y metadatos */}
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {(activeTab === 'INITIAL' || activeTab === 'WAITLIST') && (
            <span className="inline-flex items-center justify-center h-6 min-w-7 px-2 rounded-lg bg-[#000254] text-white text-[11px] font-bold tracking-tight">
              #{index + 1}
            </span>
          )}
          <button
            type="button"
            onClick={() => onViewDetail(record)}
            className="text-left text-[15px] sm:text-base font-bold tracking-tight text-[#0c1933] hover:text-[#01317b] hover:underline cursor-pointer"
          >
            {record.childFirstName} {record.childLastName}
          </button>
          <SecBadge tone={branchConfig.tone} dotColor={branchConfig.dotColor}>
            {branchConfig.name}
          </SecBadge>
          {record.gender && (
            <SecBadge tone="neutral">
              {GENDER_SHORT_LABELS[record.gender] || record.gender}
            </SecBadge>
          )}
        </div>

        {hasPriorityBadges && (
          <div className="flex flex-wrap items-center gap-1.5">
            {record.hasFamilyInGroup && (
              <SecBadge tone="purple">
                <Sparkles size={11} className="shrink-0" />
                <span>Familiar: {record.familyMemberDetails || 'Sí'}</span>
              </SecBadge>
            )}
            {record.comesFromOtherGroup && (
              <SecBadge tone="teal">
                <ShieldAlert size={11} className="shrink-0" />
                <span>Traslado: {record.originGroupDetails}</span>
              </SecBadge>
            )}
            {record.socialInclusionPriority && (
              <SecBadge tone="rose">
                <HeartHandshake size={11} className="shrink-0" />
                <span>Prioridad de inclusión</span>
              </SecBadge>
            )}
            {activeTab === 'OFFERED' && record.status === 'PLAZA_OFERTADA' && (
              <SecBadge tone={record.tokenExpired ? 'rose' : 'blue'}>
                <Clock size={11} className="shrink-0" />
                <span>
                  {record.tokenExpired
                    ? 'Enlace caducado · Requiere renovación'
                    : 'Enlace activo · Pendiente de familia'}
                </span>
              </SecBadge>
            )}
            {record.status === 'INSCRIPCION_COMPLETADA' && (
              <SecBadge tone="emerald">
                <FileCheck2 size={11} className="shrink-0" />
                <span>
                  {record.reviewedAt ? 'Inscripción revisada · Lista para censar' : 'Inscripción rellenada'}
                </span>
              </SecBadge>
            )}
            {activeTab === 'ARCHIVED' && record.closureReason && (
              <SecBadge tone="neutral">
                <span>{CLOSURE_REASON_LABELS[record.closureReason]}</span>
              </SecBadge>
            )}
            {hasDuplicates && (
              <SecBadge tone="rose">
                <AlertTriangle size={11} className="shrink-0" />
                <span>Posible duplicado</span>
              </SecBadge>
            )}
            {completeness.isIncomplete && (
              <SecBadge
                tone="amber"
                title={`Faltan: ${completeness.missingFields.join(', ')}`}
              >
                <AlertTriangle size={11} className="shrink-0" />
                <span>Datos incompletos</span>
              </SecBadge>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1.5 leading-relaxed">
          <span className="inline-flex items-center gap-1">
            <strong className="font-semibold text-slate-700">Nacimiento:</strong> {birthDate}{' '}
            <span className="text-slate-400">({record.currentAge} años)</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <strong className="font-semibold text-slate-700">Tutor 1:</strong>{' '}
            {record.parent1FirstName} {record.parent1LastName}
          </span>

          {record.parent2FirstName && (
            <span className="inline-flex items-center gap-1">
              <strong className="font-semibold text-slate-700">Tutor 2:</strong>{' '}
              {record.parent2FirstName} {record.parent2LastName || ''}
            </span>
          )}

          {record.parent1Phone && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Phone size={11} className="text-slate-400 shrink-0" />
              <span>{record.parent1Phone}</span>
            </span>
          )}

          {record.parent1Email && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Mail size={11} className="text-slate-400 shrink-0" />
              <span className="truncate max-w-[220px]">{record.parent1Email}</span>
            </span>
          )}

          {activeTab !== 'CENSUS' && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Calendar size={11} className="text-slate-400 shrink-0" />
              <span>Solicitado: {requestedDate}</span>
            </span>
          )}

          {admittedDate && (
            <span className="inline-flex items-center gap-1 text-[#01317b] font-semibold">
              <Calendar size={11} className="shrink-0" />
              <span>Alta censo: {admittedDate}</span>
            </span>
          )}

          {record.municipality && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <MapPin size={11} className="shrink-0" />
              <span>{record.municipality}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bloque derecho: Acción principal del flujo + acceso unificado al expediente */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        {canUpdate && activeTab === 'INITIAL' && record.status === 'PENDIENTE_REVISION' && (
          <SecButton variant="warning" size="sm" onClick={() => onValidate(record)}>
            <CheckCircle2 size={13} />
            <span>Validar</span>
          </SecButton>
        )}

        {canUpdate && activeTab === 'WAITLIST' && record.status === 'LISTA_ESPERA' && (
          <SecButton variant="primary" size="sm" onClick={() => onOfferSpot(record)}>
            <Send size={13} />
            <span>Ofertar Plaza</span>
          </SecButton>
        )}

        {activeTab === 'OFFERED' && record.status === 'PLAZA_OFERTADA' && (
          <>
            {record.enrollmentToken && !record.tokenExpired ? (
              <>
                <SecButton variant="whatsapp" size="sm" onClick={() => onOpenWhatsApp(record)}>
                  <MessageCircle size={13} />
                  <span>{safeModeWhatsApp ? 'Simular WhatsApp' : 'WhatsApp'}</span>
                </SecButton>
                <SecButton variant="secondary" size="sm" onClick={() => onCopyLink(record)}>
                  {copiedId === record.id ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )}
                  <span>{copiedId === record.id ? 'Copiado' : 'Copiar link'}</span>
                </SecButton>
              </>
            ) : (
              canUpdate && (
                <SecButton variant="warning" size="sm" onClick={() => onRenewToken(record)}>
                  <RefreshCw size={13} />
                  <span>Renovar enlace</span>
                </SecButton>
              )
            )}
          </>
        )}

        {canUpdate && activeTab === 'OFFERED' && record.status === 'INSCRIPCION_COMPLETADA' && (
          <SecButton variant="success" size="sm" onClick={() => onAdmitCensus(record)}>
            <UserCheck size={13} />
            <span>Censar</span>
          </SecButton>
        )}

        {record.enrollment && (
          <SecButton variant="secondary" size="sm" onClick={() => onDownloadPdf(record)}>
            <FileDown size={13} className="text-[#01317b]" />
            <span>PDF</span>
          </SecButton>
        )}

        {canUpdate && activeTab === 'ARCHIVED' && record.status === 'BAJA' && (
          <SecButton variant="primary" size="sm" onClick={() => onReactivate(record)}>
            <RotateCcw size={13} />
            <span>Reactivar</span>
          </SecButton>
        )}

        <SecButton
          variant="secondary"
          size="sm"
          onClick={() => onViewDetail(record)}
          aria-label={`Abrir expediente de ${record.childFirstName} ${record.childLastName}`}
        >
          <Eye size={13} />
          <span>Ver expediente</span>
        </SecButton>
      </div>
    </article>
  );
}
