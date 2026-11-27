import { ArrowRight, Compass, Leaf, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroSlider from '../components/home/HeroSlider';
import { homeImages } from '../config/images/homeImages';

const values = [
  { icon: Compass, title: 'Aventura con propósito', text: 'Aprendemos haciendo, al aire libre y con curiosidad.' },
  { icon: Users, title: 'Una comunidad', text: 'Familias, educandos y responsables creciendo juntos.' },
  { icon: Leaf, title: 'Cuidamos lo que importa', text: 'Naturaleza, entorno y compromiso con nuestro barrio.' },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="page-width grid min-h-0 grid-cols-1 items-center gap-5 pt-[55px] pb-[60px] min-[801px]:min-h-[650px] min-[801px]:grid-cols-[1.05fr_0.95fr] min-[801px]:gap-[50px] min-[801px]:pt-[62px] min-[801px]:pb-[72px]">
        <div className="reveal">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Grupo Scout San José de Calasanz
          </span>
          <h1 className="mt-5 mb-[18px] text-[clamp(47px,14vw,70px)] leading-[0.98] tracking-[-0.065em] text-[#000254] min-[801px]:text-[clamp(47px,6vw,78px)]">
            Crecer juntos.
            <br />
            <em className="not-italic text-[#01317b]">Explorar siempre.</em>
          </h1>
          <p className="m-0 max-w-[490px] text-[15px] leading-[1.65] text-[#627089] min-[801px]:text-[17px]">
            Educando en el tiempo libre desde 1980 en Montequinto. Un lugar para descubrir lo que eres capaz de hacer,
            acompañado.
          </p>
          <div className="mt-[31px] flex flex-col items-start gap-[18px] min-[801px]:flex-row min-[801px]:items-center min-[801px]:gap-[25px]">
            <Link to="/solicitud" className="button button-primary">
              Solicitar plaza <ArrowRight size={17} />
            </Link>
            <Link
              to="/about"
              className="group inline-flex items-center gap-2 text-[13px] font-bold text-[#01317b] no-underline"
            >
              Conoce nuestra historia{' '}
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-[34px] flex items-center gap-3 text-[11px] text-[#8b96aa] min-[801px]:mt-[52px]">
            <span>Dos Hermanas · Sevilla</span>
            <span className="h-px w-7 bg-[#cbd3df]" />
            <span>Más de 40 años acompañando</span>
          </div>
        </div>

        <div className="reveal reveal-delay relative grid min-h-[350px] place-items-center min-[801px]:min-h-[450px]">
          <HeroSlider images={homeImages.hero} />
        </div>
      </section>

      <section className="page-width pt-[65px] pb-[75px] min-[801px]:pt-[90px] min-[801px]:pb-[112px]">
        <div className="section-kicker">Nuestra forma de vivir</div>
        <div className="mt-[21px] grid grid-cols-1 items-end gap-5 min-[801px]:grid-cols-2 min-[801px]:gap-[60px]">
          <h2 className="m-0 text-[clamp(37px,4vw,57px)] leading-[0.98] tracking-[-0.06em] text-[#000254]">
            Un grupo para
            <br />
            <span className="text-[#01317b]">toda la vida.</span>
          </h2>
          <p className="m-0 mb-[3px] max-w-[450px] text-[16px] leading-[1.7] text-[#627089]">
            El escultismo nos enseña a mirar más lejos, a confiar en el equipo y a dejar cada lugar un poco mejor de
            como lo encontramos. Aquí cada etapa tiene su propia aventura.
          </p>
        </div>

        <div className="mt-[35px] grid grid-cols-1 gap-5 min-[801px]:mt-[65px] min-[801px]:grid-cols-3 min-[801px]:gap-4">
          {values.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-[20px] border border-[#e4e9f1] bg-white p-[26px] transition-all duration-250 hover:-translate-y-[5px] hover:shadow-[0_18px_50px_rgba(0,5,84,0.09)]"
            >
              <Icon size={22} className="text-[#e22328]" />
              <h3 className="mt-7 mb-2 text-[15px] text-[#000254]">{title}</h3>
              <p className="m-0 text-[13px] leading-[1.6] text-[#627089]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
