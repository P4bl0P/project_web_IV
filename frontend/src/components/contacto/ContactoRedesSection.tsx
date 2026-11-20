import { ArrowUpRight } from 'lucide-react';
import { SOCIAL_CHANNELS } from '../../data/contactoData';
import { SocialPlatformIcon } from '../shared/SocialIcons';

export default function ContactoRedesSection() {
  return (
    <section
      id="canales-contacto"
      className="page-width scroll-mt-[88px] pt-14 pb-16 min-[801px]:pt-[84px] min-[801px]:pb-[92px]"
    >
      <div className="section-kicker">Síguenos de cerca</div>
      <div className="mt-[21px] grid grid-cols-1 items-end gap-5 min-[801px]:grid-cols-2 min-[801px]:gap-[60px]">
        <h2 className="m-0 text-[clamp(37px,4vw,57px)] leading-[0.98] tracking-[-0.06em] text-[#000254]">
          Nuestro día a día,
          <br />
          <span className="text-[#01317b]">en comunidad.</span>
        </h2>
        <p className="m-0 mb-[3px] max-w-[450px] text-[16px] leading-[1.7] text-[#627089]">
          Compartimos nuestras acampadas, actividades de sábado, avisos y momentos en familia a través de nuestras
          redes oficiales.
        </p>
      </div>

      <div className="mt-11 grid grid-cols-1 gap-[22px] min-[801px]:grid-cols-2">
        {SOCIAL_CHANNELS.map(({ id, platform, handle, description, cta, href }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between gap-6 rounded-[24px] border border-[#e4e9f1] bg-white p-6 no-underline shadow-[0_7px_25px_rgba(0,5,84,0.04)] transition-all duration-250 hover:-translate-y-[5px] hover:border-[#c3d2e8] hover:shadow-[0_18px_50px_rgba(0,5,84,0.09)] active:-translate-y-px active:scale-[0.992] focus-visible:outline-3 focus-visible:outline-[#e22328]/45 focus-visible:outline-offset-[3px] min-[801px]:p-8"
          >
            <div className="flex items-center justify-between">
              <span
                className={`grid h-[52px] w-[52px] place-items-center rounded-[16px] bg-[#edf3fb] text-[#01317b] transition-all duration-250 group-hover:scale-105 group-hover:text-white ${
                  id === 'instagram'
                    ? 'group-hover:bg-[linear-gradient(135deg,#f58529,#dd2a7b_55%,#8134af)]'
                    : 'group-hover:bg-[#1877f2]'
                }`}
              >
                <SocialPlatformIcon id={id} size={24} />
              </span>
              <span
                className="grid h-[38px] w-[38px] place-items-center rounded-full border border-[#e4e9f1] bg-white text-[#627089] transition-all duration-250 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-[#f3c4c6] group-hover:bg-[#fff7f7] group-hover:text-[#e22328]"
                aria-hidden="true"
              >
                <ArrowUpRight size={18} />
              </span>
            </div>

            <div className="grid gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#e22328]">
                {platform}
              </span>
              <h3 className="m-0 text-[clamp(24px,2.4vw,30px)] leading-[1.1] tracking-[-0.04em] text-[#000254]">
                {handle}
              </h3>
              <p className="m-0 text-[14px] leading-[1.6] text-[#627089]">{description}</p>
            </div>

            <span className="inline-flex items-center gap-[7px] text-[13px] font-bold text-[#01317b]">
              {cta}{' '}
              <ArrowUpRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
