import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Heart, Leaf, Pause, Play, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

const scoutAssetModules = import.meta.glob('../assets/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const scoutAssetsByName = Object.entries(scoutAssetModules).reduce<Record<string, string>>((assets, [path, url]) => {
  const name = path.split('/').pop();
  if (name) assets[name] = url;
  return assets;
}, {});

type HeroSlide = {
  file: string;
  alt: string;
  caption: string;
};

// Add future photographs here. Missing files safely fall back to hero.png until uploaded.
const heroSlides: HeroSlide[] = [
  { file: 'scout-01.jpg', alt: 'Actividad del Grupo IV Scout', caption: 'Aventura que se comparte' },
  { file: 'scout-02.jpg', alt: 'Scouts del Grupo IV en una actividad', caption: 'Aprender haciendo' },
  { file: 'scout-03.jpg', alt: 'Campamento del Grupo IV Scout', caption: 'Siempre un poco más lejos' },
  { file: 'scout-04.jpg', alt: 'Comunidad del Grupo IV Scout', caption: 'Una comunidad para crecer' },
  { file: 'scout-05.jpg', alt: 'Naturaleza y escultismo en el Grupo IV', caption: 'Dejamos huella, no residuos' },
];

const values = [
  { icon: Compass, title: 'Aventura con propósito', text: 'Aprendemos haciendo, al aire libre y con curiosidad.' },
  { icon: Users, title: 'Una comunidad', text: 'Familias, educandos y scouters creciendo juntos.' },
  { icon: Leaf, title: 'Cuidamos lo que importa', text: 'Naturaleza, entorno y compromiso con nuestro barrio.' },
];

function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const interactionTimeout = useRef<number | undefined>(undefined);
  const resolvedSlides = useMemo(
    () => {
      const availableSlides = heroSlides
        .filter((slide) => scoutAssetsByName[slide.file])
        .map((slide) => ({ ...slide, src: scoutAssetsByName[slide.file], isFallback: false }));
      return availableSlides.length > 0
        ? availableSlides
        : [{ file: 'hero.png', alt: 'Ilustración del espíritu scout', caption: 'Siempre listos', src: heroImage, isFallback: true }];
    },
    [],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || resolvedSlides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % resolvedSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, resolvedSlides.length]);

  useEffect(() => () => {
    if (interactionTimeout.current) window.clearTimeout(interactionTimeout.current);
  }, []);

  const interact = (nextIndex?: number) => {
    if (nextIndex !== undefined) setActiveIndex(nextIndex);
    setPaused(true);
    if (interactionTimeout.current) window.clearTimeout(interactionTimeout.current);
    interactionTimeout.current = window.setTimeout(() => setPaused(false), 9000);
  };

  const move = (direction: 1 | -1) => {
    interact((activeIndex + direction + resolvedSlides.length) % resolvedSlides.length);
  };

  return (
    <div className="hero-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="hero-glow" />
      <div className="hero-card">
        {resolvedSlides.map((slide, index) => (
          <img
            key={slide.file}
            src={slide.src}
            alt={slide.alt}
            className={`hero-slide ${index === activeIndex ? 'is-active' : ''} ${slide.isFallback ? 'is-fallback' : ''}`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
        <div className="hero-slide-shade" />
      </div>
      <div className="hero-slider-toolbar">
        <button type="button" className="hero-control" onClick={() => move(-1)} aria-label="Fotografía anterior"><ArrowLeft size={17} /></button>
        <div className="hero-slide-caption">
          <strong>{resolvedSlides[activeIndex].caption}</strong>
          <span>{activeIndex + 1} / {resolvedSlides.length}</span>
        </div>
        <button type="button" className="hero-control" onClick={() => move(1)} aria-label="Fotografía siguiente"><ArrowRight size={17} /></button>
      </div>
      <div className="hero-slider-footer">
        <div className="hero-indicators" role="tablist" aria-label="Fotografías del hero">
          {resolvedSlides.map((slide, index) => (
            <button key={slide.file} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Mostrar ${slide.caption}`} className={index === activeIndex ? 'is-active' : ''} onClick={() => interact(index)} />
          ))}
        </div>
        <button type="button" className="hero-pause" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}>
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </div>
  );
}

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
        <div className="hero-visual reveal reveal-delay"><HeroSlider /><div className="hero-badge"><Heart size={16} fill="currentColor" /> Siempre listos</div></div>
      </section>

      <section className="intro-section page-width">
        <div className="section-kicker">Nuestra forma de vivir</div>
        <div className="intro-grid">
          <h2>Un grupo para<br /><span>toda la vida.</span></h2>
          <p>El escultismo nos enseña a mirar más lejos, a confiar en el equipo y a dejar cada lugar un poco mejor de como lo encontramos. Aquí cada etapa tiene su propia aventura.</p>
        </div>
        <div className="value-grid">{values.map(({ icon: Icon, title, text }) => <article className="value-card" key={title}><Icon size={22} /><h3>{title}</h3><p>{text}</p></article>)}</div>
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
