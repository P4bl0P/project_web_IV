import {
  Flame,
  HeartHandshake,
  ShieldCheck,
  Sprout,
  Trees,
  Users,
} from 'lucide-react';
import { VALUES_ITEMS } from '../../data/conocenosData';
import type { ValueItem } from '../../types/conocenos';

function renderValueIcon(iconName: ValueItem['iconName']) {
  const props = { size: 22, 'aria-hidden': true as const };
  switch (iconName) {
    case 'users':
      return <Users {...props} />;
    case 'heartHandshake':
      return <HeartHandshake {...props} />;
    case 'trees':
      return <Trees {...props} />;
    case 'shieldCheck':
      return <ShieldCheck {...props} />;
    case 'sprout':
      return <Sprout {...props} />;
    case 'flame':
      return <Flame {...props} />;
  }
}

const BENTO_SPAN_BY_INDEX = [
  'md:col-span-7',
  'md:col-span-5',
  'md:col-span-6',
  'md:col-span-6',
  'md:col-span-5',
  'md:col-span-7',
] as const;

export default function ValoresSection() {
  return (
    <section id="nuestros-valores" className="scroll-mt-32 bg-white py-16 sm:py-24">
      <div className="page-width">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="section-kicker">Nuestros valores</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#000254] leading-[1.03] sm:text-4xl lg:text-[48px]">
              Seis pilares que guían{' '}
              <span className="text-[#01317b]">cada paso que damos.</span>
            </h2>
          </div>
          <p className="lg:col-span-5 text-base leading-relaxed text-[#627089]">
            No son palabras colgadas en una pared: se aprenden conviviendo, compartiendo tareas y
            poniéndolos en práctica dentro y fuera del campamento.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-12">
          {VALUES_ITEMS.map((value, index) => {
            const spanClass = BENTO_SPAN_BY_INDEX[index] ?? 'md:col-span-6';
            const isDark = value.emphasis === 'dark';
            const isFeatured = value.emphasis === 'featured';
            const isSoft = value.emphasis === 'soft';

            return (
              <article
                key={value.id}
                className={`${spanClass} group relative overflow-hidden rounded-[26px] border p-7 sm:p-8 transition-all duration-200 hover:-translate-y-1 ${
                  isDark
                    ? 'border-[#000254] bg-[#000254] text-white shadow-[0_18px_42px_rgba(0,2,84,0.18)]'
                    : isFeatured
                      ? 'border-[#cad8ee] bg-gradient-to-br from-[#eef4fc] via-white to-[#f7fafe] text-[#0c1933] shadow-[0_12px_30px_rgba(1,49,123,0.07)]'
                      : isSoft
                        ? 'border-[#e4e9f1] bg-[#f8fafe] text-[#0c1933] shadow-[0_6px_22px_rgba(0,5,84,0.03)]'
                        : 'border-[#e4e9f1] bg-white text-[#0c1933] shadow-[0_6px_22px_rgba(0,5,84,0.03)]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
                      isDark
                        ? 'bg-white/12 text-[#f68a8d]'
                        : isFeatured
                          ? 'bg-[#01317b] text-white'
                          : 'bg-[#edf3fb] text-[#e22328]'
                    }`}
                  >
                    {renderValueIcon(value.iconName)}
                  </span>
                  <span
                    className={`text-xs font-extrabold tracking-[0.16em] ${
                      isDark ? 'text-white/45' : 'text-[#8b96aa]'
                    }`}
                  >
                    {value.number}
                  </span>
                </div>

                <h3
                  className={`mt-6 text-xl sm:text-2xl font-bold tracking-[-0.025em] ${
                    isDark ? 'text-white' : 'text-[#000254]'
                  }`}
                >
                  {value.title}
                </h3>

                <p
                  className={`mt-2 text-sm sm:text-[15px] font-semibold leading-snug ${
                    isDark ? 'text-[#bfd3f6]' : 'text-[#01317b]'
                  }`}
                >
                  {value.lead}
                </p>

                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    isDark ? 'text-white/80' : 'text-[#627089]'
                  }`}
                >
                  {value.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
