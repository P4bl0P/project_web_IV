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
} from 'lucide-react';
import { type ApplicantRecord, type ApplicationStatus } from '../../services/api';
import { generateOfficialScoutPdf } from '../../utils/pdfGenerator';
import {
  evaluateRecordCompleteness,
  type SecretariaTab,
} from '../../utils/secretariaSearchFilter';

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
  const sectionName =
    ['Castores', 'Lobatos', 'Rangers', 'Pioneros'].find((section) =>
      record.calculatedBranch.toLowerCase().startsWith(section.toLowerCase()),
    ) || 'Rutas';
  const sectionStyles: Record<string, string> = {
    Castores: 'bg-orange-500 text-white border-orange-600',
    Lobatos: 'bg-yellow-300 text-yellow-950 border-yellow-400',
    Rangers: 'bg-sky-600 text-white border-sky-700',
    Pioneros: 'bg-red-600 text-white border-red-700',
    Rutas: 'bg-violet-600 text-white border-violet-700',
  };
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-[0_5px_18px_rgba(15,23,42,.035)] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(15,23,42,.08)] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {(activeTab === 'INITIAL' || activeTab === 'WAITLIST') && (
            <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              #{index + 1}
            </span>
          )}
          <h3 className="text-base font-bold text-slate-900">
            {record.childFirstName} {record.childLastName}
          </h3>
          <span className={`border text-xs font-bold px-2.5 py-1 rounded-full ${sectionStyles[sectionName]}`}>
            {sectionName}
          </span>
          {record.gender && (
            <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {GENDER_SHORT_LABELS[record.gender] || record.gender}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {record.hasFamilyInGroup && (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-md">
              <Sparkles size={12} /> Familiar: {record.familyMemberDetails || 'Sí'}
            </span>
          )}
          {record.comesFromOtherGroup && (
            <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-md">
              <ShieldAlert size={12} /> Traslado: {record.originGroupDetails}
            </span>
          )}
          {record.socialInclusionPriority && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded-md">
              <HeartHandshake size={12} /> Inclusión
            </span>
          )}
          {record.status === 'INSCRIPCION_COMPLETADA' && (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              <FileCheck2 size={12} /> Rellenada
            </span>
          )}
          {completeness.isIncomplete && (
            <span
              title={`Faltan: ${completeness.missingFields.join(', ')}`}
              className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              <AlertTriangle size={12} /> Datos incompletos
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <strong className="font-semibold text-slate-700">Nacimiento:</strong> {birthDate} (
            {record.currentAge} años)
          </span>
          <span>
            <strong className="font-semibold text-slate-700">Tutor 1:</strong>{' '}
            {record.parent1FirstName} {record.parent1LastName}
          </span>
          {record.parent2FirstName && (
            <span>
              <strong className="font-semibold text-slate-700">Tutor 2:</strong>{' '}
              {record.parent2FirstName} {record.parent2LastName || ''}
            </span>
          )}
          {record.parent1Phone && (
            <span className="inline-flex items-center gap-1">
              <Phone size={11} className="text-slate-400" />
              {record.parent1Phone}
            </span>
          )}
          {record.parent1Email && (
            <span className="inline-flex items-center gap-1">
              <Mail size={11} className="text-slate-400" />
              {record.parent1Email}
            </span>
          )}
          {admittedDate && (
            <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
              <Calendar size={11} />
              Alta censo: {admittedDate}
            </span>
          )}
          <span>{record.municipality}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {(activeTab === 'INITIAL' || activeTab === 'WAITLIST') && (
          <>
            <button
              onClick={() => onToggleInclusion(record)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                record.socialInclusionPriority
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              <HeartHandshake size={14} /> Inclusión
            </button>
            {record.status === 'PENDIENTE_REVISION' && (
              <button
                onClick={() => onStatusChange(record.id, 'LISTA_ESPERA')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <CheckCircle2 size={14} /> Validar
              </button>
            )}
            <button
              onClick={() => onOfferSpot(record)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Send size={14} /> Ofertar Plaza
            </button>
          </>
        )}

        {activeTab === 'OFFERED' && (
          <>
            <button
              onClick={() => onOpenWhatsApp(record)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <MessageCircle size={14} />
              {safeModeWhatsApp ? 'Simular WhatsApp' : 'WhatsApp'}
            </button>
            <button
              onClick={() => onCopyLink(record)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              {copiedId === record.id ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === record.id ? 'Copiado' : 'Link'}
            </button>
            {record.status === 'INSCRIPCION_COMPLETADA' && (
              <button
                onClick={() => onStatusChange(record.id, 'CENSADO')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <UserCheck size={14} /> Censar
              </button>
            )}
          </>
        )}

        {record.enrollment && (
          <button
            onClick={() => {
              void generateOfficialScoutPdf(record).catch((reason: unknown) => {
                alert(reason instanceof Error ? reason.message : 'No se pudo generar el PDF.');
              });
            }}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
          >
            <FileDown size={14} /> PDF
          </button>
        )}

        {activeTab === 'CENSUS' && (
          <button
            onClick={() => onEditCensus?.(record)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Pencil size={14} /> Editar
          </button>
        )}

        {activeTab !== 'CENSUS' && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all duration-200 active:scale-[.97]"
            aria-label={`Editar la información completa de ${record.childFirstName} ${record.childLastName}`}
          >
            <Pencil size={14} /> Editar
          </button>
        )}

        <button
          onClick={() => onDelete(record.id, `${record.childFirstName} ${record.childLastName}`)}
          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition"
          aria-label={`Eliminar a ${record.childFirstName} ${record.childLastName}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
