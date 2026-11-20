import { useState } from 'react';
import { Camera, CheckCircle2, Quote } from 'lucide-react';
import type { ConocenosSeccionesImages } from '../../config/images/conocenosImages';
import { SECTIONS_DATA } from '../../data/conocenosData';

interface SeccionesSectionProps {
  images: ConocenosSeccionesImages;
}

export default function SeccionesSection({ images }: SeccionesSectionProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="nuestras-secciones"
      className="scroll-mt-32 bg-gradient-to-b from-white via-[#f8fafd] to-white py-16 sm:py-24"
    >
      <div className="page-width">
        <div className="mx-auto max-w-3xl text-center">
          <span className="section-kicker">Nuestras secciones</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[#000254] leading-[1.03] sm:text-4xl lg:text-[48px]">
            Cinco etapas para crecer{' '}
            <span className="text-[#01317b]">de los 6 a los 20 años.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#627089]">
            El escultismo acompaña cada etapa vital con un lenguaje, unos retos y una forma de
            convivir adaptados a la edad: desde los primeros descubrimientos en grupo hasta la
            autonomía y el compromiso solidario.
          </p>
        </div>

        <div
          className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-5"
          aria-label="Resumen de edades por sección"
        >
          {SECTIONS_DATA.map((section, idx) => (
            <a
              key={section.id}
              href={`#seccion-${section.id}`}
              className="group rounded-2xl border border-[#e4e9f1] bg-white px-4 py-3 text-left shadow-[0_4px_14px_rgba(0,5,84,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#b7c7df] focus-visible:outline-3 focus-visible:outline-[#e22328]/40 focus-visible:outline-offset-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-bold text-[#000254]">
                  <span
                    className={`h-2 w-2 rounded-full ${section.dotClass}`}
                    aria-hidden="true"
                  />
                  {section.name}
                </span>
                <span className="text-[10px] font-bold text-[#8b96aa]">0{idx + 1}</span>
              </div>
              <span className="mt-1 block text-xs font-medium text-[#627089]">
                {section.ages}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-14 space-y-10 sm:space-y-12">
          {SECTIONS_DATA.map((section, index) => {
            const reverseMedia = index % 2 === 1;
            const photoSrc = images[section.id];
            const showRealPhoto = Boolean(photoSrc) && !failedImages[section.id];
            const isPortrait = section.photoOrientation === 'portrait';

            return (
              <article
                id={`seccion-${section.id}`}
                key={section.id}
                className={`scroll-mt-32 overflow-hidden rounded-[30px] border p-6 sm:p-10 shadow-[0_14px_40px_rgba(0,5,84,0.05)] ${section.accentBg} ${section.accentBorder}`}
              >
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-center">
                  <div
                    className={`lg:col-span-6 ${
                      reverseMedia ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold ${section.badgeClass}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${section.dotClass}`}
                          aria-hidden="true"
                        />
                        {section.ages}
                      </span>
                      <span className="text-xs font-semibold text-[#627089]">
                        {section.stageLabel}
                      </span>
                    </div>

                    <h3 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-[-0.04em] text-[#000254]">
                      {section.name}
                    </h3>

                    <p className="mt-3 text-base leading-relaxed text-[#27344e]">
                      {section.shortDesc}
                    </p>

                    <div className="mt-5 rounded-2xl border border-white/80 bg-white/85 p-5 backdrop-blur-sm">
                      <span className="block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#01317b]">
                        Qué descubren y viven
                      </span>
                      <ul className="mt-3 space-y-2.5">
                        {section.whatTheyDo.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-2.5 text-sm leading-relaxed text-[#27344e]"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-[#01317b]"
                              aria-hidden="true"
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <blockquote className="mt-5 flex items-start gap-3 rounded-2xl border border-[#dce4f2] bg-white px-5 py-4 text-sm font-semibold italic text-[#000254]">
                      <Quote
                        size={18}
                        className="mt-0.5 shrink-0 text-[#e22328]"
                        aria-hidden="true"
                      />
                      <span>«{section.motto}»</span>
                    </blockquote>
                  </div>

                  <div
                    className={`lg:col-span-6 ${
                      reverseMedia ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    {showRealPhoto && photoSrc ? (
                      <figure
                        className={`overflow-hidden rounded-[24px] border border-white bg-white p-2.5 shadow-[0_18px_40px_rgba(0,5,84,0.1)] ${
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
                            alt={section.photoAlt}
                            className={`h-full w-full object-cover ${
                              isPortrait ? 'object-center' : 'object-[center_30%]'
                            }`}
                            loading="lazy"
                            decoding="async"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [section.id]: true }))
                            }
                          />
                        </div>
                        <figcaption className="px-2.5 pt-3 pb-1 text-xs text-[#627089]">
                          {section.photoAlt}
                        </figcaption>
                      </figure>
                    ) : (
                      <div className="flex min-h-[280px] sm:min-h-[320px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#c7d3e6] bg-white/85 p-8 text-center">
                        <span
                          className={`grid h-14 w-14 place-items-center rounded-2xl border ${section.badgeClass}`}
                        >
                          <Camera size={24} aria-hidden="true" />
                        </span>
                        <h4 className={`mt-4 text-base font-bold ${section.accentText}`}>
                          Fotografía real de {section.name} pendiente
                        </h4>
                        <p className="mt-2 max-w-sm text-xs sm:text-sm leading-relaxed text-[#627089]">
                          Espacio reservado para incorporar una fotografía auténtica de nuestra
                          sección de {section.name} ({section.ages}) sin recurrir a imágenes
                          genéricas.
                        </p>
                        <code className="mt-4 rounded-lg bg-[#f5f7fb] px-3 py-1.5 text-[11px] font-medium text-[#01317b] border border-[#e4e9f1]">
                          public/images/conocenos/secciones/{section.id}/
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
