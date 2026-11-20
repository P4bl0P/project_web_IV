import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SharedImagesCatalog } from '../../config/images/sharedImages';
import { EMAIL_CHANNELS, MEETING_PLACE, SOCIAL_CHANNELS } from '../../data/contactoData';
import { SocialPlatformIcon } from './SocialIcons';

interface FooterProps {
  images: SharedImagesCatalog;
}

const footerFocusClass =
  'focus-visible:outline-3 focus-visible:outline-[#e22328]/45 focus-visible:outline-offset-[3px]';

export default function Footer({ images }: FooterProps) {
  return (
    <footer className="border-t border-white/12 bg-[#060e28] text-white/[0.88]" aria-label="Pie de página público">
      <div className="page-width pt-11 pb-7 min-[801px]:pt-[60px] min-[801px]:pb-[34px]">
        <div className="grid grid-cols-1 items-start gap-7 min-[801px]:grid-cols-2 min-[801px]:gap-9 min-[1021px]:grid-cols-[1.3fr_0.95fr_1.15fr_1fr]">
          <div className="grid justify-items-start gap-4">
            <Link to="/home" className={`group inline-flex items-center gap-3 no-underline ${footerFocusClass}`}>
              <img
                src={images.logo}
                alt=""
                className="h-[43px] w-[43px] rounded-[13px] object-cover shadow-[0_5px_15px_rgba(0,5,84,0.16)] transition-transform duration-300 ease-out group-hover:-rotate-4 group-hover:scale-105"
              />
              <span className="grid leading-[1.15]">
                <strong className="text-[16px] tracking-[-0.02em] text-white">Grupo IV</strong>
                <span className="mt-[3px] text-[11px] text-white/[0.68]">
                  Scout Montequinto · San José de Calasanz
                </span>
              </span>
            </Link>
            <p className="m-0 max-w-[310px] text-[13px] leading-[1.65] text-white/[0.72]">
              Educando en el tiempo libre y en valores desde 1980 en Montequinto, Dos Hermanas (Sevilla).
            </p>
            <a
              href={MEETING_PLACE.mapsShortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-[12px] border border-white/[0.14] bg-white/[0.05] px-[13px] py-2 text-[12px] leading-[1.4] text-white/[0.86] no-underline transition-colors duration-200 hover:border-white/[0.28] hover:bg-white/10 hover:text-white ${footerFocusClass}`}
            >
              <MapPin size={15} className="flex-none text-[#f68a8d]" aria-hidden="true" />
              <span>{MEETING_PLACE.name}</span>
            </a>
          </div>

          <div className="grid gap-[14px]">
            <h2 className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f68a8d]">
              Correos electrónicos
            </h2>
            <div className="grid gap-[10px]">
              {EMAIL_CHANNELS.map((email) => (
                <a
                  key={email.id}
                  href={`mailto:${email.address}`}
                  className={`flex items-center gap-3 rounded-[14px] border border-white/[0.11] bg-white/[0.04] px-[13px] py-[11px] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.26] hover:bg-white/[0.09] ${footerFocusClass}`}
                >
                  <span
                    className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-white/10 text-white"
                    aria-hidden="true"
                  >
                    <Mail size={16} />
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <strong className="text-[12px] font-bold text-white">{email.shortLabel}</strong>
                    <span className="break-all text-[12px] text-white/[0.72]">{email.address}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-[14px]">
            <h2 className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f68a8d]">
              Redes sociales
            </h2>
            <div className="grid gap-[10px]">
              {SOCIAL_CHANNELS.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-3 rounded-[14px] border border-white/[0.11] bg-white/[0.04] px-[13px] py-[11px] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.26] hover:bg-white/[0.09] ${footerFocusClass}`}
                >
                  <span
                    className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] text-white ${
                      social.id === 'instagram'
                        ? 'bg-[linear-gradient(135deg,rgba(245,133,41,0.35),rgba(221,42,123,0.35))]'
                        : 'bg-[#1877f2]/[0.35]'
                    }`}
                    aria-hidden="true"
                  >
                    <SocialPlatformIcon id={social.id} size={18} />
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <strong className="text-[12px] font-bold text-white">{social.platform}</strong>
                    <span className="break-all text-[12px] text-white/[0.72]">{social.handle}</span>
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="ml-auto flex-none text-white/[0.55] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/[0.11] pt-[22px] min-[801px]:mt-[46px] min-[801px]:flex-row min-[801px]:items-center min-[801px]:gap-[18px]">
          <p className="m-0 text-[12px] leading-[1.5] text-white/[0.64]">
            © {new Date().getFullYear()} Grupo IV Scout San José de Calasanz · Montequinto (Dos Hermanas, Sevilla).
          </p>
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-white/[0.72]">
            <img
              src={images.florLis}
              alt=""
              className="h-[18px] w-[18px] object-contain brightness-0 invert opacity-[0.82]"
            />
            <span>Siempre listos · Escultismo desde 1980</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
