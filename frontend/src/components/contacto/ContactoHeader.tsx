import { ArrowRight, Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ContactoImageAsset } from '../../config/images/contactoImages';

interface ContactoHeaderProps {
  image: ContactoImageAsset;
}

const quickLinkBase =
  'group flex items-center justify-between gap-3 px-[18px] py-4 min-[801px]:px-[22px] min-[801px]:py-5 no-underline transition-colors duration-200 hover:bg-[#f5f7fb] focus-visible:outline-3 focus-visible:outline-[#e22328]/45 focus-visible:outline-offset-[3px] border-b border-[#e4e9f1] last:border-b-0 min-[801px]:[&:nth-child(odd)]:border-r min-[801px]:[&:nth-last-child(-n+2)]:border-b-0 min-[1021px]:border-b-0 min-[1021px]:border-r min-[1021px]:last:border-r-0';

export default function ContactoHeader({ image }: ContactoHeaderProps) {
  return (
    <header className="page-width pt-[34px] pb-3 min-[801px]:pt-[52px] min-[801px]:pb-5">
      <div className="reveal grid gap-[18px]">
        <span className="eyebrow">
          <span className="eyebrow-dot" /> Contacto · Grupo IV Scout San José de Calasanz
        </span>
        <div className="grid grid-cols-1 items-end gap-[18px] min-[801px]:grid-cols-[1.08fr_0.92fr] min-[801px]:gap-10">
          <h1 className="m-0 text-[clamp(40px,12vw,56px)] leading-[0.98] tracking-[-0.06em] text-[#000254] min-[801px]:text-[clamp(44px,5.6vw,72px)]">
            Estamos aquí <em className="not-italic text-[#01317b]">para ti.</em>
          </h1>
          <p className="m-0 max-w-[470px] justify-self-start text-[15px] leading-[1.7] text-[#627089] min-[801px]:justify-self-end min-[801px]:text-[16px]">
            ¿Tienes alguna duda sobre el grupo, las etapas educativas o cómo participar? Escríbenos por nuestros
            canales oficiales, síguenos en redes o acércate a conocernos los sábados en Montequinto.
          </p>
        </div>
      </div>

      <div className="reveal reveal-delay mt-[26px] overflow-hidden rounded-[22px] border border-[#e4e9f1] bg-white shadow-[0_18px_50px_rgba(0,5,84,0.09)] min-[801px]:mt-[38px] min-[801px]:rounded-[28px]">
        <div className="relative h-[230px] overflow-hidden bg-[#e8eef7] min-[801px]:h-[clamp(230px,31vw,350px)]">
          <img
            src={image.src}
            alt={image.alt}
            className="block h-full w-full object-cover object-[center_45%]"
            loading="eager"
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,2,84,0.04)_20%,rgba(0,2,84,0.58)_100%)]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-4 bottom-[14px] flex flex-wrap items-center justify-between gap-3 min-[801px]:inset-x-6 min-[801px]:bottom-5">
            <span className="inline-flex items-center gap-[7px] rounded-full border border-white/[0.38] bg-[#000254]/[0.58] px-[14px] py-2 text-[12px] font-bold text-white backdrop-blur-[10px]">
              <MapPin size={14} aria-hidden="true" /> Montequinto · Dos Hermanas (Sevilla)
            </span>
            <span className="inline-flex items-center gap-[7px] rounded-full border border-white/95 bg-white/[0.92] px-[14px] py-2 text-[12px] font-bold text-[#000254] backdrop-blur-[10px]">
              <Heart size={14} fill="currentColor" className="text-[#e22328]" aria-hidden="true" /> Sábados de actividad scout
            </span>
          </div>
        </div>

        <nav
          className="grid grid-cols-1 border-t border-[#e4e9f1] bg-white min-[801px]:grid-cols-2 min-[1021px]:grid-cols-4"
          aria-label="Accesos rápidos de contacto"
        >
          <a href="#canales-contacto" className={quickLinkBase}>
            <span className="grid min-w-0 gap-[3px]">
              <strong className="text-[14px] font-bold tracking-[-0.01em] text-[#000254]">Redes sociales</strong>
              <span className="text-[12px] text-[#627089]">@scoutsmonte5 y Facebook</span>
            </span>
            <ArrowRight
              size={16}
              className="flex-none text-[#01317b] transition-all duration-200 group-hover:translate-x-[3px] group-hover:text-[#e22328]"
              aria-hidden="true"
            />
          </a>

          <a href="#correos-contacto" className={quickLinkBase}>
            <span className="grid min-w-0 gap-[3px]">
              <strong className="text-[14px] font-bold tracking-[-0.01em] text-[#000254]">Correos electrónicos</strong>
              <span className="text-[12px] text-[#627089]">General y Secretaría</span>
            </span>
            <ArrowRight
              size={16}
              className="flex-none text-[#01317b] transition-all duration-200 group-hover:translate-x-[3px] group-hover:text-[#e22328]"
              aria-hidden="true"
            />
          </a>

          <a href="#donde-estamos" className={quickLinkBase}>
            <span className="grid min-w-0 gap-[3px]">
              <strong className="text-[14px] font-bold tracking-[-0.01em] text-[#000254]">Dónde estamos</strong>
              <span className="text-[12px] text-[#627089]">Parroquia en Montequinto</span>
            </span>
            <ArrowRight
              size={16}
              className="flex-none text-[#01317b] transition-all duration-200 group-hover:translate-x-[3px] group-hover:text-[#e22328]"
              aria-hidden="true"
            />
          </a>

          <Link to="/solicitud" className={`${quickLinkBase} bg-[#fbfcff]`}>
            <span className="grid min-w-0 gap-[3px]">
              <strong className="text-[14px] font-bold tracking-[-0.01em] text-[#e22328]">Solicitud inicial</strong>
              <span className="text-[12px] text-[#627089]">Solicitar plaza en el grupo</span>
            </span>
            <ArrowRight
              size={16}
              className="flex-none text-[#01317b] transition-all duration-200 group-hover:translate-x-[3px] group-hover:text-[#e22328]"
              aria-hidden="true"
            />
          </Link>
        </nav>
      </div>
    </header>
  );
}
