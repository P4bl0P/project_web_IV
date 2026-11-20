import type { CouncilRole } from '../../types/conocenos';
import {
  COUNCIL_ROLES,
  COUNCIL_ROLE_STYLES,
  DEFAULT_ROLE_DESCRIPTIONS,
} from '../../utils/councilValidators';

interface Props {
  roleDescriptions: Record<CouncilRole, string>;
}

export default function CouncilRoleOverview({ roleDescriptions }: Props) {
  return (
    <section
      aria-label="Descripciones fijas por cargo"
      className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_2px_12px_-3px_rgba(12,25,51,0.05)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#000254]">
            Descripciones compartidas por cargo
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Cada cargo tiene una descripción institucional única que se muestra automáticamente en
            la página pública sin duplicarse por persona.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {COUNCIL_ROLES.map((role) => {
          const style = COUNCIL_ROLE_STYLES[role];
          return (
            <div
              key={role}
              className={`rounded-xl border border-slate-200/80 border-t-3 ${style.accentBorder} bg-[#f8f9fc] p-4`}
            >
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.badge}`}
              >
                {role}
              </span>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                {roleDescriptions[role] ?? DEFAULT_ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
