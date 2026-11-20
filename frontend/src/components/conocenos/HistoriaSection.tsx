import { useState } from 'react';
import { Calendar, Camera, Sparkles } from 'lucide-react';
import type { ConocenosHistoriaImages } from '../../config/images/conocenosImages';
import { HISTORIA_INTRO, HISTORIA_MILESTONES } from '../../data/conocenosData';

interface HistoriaSectionProps {
  images: ConocenosHistoriaImages;
}

export default function HistoriaSection({ images }: HistoriaSectionProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="nuestra-historia"
      className="scroll-mt-32 border-y border-[#e4e9f1] bg-[#f5f7fb] py-16 sm:py-24"
    >
      <div className="page-width">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <span className="section-kicker">{HISTORIA_INTRO.kicker}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#000254] leading-[1.03] sm:text-4xl lg:text-[48px]">
              {HISTORIA_INTRO.titleStart}{' '}
              <span className="text-[#01317b]">{HISTORIA_INTRO.titleAccent}</span>
            </h2>
          </div>
          <p className="lg:col-span-6 text-base leading-relaxed text-[#627089] lg:pb-1">
            {HISTORIA_INTRO.narrative}
          </p>
        </div>

        <div className="relative mt-14 space-y-12 sm:space-y-16">
          <div
            className="pointer-events-none absolute left-4 top-6 bottom-6 hidden w-px bg-gradient-to-b from-[#01317b]/30 via-[#e22328]/35 to-[#01317b]/20 lg:left-1/2 lg:block"
            aria-hidden="true"
          />

          {HISTORIA_MILESTONES.map((milestone, index) => {
            const isReversed = index % 2 === 1;
            const photoSrc = images[milestone.id];
            const hasPhoto = Boolean(photoSrc) && !failedImages[milestone.id];
            const isPortrait = milestone.photoOrientation === 'portrait';

            return (
              <article
                key={milestone.id}
                className="relative grid gap-6 lg:grid-cols-12 lg:gap-10 items-center"
              >
                <div
                  className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 place-items-center rounded-full border-2 border-[#e22328] bg-white shadow-sm z-10"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#000254]" />
                </div>

                <div
                  className={`lg:col-span-6 ${
                    isReversed ? 'lg:order-2 lg:pl-8' : 'lg:order-1 lg:pr-8'
                  }`}
                >
                  <div className="rounded-[26px] border border-[#e4e9f1] bg-white p-7 sm:p-9 shadow-[0_12px_36px_rgba(0,5,84,0.05)]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#000254] px-3.5 py-1 text-xs font-bold text-white">
                        <Calendar size={13} aria-hidden="true" />
                        {milestone.period}
                      </span>
                      <span className="rounded-full bg-[#edf3fb] px-3 py-1 text-[11px] font-bold text-[#01317b]">
                        {milestone.tag}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-[-0.025em] text-[#000254]">
                      {milestone.title}
                    </h3>

                    <p className="mt-3 text-sm sm:text-[15px] font-semibold leading-relaxed text-[#0c1933]">
                      {milestone.summary}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#627089]">
                      {milestone.detail}
                    </p>
                  </div>
                </div>

                <div
                  className={`lg:col-span-6 ${
                    isReversed ? 'lg:order-1 lg:pr-8' : 'lg:order-2 lg:pl-8'
                  }`}
                >
                  {hasPhoto && photoSrc ? (
                    <figure
                      className={`overflow-hidden rounded-[26px] border border-[#dce4f0] bg-white p-2.5 shadow-[0_14px_38px_rgba(0,5,84,0.08)] ${
                        isPortrait ? 'mx-auto max-w-[360px]' : ''
                      }`}
                    >
                      <div
                        className={`overflow-hidden rounded-[18px] bg-[#e9eff8] ${
                          isPortrait ? 'aspect-[4/5]' : 'aspect-[16/10]'
                        }`}
                      >
                        <img
                          src={photoSrc}
                          alt={milestone.photoAlt ?? 'Fotografía del Grupo IV Scout'}
                          className={`h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02] ${
                            milestone.photoEra === 'historica' ? 'sepia-[.12] contrast-[1.03]' : ''
                          } ${isPortrait ? 'object-center' : 'object-[center_28%]'}`}
                          loading="lazy"
                          decoding="async"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [milestone.id]: true }))
                          }
                        />
                      </div>
                      <figcaption className="flex items-center justify-between gap-3 px-2.5 pt-3 pb-1 text-xs text-[#627089]">
                        <span>{milestone.photoAlt}</span>
                        <span className="shrink-0 rounded-full bg-[#f5f7fb] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#01317b]">
                          {milestone.photoEra === 'historica' ? 'Archivo' : 'Grupo IV'}
                        </span>
                      </figcaption>
                    </figure>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[#c7d3e6] bg-white/80 p-8 text-center">
                      <Camera size={24} className="text-[#01317b]" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold text-[#000254]">
                        Memoria gráfica en archivo
                      </p>
                      <p className="mt-1 text-xs text-[#627089]">
                        Espacio preparado para recuerdos verificados de esta etapa.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-[28px] border border-[#dce4f2] bg-white p-7 sm:p-10 shadow-[0_14px_40px_rgba(0,5,84,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#e22328]">
                <Sparkles size={14} aria-hidden="true" /> Presente y futuro
              </span>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-[-0.025em] text-[#000254]">
                {HISTORIA_INTRO.closingTitle}
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#627089]">
                {HISTORIA_INTRO.closingBody}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-[#f5f7fb] px-5 py-4 text-left sm:text-right border border-[#e4e9f1]">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-[#627089]">
                Desde 1979
              </span>
              <strong className="mt-1 block text-2xl font-extrabold tracking-tight text-[#000254]">
                +45 años
              </strong>
              <span className="text-xs text-[#01317b] font-semibold">en Montequinto</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
