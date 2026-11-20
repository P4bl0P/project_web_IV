import { useEffect, useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { councilApi } from '../../services/councilApi';
import type { CouncilMember, CouncilRole } from '../../types/conocenos';
import {
  COUNCIL_ROLES,
  COUNCIL_ROLE_STYLES,
  DEFAULT_ROLE_DESCRIPTIONS,
} from '../../utils/councilValidators';

export default function ConsejoSection() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [roleDescriptions, setRoleDescriptions] = useState<Record<CouncilRole, string>>(
    DEFAULT_ROLE_DESCRIPTIONS,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadCouncil = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await councilApi.getPublic();
        if (!cancelled) {
          setMembers(data.members);
          if (data.roleDescriptions) setRoleDescriptions(data.roleDescriptions);
        }
      } catch (reason) {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'No se pudo cargar la información del Consejo.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadCouncil();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="nuestro-consejo"
      className="scroll-mt-32 border-t border-[#e4e9f1] bg-[#f5f7fb] py-16 sm:py-24"
    >
      <div className="page-width">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="section-kicker">Nuestro Consejo</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#000254] leading-[1.03] sm:text-4xl lg:text-[48px]">
              El equipo que coordina y{' '}
              <span className="text-[#01317b]">cuida la vida del grupo.</span>
            </h2>
          </div>
          <p className="lg:col-span-5 text-base leading-relaxed text-[#627089]">
            El Consejo de Grupo acompaña de forma voluntaria la coordinación educativa, la gestión
            administrativa y la administración responsable de nuestros recursos.
          </p>
        </div>

        {/* Descripciones fijas compartidas por cargo (sin duplicarlas en cada persona) */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {COUNCIL_ROLES.map((role) => {
            const style = COUNCIL_ROLE_STYLES[role];
            return (
              <div
                key={role}
                className={`rounded-2xl border border-[#e4e9f1] border-t-4 ${style.accentBorder} bg-white p-6 shadow-[0_6px_20px_rgba(0,5,84,0.03)]`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${style.badge}`}
                >
                  {role}
                </span>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#627089]">
                  {roleDescriptions[role] ?? DEFAULT_ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            );
          })}
        </div>

        {/* Integrantes reales del Consejo (tipografía y jerarquía sin avatares ficticios) */}
        <div className="mt-10">
          {loading ? (
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Cargando integrantes del Consejo"
              aria-busy="true"
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-2xl border border-[#e4e9f1] bg-white p-6 animate-pulse"
                >
                  <div className="h-5 w-24 rounded-full bg-slate-200/75" />
                  <div className="mt-4 h-6 w-48 rounded-lg bg-slate-200/80" />
                  <div className="mt-3 h-3.5 w-full rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center text-sm text-rose-800"
            >
              {error}
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-[26px] border border-[#dce4f2] bg-white px-6 py-12 text-center shadow-[0_8px_28px_rgba(0,5,84,0.04)]">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf3fb] text-[#01317b]">
                <Users size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#000254]">
                Composición del Consejo en actualización
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#627089]">
                Todavía no se han publicado los nombres de los integrantes actuales del Consejo de
                Grupo para esta ronda solar. Puedes consultar las funciones de Jefatura, Secretaría
                y Tesorería en los bloques superiores o ponerte en contacto con nosotros.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, index) => {
                const roleStyle =
                  COUNCIL_ROLE_STYLES[member.role] ?? COUNCIL_ROLE_STYLES.Jefatura;

                return (
                  <article
                    key={member.id}
                    className={`flex flex-col justify-between rounded-[24px] border border-[#e4e9f1] border-t-4 ${roleStyle.accentBorder} bg-white p-6 sm:p-7 shadow-[0_10px_28px_rgba(0,5,84,0.05)] transition-transform duration-200 hover:-translate-y-0.5`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${roleStyle.badge}`}
                        >
                          <Shield size={11} aria-hidden="true" />
                          {member.role}
                        </span>
                        <span className="text-[11px] font-bold tracking-widest text-[#8b96aa]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-extrabold tracking-[-0.025em] text-[#000254]">
                        {member.fullName}
                      </h3>

                      {member.personalBio ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#627089]">
                          {member.personalBio}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs font-medium text-[#8b96aa]">
                          Miembro del Consejo de Grupo · {member.role}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
