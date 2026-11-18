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
} from 'lucide-react';
import { type ApplicantRecord, type ApplicationStatus } from '../../services/api';
import { generateOfficialScoutPdf } from '../../utils/pdfGenerator';
import {
  evaluateRecordCompleteness,
  type SecretariaTab,
} from '../../utils/secretariaSearchFilter';
import {
  SecBadge,
  SecButton,
} from './secretariaTheme';
import {
  getBranchVisualConfig,
  secTokens,
} from './secretariaTokens';

interface Props {
  record: ApplicantRecord;
  index: number;
  activeTab: SecretariaTab;
  safeModeWhatsApp: boolean;
  copiedId: string | null;
  onToggleInclusion: (record: ApplicantRecord) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onOfferSpot: (record: ApplicantRecord) => void;
  onOpenWhatsApp: (record: ApplicantRecord) => void;
  onCopyLink: (record: ApplicantRecord) => void;
  onDelete: (id: string, name: string) => void;
  onEditCensus?: (record: ApplicantRecord) => void;
  onEdit?: (record: ApplicantRecord) => void;
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
  onToggleInclusion,
  onStatusChange,
  onOfferSpot,
  onOpenWhatsApp,
  onCopyLink,
  onDelete,
  onEditCensus,
  onEdit,
}: Props) {
  const branchConfig = getBranchVisualConfig(record.calculatedBranch);

  const birthDate = new Date(record.childBirthDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const admittedDate =
    activeTab === 'CENSUS' && record.admittedAt
      ? new Date(record.admittedAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;

  const completeness = evaluateRecordCompleteness(record, activeTab);

  const hasPriorityBadges =
    record.hasFamilyInGroup ||
    record.comesFromOtherGroup ||
    record.socialInclusionPriority ||
    activeTab === 'OFFERED' ||
    completeness.isIncomplete;

  return (
    <article
      className={`${secTokens.cardInteractive} p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
    >
      {/* Bloque izquierdo: Identidad, etiquetas de prioridad/estado y metadatos */}
      <div className="min-w-0 flex-1 space-y-2.5">
        {/* Fila 1: Posición, Nombre, Rama y Sexo */}
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

        {/* Fila 2: Etiquetas de estado, criterios de prioridad e integridad */}
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
              <SecBadge tone="blue">
                <Clock size={11} className="shrink-0" />
                <span>Enlace enviado · Pendiente de familia</span>
              </SecBadge>
            )}
            {record.status === 'INSCRIPCION_COMPLETADA' && (
              <SecBadge tone="emerald">
                <FileCheck2 size={11} className="shrink-0" />
                <span>Inscripción rellenada</span>
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

        {/* Fila 3: Metadatos familiares y de contacto */}
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

      {/* Bloque derecho: Barra de acciones normalizada */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        {(activeTab === 'INITIAL' || activeTab === 'WAITLIST') && (
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
                onClick={() => onStatusChange(record.id, 'LISTA_ESPERA')}
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

            {record.status === 'INSCRIPCION_COMPLETADA' && (
              <SecButton
                variant="success"
                size="sm"
                onClick={() => onStatusChange(record.id, 'CENSADO')}
              >
                <UserCheck size={13} />
                <span>Censar</span>
              </SecButton>
            )}
          </>
        )}

        {record.enrollment && (
          <SecButton
            variant="secondary"
            size="sm"
            onClick={() => {
              void generateOfficialScoutPdf(record).catch((reason: unknown) => {
                alert(reason instanceof Error ? reason.message : 'No se pudo generar el PDF.');
              });
            }}
          >
            <FileDown size={13} className="text-[#01317b]" />
            <span>PDF</span>
          </SecButton>
        )}

        {activeTab === 'CENSUS' && (
          <SecButton
            variant="secondary"
            size="sm"
            onClick={() => onEditCensus?.(record)}
          >
            <Pencil size={13} />
            <span>Editar</span>
          </SecButton>
        )}

        {activeTab !== 'CENSUS' && onEdit && (
          <SecButton
            variant="secondary"
            size="sm"
            onClick={() => onEdit(record)}
            aria-label={`Editar la información completa de ${record.childFirstName} ${record.childLastName}`}
          >
            <Pencil size={13} />
            <span>Editar</span>
          </SecButton>
        )}

        <SecButton
          variant="tertiary"
          size="icon"
          onClick={() => onDelete(record.id, `${record.childFirstName} ${record.childLastName}`)}
          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          aria-label={`Eliminar a ${record.childFirstName} ${record.childLastName}`}
        >
          <Trash2 size={14} />
        </SecButton>
      </div>
    </article>
  );
}
