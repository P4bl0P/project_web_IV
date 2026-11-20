import { ArrowDownRight, ArrowRight, Compass, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONOCENOS_HERO } from '../../data/conocenosData';

interface ConocenosHeroProps {
  image: string;
}

export default function ConocenosHero({ image }: ConocenosHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f5f7fb] via-white to-white pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-radial from-[#01317b]/[0.08] via-[#e22328]/[0.03] to-transparent blur-2xl"
        aria-hidden="true"
      />

      <div className="page-width relative">
        <div className="mx-auto max-w-4xl text-center motion-safe:animate-[reveal_0.75s_cubic-bezier(0.2,0.8,0.2,1)_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e4e9f1] bg-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#e22328] shadow-[0_2px_10px_rgba(0,5,84,0.04)]">
            <span className="h-2 w-2 rounded-full bg-[#e22328]" aria-hidden="true" />
            {CONOCENOS_HERO.eyebrow}
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.045em] text-[#000254] leading-[1.03] sm:text-5xl lg:text-[64px]">
            {CONOCENOS_HERO.titleStart}{' '}
            <span className="block sm:inline text-[#01317b]">
              {CONOCENOS_HERO.titleAccent}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#627089] sm:text-lg">
            {CONOCENOS_HERO.lead}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#quienes-somos"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#000254] px-6 text-sm font-bold text-white shadow-[0_12px_26px_rgba(0,2,84,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#01317b] focus-visible:outline-3 focus-visible:outline-[#e22328]/40 focus-visible:outline-offset-2"
            >
              Descubre nuestra historia
              <ArrowDownRight size={17} aria-hidden="true" />
            </a>
            <Link
              to="/solicitud"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#d6dfec] bg-white px-6 text-sm font-bold text-[#01317b] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#01317b]/40 hover:bg-[#f5f7fb] focus-visible:outline-3 focus-visible:outline-[#e22328]/40 focus-visible:outline-offset-2"
            >
              Solicitar plaza
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <figure className="mt-12 sm:mt-14">
          <div className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] border border-[#e4e9f1] bg-[#e9eff8] shadow-[0_24px_60px_rgba(0,5,84,0.12)]">
            <div className="aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/10] w-full overflow-hidden">
              <img
                src={image}
                alt={CONOCENOS_HERO.photoAlt}
                className="h-full w-full object-cover object-[center_24%]"
                loading="eager"
                decoding="async"
              />
            </div>

            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#000254]/75 via-[#000254]/10 to-transparent"
              aria-hidden="true"
            />

            <figcaption className="relative sm:absolute sm:inset-x-6 sm:bottom-6 bg-[#060e28] sm:bg-transparent px-5 py-4 sm:p-0">
              <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
                {CONOCENOS_HERO.highlights.map((item, idx) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-md"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
                      {idx === 1 ? (
                        <MapPin size={16} aria-hidden="true" />
                      ) : (
                        <Compass size={16} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
                        {item.label}
                      </span>
                      <strong className="block truncate text-xs sm:text-sm font-semibold text-white">
                        {item.value}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
}
