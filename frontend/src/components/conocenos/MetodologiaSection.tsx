import {
  Compass,
  Hammer,
  Handshake,
  Heart,
  Sparkles,
  Trees,
  Users,
} from 'lucide-react';
import { METHODOLOGY_ITEMS } from '../../data/conocenosData';
import type { MethodologyStep } from '../../types/conocenos';

function renderMethodIcon(iconName: MethodologyStep['iconName']) {
  const props = { size: 20, 'aria-hidden': true as const };
  switch (iconName) {
    case 'hammer':
      return <Hammer {...props} />;
    case 'users':
      return <Users {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'handshake':
      return <Handshake {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'trees':
      return <Trees {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
  }
}

export default function MetodologiaSection() {
  return (
    <section
      id="nuestra-metodologia"
      className="scroll-mt-32 bg-[#060e28] py-16 sm:py-24 text-white"
    >
      <div className="page-width">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-36">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f68a8d]">
              Nuestra metodología
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-white leading-[1.04] sm:text-4xl lg:text-[46px]">
              Cómo se aprende y crece{' '}
              <span className="text-[#9ec0f8]">viviendo el escultismo.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/75">
              Nuestro método educativo parte de la experiencia real de cada niño, niña o joven:
              acompañamos sin sustituirlos, proponemos retos a su medida y convertimos cada sábado y
              cada acampada en una oportunidad para madurar.
            </p>

            <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.05] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#f68a8d]">
                En el día a día
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Cada actividad combina juego, responsabilidad compartida, vida en la naturaleza y
                acompañamiento cercano de scouters voluntarios.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {METHODOLOGY_ITEMS.map((item) => (
              <article
                key={item.id}
                className="rounded-[22px] border border-white/10 bg-white/[0.04] p-6 sm:p-7 backdrop-blur-sm transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f68a8d]">
                    {renderMethodIcon(item.iconName)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-bold tracking-[-0.02em] text-white">
                        {item.title}
                      </h3>
                      <span className="text-xs font-extrabold tracking-[0.14em] text-white/45">
                        {item.step}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-semibold text-[#bfd3f6]">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      {item.example}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
