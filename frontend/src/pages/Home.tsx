import { ArrowRight, Compass, Heart, Leaf, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

const values = [
  { icon: Compass, title: 'Aventura con propósito', text: 'Aprendemos haciendo, al aire libre y con curiosidad.' },
  { icon: Users, title: 'Una comunidad', text: 'Familias, educandos y scouters creciendo juntos.' },
  { icon: Leaf, title: 'Cuidamos lo que importa', text: 'Naturaleza, entorno y compromiso con nuestro barrio.' },
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero page-width">
        <div className="hero-copy reveal">
          <span className="eyebrow"><span className="eyebrow-dot" /> Grupo Scout San José de Calasanz</span>
          <h1>Crecer juntos.<br /><em>Explorar siempre.</em></h1>
          <p>Educando en el tiempo libre desde 1980 en Montequinto. Un lugar para descubrir lo que eres capaz de hacer, acompañado.</p>
          <div className="hero-actions">
            <Link to="/solicitud" className="button button-primary">Solicitar plaza <ArrowRight size={17} /></Link>
            <Link to="/about" className="text-link">Conoce nuestra historia <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-meta"><span>Dos Hermanas · Sevilla</span><span className="meta-line" /><span>Más de 40 años acompañando</span></div>
        </div>
        <div className="hero-visual reveal reveal-delay">
          <div className="hero-glow" />
          <div className="hero-card"><img src={heroImage} alt="Ilustración del espíritu scout" /></div>
          <div className="hero-badge"><Heart size={16} fill="currentColor" /> Siempre listos</div>
        </div>
      </section>

      <section className="intro-section page-width">
        <div className="section-kicker">Nuestra forma de vivir</div>
        <div className="intro-grid">
          <h2>Un grupo para<br /><span>toda la vida.</span></h2>
          <p>El escultismo nos enseña a mirar más lejos, a confiar en el equipo y a dejar cada lugar un poco mejor de como lo encontramos. Aquí cada etapa tiene su propia aventura.</p>
        </div>
        <div className="value-grid">
          {values.map(({ icon: Icon, title, text }) => (
            <article className="value-card" key={title}><Icon size={22} /><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="page-width dark-band-inner">
          <div><span className="section-kicker light">Tu próxima aventura empieza aquí</span><h2>¿Te unes?</h2></div>
          <Link to="/solicitud" className="button button-light">Conoce el proceso <ArrowRight size={17} /></Link>
        </div>
      </section>
    </div>
  );
}
