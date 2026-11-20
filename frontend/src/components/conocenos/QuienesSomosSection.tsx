import { QUIENES_SOMOS } from '../../data/conocenosData';

export default function QuienesSomosSection() {
  return (
    <section
      id="quienes-somos"
      className="scroll-mt-32 py-16 sm:py-24 bg-white"
    >
      <div className="page-width">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-36">
            <span className="section-kicker">{QUIENES_SOMOS.kicker}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#000254] leading-[1.04] sm:text-4xl lg:text-[46px]">
              {QUIENES_SOMOS.titleStart}{' '}
              <span className="text-[#01317b]">{QUIENES_SOMOS.titleAccent}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#627089]">
              {QUIENES_SOMOS.lead}
            </p>

            <div className="mt-8 space-y-4 border-t border-[#e4e9f1] pt-6">
              {QUIENES_SOMOS.pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="border-l-2 border-[#01317b]/30 pl-4 transition-colors hover:border-[#e22328]"
                >
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#e22328]">
                    {pillar.label}
                  </span>
                  <h3 className="mt-0.5 text-sm font-bold text-[#000254]">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#627089]">
                    {pillar.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {QUIENES_SOMOS.paragraphs.map((paragraph, index) => (
              <article
                key={paragraph.slice(0, 28)}
                className={`rounded-[26px] border p-7 sm:p-9 transition-shadow duration-200 ${
                  index === 0
                    ? 'border-[#d6e1f2] bg-gradient-to-br from-[#f5f8fd] to-white shadow-[0_14px_34px_rgba(0,5,84,0.06)]'
                    : 'border-[#e4e9f1] bg-white shadow-[0_6px_22px_rgba(0,5,84,0.03)]'
                }`}
              >
                <span className="inline-flex h-7 items-center rounded-full bg-[#edf3fb] px-3 text-[11px] font-bold text-[#01317b]">
                  0{index + 1}
                </span>
                <p className="mt-4 text-[15px] sm:text-base leading-[1.8] text-[#27344e]">
                  {paragraph}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
