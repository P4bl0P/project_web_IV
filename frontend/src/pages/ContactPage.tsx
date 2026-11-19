import { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, Heart, Mail, MapPin, Navigation, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPhoto from '../assets/scout-04.jpg';
import parishPhoto from '../assets/scout-02.jpg';
import councilPhoto from '../assets/scout-01.jpg';

type BrandIconProps = SVGProps<SVGSVGElement> & { size?: number };

function BrandIcon({ size = 24, children, ...props }: BrandIconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function InstagramIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </BrandIcon>
  );
}

function FacebookIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BrandIcon>
  );
}

const socialChannels = [
  {
    id: 'instagram',
    platform: 'Instagram',
    handle: '@scoutsmonte5',
    description: 'Fotografías, historias, acampadas y el día a día de nuestras ramas y actividades.',
    cta: 'Abrir perfil en Instagram',
    href: 'https://www.instagram.com/scoutsmonte5?gwpx=ZDNlZDc0MzIxNw==',
    Icon: InstagramIcon,
  },
  {
    id: 'facebook',
    platform: 'Facebook',
    handle: 'Scouts Montequinto',
    description: 'Noticias del grupo, comunicados importantes y recuerdos compartidos con toda la comunidad scout.',
    cta: 'Visitar página en Facebook',
    href: 'https://www.facebook.com/scoutsmontequinto',
    Icon: FacebookIcon,
  },
] as const;

const emailChannels = [
  {
    id: 'general',
    badge: 'Consultas generales y vida de grupo',
    title: 'Correo general del grupo',
    description:
      'Para dudas sobre el funcionamiento del grupo, actividades, ramas, colaboraciones o cualquier consulta general.',
    address: 'scoutsmonte5@scoutsdesevilla.com',
    actionLabel: 'Escribir correo',
  },
  {
    id: 'secretaria',
    badge: 'Trámites, documentación e inscripciones',
    title: 'Correo de Secretaría',
    description:
      'Para gestiones administrativas, entrega de documentación, censo, solicitudes de ingreso y trámites oficiales.',
    address: 'papelescoutiv@gmail.com',
    actionLabel: 'Escribir a Secretaría',
  },
] as const;

const MEETING_PLACE = {
  name: 'Parroquia Ntra. Sra. de los Ángeles y San José de Calasanz',
  address: 'Av. Madre Paula Montalt, 53 · 41089 Montequinto, Dos Hermanas (Sevilla)',
  mapsShortUrl: 'https://maps.app.goo.gl/jE9tWnEtScSFkFj4A',
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.3396!2d-5.932874!3d37.3407642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd126fc82ba7bc0b%3A0x19e47185798f9af7!2sParroquia%20Ntra.%20Sra.%20de%20los%20%C3%81ngeles%20y%20San%20Jos%C3%A9%20de%20Calasanz!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses',
} as const;

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when Clipboard API is blocked by browser permissions.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function ContactPage() {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== undefined) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async (address: string) => {
    const copied = await copyTextToClipboard(address);
    if (!copied) return;

    setCopiedEmail(address);
    if (copyTimerRef.current !== undefined) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedEmail(null);
    }, 2500);
  };

  return (
    <div className="contact-page">
      {/* A. Hero principal */}
      <section className="home-hero contact-hero page-width">
        <div className="hero-copy reveal">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Grupo Scout San José de Calasanz · Contacto
          </span>
          <h1>
            Estamos aquí
            <br />
            <em>para ti</em>
          </h1>
          <p>
            ¿Tienes alguna duda sobre el grupo, las etapas o cómo participar? Escríbenos, síguenos en redes o
            acércate a conocernos en Montequinto. Estaremos encantados de escucharte.
          </p>
          <div className="hero-actions">
            <a href="#canales-contacto" className="button button-primary">
              Canales de contacto <ArrowRight size={17} />
            </a>
            <a href="#donde-estamos" className="text-link contact-hero-link">
              Ver dónde estamos <MapPin size={16} />
            </a>
          </div>
          <div className="hero-meta">
            <span>Montequinto · Dos Hermanas</span>
            <span className="meta-line" />
            <span>Sábados de actividad scout</span>
          </div>
        </div>

        <div className="hero-visual reveal reveal-delay">
          <div className="hero-glow" />
          <div className="hero-card contact-hero-card">
            <img
              src={heroPhoto}
              alt="Scouts del Grupo IV en ruta al aire libre"
              className="hero-slide is-active contact-hero-image"
              loading="eager"
              decoding="async"
            />
            <div className="hero-slide-shade" />
            <div className="hero-slide-caption">
              <strong>Cerca de ti en cada etapa</strong>
            </div>
            <div className="hero-badge">
              <Heart size={16} fill="currentColor" /> Siempre listos
            </div>
          </div>
        </div>
      </section>

      {/* B. Redes sociales */}
      <section id="canales-contacto" className="contact-section page-width">
        <div className="section-kicker">Síguenos de cerca</div>
        <div className="intro-grid">
          <h2>
            Nuestro día a día,
            <br />
            <span>en comunidad.</span>
          </h2>
          <p>
            Compartimos nuestras acampadas, actividades de sábado, avisos y momentos en familia a través de nuestras
            redes oficiales.
          </p>
        </div>

        <div className="contact-social-grid">
          {socialChannels.map(({ id, platform, handle, description, cta, href, Icon }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`contact-social-card contact-social-card--${id}`}
            >
              <div className="contact-social-top">
                <span className="contact-social-icon">
                  <Icon size={24} />
                </span>
                <span className="contact-social-arrow" aria-hidden="true">
                  <ArrowUpRight size={18} />
                </span>
              </div>

              <div className="contact-social-body">
                <span className="contact-social-platform">{platform}</span>
                <h3>{handle}</h3>
                <p>{description}</p>
              </div>

              <span className="contact-social-cta">
                {cta} <ArrowUpRight size={16} />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* C. Correos electrónicos */}
      <section className="contact-section contact-section-soft">
        <div className="page-width">
          <div className="section-kicker">Escríbenos directamente</div>
          <div className="intro-grid">
            <h2>
              Un correo para
              <br />
              <span>cada consulta.</span>
            </h2>
            <p>
              Elige el buzón adecuado según lo que necesites para que podamos responderte de la forma más ágil posible.
            </p>
          </div>

          <div className="contact-email-grid">
            {emailChannels.map(({ id, badge, title, description, address, actionLabel }) => {
              const isCopied = copiedEmail === address;

              return (
                <article key={id} className="contact-email-card">
                  <div className="contact-email-header">
                    <span className="contact-email-icon" aria-hidden="true">
                      <Mail size={22} />
                    </span>
                    <span className="role-pill">{badge}</span>
                  </div>

                  <h3>{title}</h3>
                  <p>{description}</p>

                  <div className="contact-email-address">
                    <code>{address}</code>
                  </div>

                  <div className="contact-email-actions">
                    <a href={`mailto:${address}`} className="button button-primary">
                      <Mail size={16} /> {actionLabel}
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleCopyEmail(address)}
                      className={`button button-ghost contact-copy-btn ${isCopied ? 'is-copied' : ''}`}
                      aria-label={`Copiar dirección ${address}`}
                    >
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <span className="sr-only" aria-live="polite">
                    {isCopied ? `Dirección ${address} copiada al portapapeles.` : ''}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* D. Dónde estamos */}
      <section id="donde-estamos" className="contact-section page-width">
        <div className="contact-location-card">
          <div className="contact-location-info">
            <div>
              <span className="section-kicker">Dónde estamos</span>
              <h2>
                Nuestro punto de
                <br />
                <span>encuentro.</span>
              </h2>
              <p className="contact-location-lead">
                Realizamos nuestras reuniones habituales y actividades de grupo en los locales de la Parroquia de
                Nuestra Señora de los Ángeles y San José de Calasanz, en el corazón de Montequinto.
              </p>

              <div className="contact-address-box">
                <span className="contact-address-pin" aria-hidden="true">
                  <MapPin size={20} />
                </span>
                <div>
                  <strong>{MEETING_PLACE.name}</strong>
                  <span>{MEETING_PLACE.address}</span>
                </div>
              </div>

              <div className="contact-parish-preview">
                <img
                  src={parishPhoto}
                  alt="Scouts del Grupo IV frente a las puertas de la parroquia"
                  loading="lazy"
                  decoding="async"
                />
                <span>Lugar de reunión de nuestras ramas y familias cada fin de semana.</span>
              </div>
            </div>

            <div className="contact-location-actions">
              <a
                href={MEETING_PLACE.mapsShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
              >
                <Navigation size={16} /> Abrir en Google Maps y cómo llegar
              </a>
            </div>
          </div>

          <div className="contact-map-frame">
            <iframe
              title="Mapa interactivo de la Parroquia Ntra. Sra. de los Ángeles y San José de Calasanz, lugar de reuniones del Grupo IV Scout"
              src={MEETING_PLACE.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* E. Conoce a nuestro Consejo */}
      <section className="contact-section contact-council-section page-width">
        <div className="contact-council-card">
          <div className="contact-council-media">
            <img
              src={councilPhoto}
              alt="Equipo de scouters y educandos del Grupo IV Scout"
              loading="lazy"
              decoding="async"
            />
            <span className="contact-council-badge">
              <Users size={15} /> Consejo de Grupo
            </span>
          </div>

          <div className="contact-council-copy">
            <span className="section-kicker">Nuestro equipo</span>
            <h2>Las personas que están detrás de todo esto</h2>
            <p>
              Nuestro Consejo de Grupo coordina, cuida y acompaña de forma voluntaria toda la actividad educativa y
              organizativa para que cada sábado y cada campamento sean una experiencia inolvidable.
            </p>
            <div className="contact-council-actions">
              <Link to="/about" className="button button-primary">
                Conoce a nuestro Consejo <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* F. Cierre de página */}
      <section className="dark-band">
        <div className="page-width dark-band-inner">
          <div>
            <span className="section-kicker light">Da el siguiente paso</span>
            <h2>¿Quieres formar parte del Grupo IV?</h2>
            <p className="dark-band-text">
              Si quieres conocer nuestro proyecto educativo e iniciar el proceso de incorporación al grupo, completa
              nuestra solicitud inicial.
            </p>
          </div>
          <Link to="/solicitud" className="button button-light">
            Ir a la solicitud inicial <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
