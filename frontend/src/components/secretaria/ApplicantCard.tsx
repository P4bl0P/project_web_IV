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
} from 'lucide-react';
import { type ApplicantRecord, type ApplicationStatus } from '../../services/api';
import { generateOfficialScoutPdf } from '../../utils/pdfGenerator';

interface Props {
  record: ApplicantRecord;
  index: number;
  activeTab: 'WAITLIST' | 'OFFERED' | 'CENSUS' | 'ARCHIVED';
  safeModeWhatsApp: boolean;
  copiedId: string | null;
  onToggleInclusion: (record: ApplicantRecord) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onOfferSpot: (record: ApplicantRecord) => void;
  onOpenWhatsApp: (record: ApplicantRecord) => void;
  onCopyLink: (record: ApplicantRecord) => void;
  onDelete: (id: string, name: string) => void;
}

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
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-200 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'WAITLIST' && (
            <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              #{index + 1}
            </span>
          )}
          <h3 className="text-base font-bold text-slate-900">
            {record.childFirstName} {record.childLastName}
          </h3>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {record.calculatedBranch} ({record.currentAge} años)
          </span>
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
        </div>

        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>{new Date(record.createdAt).toLocaleDateString('es-ES')}</span>
          <span>
            {record.parent1FirstName} ({record.parent1Phone} · {record.parent1Email})
          </span>
          <span>
            {record.streetAddress}, {record.municipality}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {activeTab === 'WAITLIST' && (
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
            onClick={() => generateOfficialScoutPdf(record)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
          >
            <FileDown size={14} /> PDF
          </button>
        )}

        <button
          onClick={() => onDelete(record.id, `${record.childFirstName} ${record.childLastName}`)}
          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}