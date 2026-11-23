import {
  CheckCircle2,
  Send,
  MessageCircle,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Trash2,
  FileCheck2,
  UserCheck,
  FileDown,
  Pencil,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  Undo2,
  ShieldCheck,
  UserMinus,
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
  canDelete: boolean;
  onToggleInclusion: (record: ApplicantRecord) => void;
  onValidate: (record: ApplicantRecord) => void;
  onOfferSpot: (record: ApplicantRecord) => void;
  onRenewToken: (record: ApplicantRecord) => void;
  onReturnWaitlist: (record: ApplicantRecord) => void;
  onMarkReviewed: (record: ApplicantRecord) => void;
  onAdmitCensus: (record: ApplicantRecord) => void;
  onDeactivate: (record: ApplicantRecord) => void;
  onReactivate: (record: ApplicantRecord) => void;
  onOpenWhatsApp: (record: ApplicantRecord) => void;
  onCopyLink: (record: ApplicantRecord) => void;
  onDownloadPdf: (record: ApplicantRecord) => void;
  onDelete: (record: ApplicantRecord) => void;
  onEditCensus?: (record: ApplicantRecord) => void;
  onEdit: (record: ApplicantRecord) => void;
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
  canDelete,
  onToggleInclusion,
  onValidate,
  onOfferSpot,
  onRenewToken,
  onReturnWaitlist,
  onMarkReviewed,
  onAdmitCensus,
  onDeactivate,
  onReactivate,
  onOpenWhatsApp,
  onCopyLink,
  onDownloadPdf,
  onDelete,
  onEditCensus,
  onEdit,
}: Props) {
  const branchConfig = getBranchVisualConfig(record.calculatedBranch);

  const birthDate =
    formatIsoToHumanShort(record.childBirthDate) ||
    new Date(record.childBirthDate).toLocaleDateString('es-ES', {
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
          <h3 className="text-[15px] sm:text-base font-bold tracking-tight text-[#0c1933]">
            {record.childFirstName} {record.childLastName}
          </h3>
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
                  {record.reviewedAt ? 'Inscripción revisada · Lista' : 'Inscripción rellenada'}
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

      {/* Bloque derecho: Barra de acciones controlada por estado y permisos */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        {canUpdate && (activeTab === 'INITIAL' || activeTab === 'WAITLIST') && (
          <>
            <SecButton
              variant={record.socialInclusionPriority ? 'destructive' : 'secondary'}
              size="sm"
              onClick={() => onToggleInclusion(record)}
              aria-pressed={record.socialInclusionPriority}
            >
              <HeartHandshake size={13} />
              <span>Inclusión</span>
            </SecButton>

            {record.status === 'PENDIENTE_REVISION' && (
              <SecButton
                variant="warning"
                size="sm"
                onClick={() => onValidate(record)}
              >
                <CheckCircle2 size={13} />
                <span>Validar</span>
              </SecButton>
            )}

            <SecButton
              variant="primary"
              size="sm"
              onClick={() => onOfferSpot(record)}
            >
              <Send size={13} />
              <span>Ofertar Plaza</span>
            </SecButton>
          </>
        )}

        {activeTab === 'OFFERED' && (
          <>
            {record.status === 'PLAZA_OFERTADA' && record.enrollmentToken && !record.tokenExpired && (
              <>
                <SecButton
                  variant="whatsapp"
                  size="sm"
                  onClick={() => onOpenWhatsApp(record)}
                >
                  <MessageCircle size={13} />
                  <span>{safeModeWhatsApp ? 'Simular WhatsApp' : 'WhatsApp'}</span>
                </SecButton>

                <SecButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onCopyLink(record)}
                >
                  {copiedId === record.id ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )}
                  <span>{copiedId === record.id ? 'Copiado' : 'Link'}</span>
                </SecButton>
              </>
            )}

            {canUpdate && (record.tokenExpired || record.status === 'PLAZA_OFERTADA') && (
              <SecButton
                variant={record.tokenExpired ? 'warning' : 'secondary'}
                size="sm"
                onClick={() => onRenewToken(record)}
              >
                <RefreshCw size={13} />
                <span>Renovar</span>
              </SecButton>
            )}

            {canUpdate && record.status === 'PLAZA_OFERTADA' && (
              <SecButton
                variant="secondary"
                size="sm"
                onClick={() => onReturnWaitlist(record)}
                title="Devolver a lista de espera"
              >
                <Undo2 size={13} />
                <span>Lista espera</span>
              </SecButton>
            )}

            {canUpdate && record.status === 'INSCRIPCION_COMPLETADA' && (
              <>
                {!record.reviewedAt && (
                  <SecButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onMarkReviewed(record)}
                  >
                    <ShieldCheck size={13} />
                    <span>Revisada</span>
                  </SecButton>
                )}
                <SecButton
                  variant="success"
                  size="sm"
                  onClick={() => onAdmitCensus(record)}
                >
                  <UserCheck size={13} />
                  <span>Censar</span>
                </SecButton>
              </>
            )}
          </>
        )}

        {record.enrollment && (
          <SecButton
            variant="secondary"
            size="sm"
            onClick={() => onDownloadPdf(record)}
          >
            <FileDown size={13} className="text-[#01317b]" />
            <span>PDF</span>
          </SecButton>
        )}

        {activeTab === 'CENSUS' && canUpdate && (
          <SecButton
            variant="secondary"
            size="sm"
            onClick={() => onEditCensus?.(record)}
          >
            <Pencil size={13} />
            <span>Editar</span>
          </SecButton>
        )}

        <SecButton
          variant="secondary"
          size="sm"
          onClick={() => onEdit(record)}
          aria-label={`Ver o editar el expediente completo de ${record.childFirstName} ${record.childLastName}`}
        >
          <Eye size={13} />
          <span>{canUpdate && activeTab !== 'CENSUS' && activeTab !== 'ARCHIVED' ? 'Detalle / Editar' : 'Detalle'}</span>
        </SecButton>

        {canUpdate && record.status !== 'BAJA' && (
          <SecButton
            variant="tertiary"
            size="icon"
            onClick={() => onDeactivate(record)}
            className="h-8 w-8 text-slate-400 hover:text-amber-700 hover:bg-amber-50"
            aria-label={`Dar de baja a ${record.childFirstName} ${record.childLastName}`}
            title="Dar de baja"
          >
            <UserMinus size={14} />
          </SecButton>
        )}

        {canUpdate && record.status === 'BAJA' && (
          <SecButton
            variant="primary"
            size="sm"
            onClick={() => onReactivate(record)}
          >
            <RotateCcw size={13} />
            <span>Reactivar</span>
          </SecButton>
        )}

        {canDelete && (
          <SecButton
            variant="tertiary"
            size="icon"
            onClick={() => onDelete(record)}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            aria-label={`Eliminar a ${record.childFirstName} ${record.childLastName}`}
            title="Eliminar permanentemente"
          >
            <Trash2 size={14} />
          </SecButton>
        )}
      </div>
    </article>
  );
}
