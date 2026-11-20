import { MapPin, Navigation } from 'lucide-react';
import type { ContactoImageAsset } from '../../config/images/contactoImages';
import { MEETING_PLACE } from '../../data/contactoData';

interface ContactoUbicacionSectionProps {
  image: ContactoImageAsset;
}

export default function ContactoUbicacionSection({ image }: ContactoUbicacionSectionProps) {
  return (
    <section
      id="donde-estamos"
      className="page-width scroll-mt-[88px] pt-14 pb-16 min-[801px]:pt-[84px] min-[801px]:pb-[92px]"
    >
      <div className="grid grid-cols-1 overflow-hidden rounded-[28px] border border-[#e4e9f1] bg-white shadow-[0_18px_50px_rgba(0,5,84,0.09)] min-[801px]:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col justify-between gap-7 px-[22px] py-[26px] min-[801px]:p-[42px]">
          <div>
            <span className="section-kicker">Dónde estamos</span>
            <h2 className="mt-[14px] mb-4 text-[clamp(32px,3.6vw,48px)] leading-[1.02] tracking-[-0.05em] text-[#000254]">
              Nuestro punto de
              <br />
              <span className="text-[#01317b]">encuentro.</span>
            </h2>
            <p className="m-0 text-[15px] leading-[1.68] text-[#627089]">
              Realizamos nuestras reuniones habituales y actividades de grupo en los locales de la Parroquia de
              Nuestra Señora de los Ángeles y San José de Calasanz, en el corazón de Montequinto.
            </p>

            <div className="mt-6 flex items-start gap-[14px] rounded-[18px] border border-[#e4e9f1] bg-[#f5f7fb] px-5 py-[18px]">
              <span
                className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-white text-[#e22328] shadow-[0_4px_12px_rgba(0,5,84,0.06)]"
                aria-hidden="true"
              >
                <MapPin size={20} />
              </span>
              <div>
                <strong className="block text-[14px] leading-[1.4] text-[#000254]">{MEETING_PLACE.name}</strong>
                <span className="mt-1 block text-[13px] leading-[1.5] text-[#627089]">{MEETING_PLACE.address}</span>
              </div>
            </div>

            <div className="mt-[18px] flex items-center gap-[14px] rounded-[16px] border border-[#e4e9f1] bg-white py-2.5 pr-[14px] pl-2.5">
              <img
                src={image.src}
                alt={image.alt}
                className="h-[52px] w-[72px] flex-none rounded-[11px] object-cover object-[center_40%]"
                loading="lazy"
                decoding="async"
              />
              <span className="text-[12px] leading-[1.5] text-[#627089]">
                Lugar de reunión de nuestras ramas y familias cada fin de semana.
              </span>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 min-[801px]:w-auto">
            <a
              href={MEETING_PLACE.mapsShortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary w-full min-[801px]:w-auto"
            >
              <Navigation size={16} /> Abrir en Google Maps y cómo llegar
            </a>
          </div>
        </div>

        <div className="relative min-h-[320px] border-t border-[#e4e9f1] bg-[#f5f7fb] min-[801px]:min-h-[460px] min-[801px]:border-t-0 min-[801px]:border-l">
          <iframe
            title="Mapa interactivo de la Parroquia Ntra. Sra. de los Ángeles y San José de Calasanz, lugar de reuniones del Grupo IV Scout"
            src={MEETING_PLACE.embedUrl}
            className="block h-full min-h-[320px] w-full border-0 min-[801px]:min-h-[460px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
