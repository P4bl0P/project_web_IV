import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { CouncilMember } from '../../types/conocenos';
import { COUNCIL_ROLE_STYLES } from '../../utils/councilValidators';
import { SecButton } from '../secretaria/secretariaTheme';

interface Props {
  members: CouncilMember[];
  loading: boolean;
  saving: boolean;
  onAdd: () => void;
  onEdit: (member: CouncilMember) => void;
  onDelete: (member: CouncilMember) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

export default function CouncilMemberList({
  members,
  loading,
  saving,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: Props) {
  if (loading) {
    return (
      <div className="grid gap-3" aria-label="Cargando integrantes del Consejo" aria-busy="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 rounded-2xl border border-slate-200/80 bg-white p-5 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="space-y-2 flex-1">
              <div className="h-5 w-44 rounded-lg bg-slate-200/75" />
              <div className="h-3.5 w-2/3 rounded bg-slate-100" />
            </div>
            <div className="h-8 w-28 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/85 bg-white px-6 py-14 text-center shadow-[0_2px_12px_-3px_rgba(12,25,51,0.05)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#01317b]/[0.07] text-[#01317b]">
          <Users size={22} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-bold text-[#000254]">
          Aún no hay integrantes en el Consejo
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-slate-500">
          Mientras la lista esté vacía, la página pública «Conócenos» mostrará un estado vacío
          elegante sin inventar nombres. Añade aquí a los responsables actuales cuando quieras
          publicarlos.
        </p>
        <div className="mt-5">
          <SecButton variant="primary" size="md" onClick={onAdd}>
            <Plus size={15} />
            <span>Añadir primer integrante</span>
          </SecButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member, index) => {
        const style = COUNCIL_ROLE_STYLES[member.role] ?? COUNCIL_ROLE_STYLES.Jefatura;

        return (
          <article
            key={member.id}
            className="rounded-2xl border border-slate-200/85 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(12,25,51,0.04)] transition-all duration-150 hover:border-slate-300"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-slate-100 px-2 text-[11px] font-bold text-slate-600">
                    #{index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.badge}`}
                  >
                    {member.role}
                  </span>
                  <h3 className="text-base font-bold text-[#000254]">
                    {member.fullName}
                  </h3>
                </div>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {member.personalBio ? (
                    member.personalBio
                  ) : (
                    <span className="italic text-slate-400">
                      Sin presentación personal opcional.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-[#f8f9fc] p-1"
                  role="group"
                  aria-label={`Ordenar a ${member.fullName}`}
                >
                  <button
                    type="button"
                    disabled={saving || index === 0}
                    onClick={() => onMove(index, -1)}
                    aria-label={`Subir a ${member.fullName}`}
                    title="Subir orden"
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-[#000254] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={saving || index === members.length - 1}
                    onClick={() => onMove(index, 1)}
                    aria-label={`Bajar a ${member.fullName}`}
                    title="Bajar orden"
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-[#000254] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <SecButton
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => onEdit(member)}
                >
                  <Pencil size={13} />
                  <span>Editar</span>
                </SecButton>

                <SecButton
                  variant="destructive"
                  size="sm"
                  disabled={saving}
                  onClick={() => onDelete(member)}
                >
                  <Trash2 size={13} />
                  <span>Eliminar</span>
                </SecButton>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
