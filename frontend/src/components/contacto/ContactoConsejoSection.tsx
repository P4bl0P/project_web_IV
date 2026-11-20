import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ContactoImageAsset } from '../../config/images/contactoImages';

interface ContactoConsejoSectionProps {
  image: ContactoImageAsset;
}

export default function ContactoConsejoSection({ image }: ContactoConsejoSectionProps) {
  return (
    <section className="page-width pt-1 pb-16 min-[801px]:pt-3 min-[801px]:pb-[92px]">
      <div className="grid grid-cols-1 items-center gap-6 rounded-[28px] border border-[#e4e9f1] bg-[linear-gradient(135deg,#ffffff_0%,#f5f7fb_100%)] p-[22px] shadow-[0_14px_40px_rgba(0,5,84,0.07)] min-[801px]:grid-cols-[0.95fr_1.05fr] min-[801px]:gap-11 min-[801px]:p-9">
        <div className="relative aspect-[16/11] overflow-hidden rounded-[22px] bg-[#e8eef7] shadow-[0_16px_36px_rgba(0,5,84,0.12)]">
          <img
            src={image.src}
            alt={image.alt}
            className="block h-full w-full object-cover object-[center_22%]"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-[7px] rounded-full border border-white/[0.72] bg-[#000254]/[0.58] px-[13px] py-2 text-[11px] font-extrabold text-white backdrop-blur-[8px]">
            <Users size={15} /> Consejo de Grupo
          </span>
        </div>

        <div className="grid justify-items-start gap-4">
          <span className="section-kicker">Nuestro equipo</span>
          <h2 className="m-0 text-[clamp(30px,3.4vw,44px)] leading-[1.04] tracking-[-0.05em] text-[#000254]">
            Las personas que están detrás de todo esto
          </h2>
          <p className="m-0 max-w-[480px] text-[15px] leading-[1.7] text-[#627089]">
            Nuestro Consejo de Grupo coordina, cuida y acompaña de forma voluntaria toda la actividad educativa y
            organizativa para que cada sábado y cada campamento sean una experiencia inolvidable.
          </p>
          <div className="mt-1.5 flex w-full flex-wrap items-center gap-3 min-[801px]:w-auto">
            <Link to="/about" className="button button-primary w-full min-[801px]:w-auto">
              Conoce a nuestro Consejo <ArrowRight size={17} />
            </Link>
            <Link
              to="/solicitud"
              className="button button-ghost w-full hover:border-[#b7c8e0] hover:bg-[#f5f7fb] min-[801px]:w-auto"
            >
              Ir a la solicitud inicial <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
