import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, Heart, Mail, MapPin, Navigation, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPhoto from '../assets/scout-04.jpg';
import parishPhoto from '../assets/scout-02.jpg';
import councilPhoto from '../assets/scout-01.jpg';
import { EMAIL_CHANNELS, MEETING_PLACE, SOCIAL_CHANNELS } from '../components/publicContactData';
import { SocialPlatformIcon } from '../components/ui/SocialIcons';

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
      {/* A. Cabecera editorial propia de Contacto */}
      <header className="contact-header page-width">
        <div className="contact-header-top reveal">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Contacto · Grupo IV Scout San José de Calasanz
          </span>
          <div className="contact-header-grid">
            <h1>
              Estamos aquí <em>para ti.</em>
            </h1>
            <p className="contact-header-lead">
              ¿Tienes alguna duda sobre el grupo, las etapas educativas o cómo participar? Escríbenos por nuestros
              canales oficiales, síguenos en redes o acércate a conocernos los sábados en Montequinto.
            </p>
          </div>
        </div>

        <div className="contact-header-showcase reveal reveal-delay">
          <div className="contact-showcase-media">
            <img
              src={heroPhoto}
              alt="Scouts del Grupo IV en ruta al aire libre"
              className="contact-showcase-image"
              loading="eager"
              decoding="async"
            />
            <div className="contact-showcase-overlay" aria-hidden="true" />
            <div className="contact-showcase-badges">
              <span className="contact-showcase-pill">
                <MapPin size={14} aria-hidden="true" /> Montequinto · Dos Hermanas (Sevilla)
              </span>
              <span className="contact-showcase-pill contact-showcase-pill--accent">
                <Heart size={14} fill="currentColor" aria-hidden="true" /> Sábados de actividad scout
              </span>
            </div>
          </div>

          <nav className="contact-quick-bar" aria-label="Accesos rápidos de contacto">
            <a href="#canales-contacto" className="contact-quick-link">
              <span className="contact-quick-copy">
                <strong>Redes sociales</strong>
                <span>@scoutsmonte5 y Facebook</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>

            <a href="#correos-contacto" className="contact-quick-link">
              <span className="contact-quick-copy">
                <strong>Correos electrónicos</strong>
                <span>General y Secretaría</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>

            <a href="#donde-estamos" className="contact-quick-link">
              <span className="contact-quick-copy">
                <strong>Dónde estamos</strong>
                <span>Parroquia en Montequinto</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>

            <Link to="/solicitud" className="contact-quick-link contact-quick-link--highlight">
              <span className="contact-quick-copy">
                <strong>Solicitud inicial</strong>
                <span>Solicitar plaza en el grupo</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

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
          {SOCIAL_CHANNELS.map(({ id, platform, handle, description, cta, href }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`contact-social-card contact-social-card--${id}`}
            >
              <div className="contact-social-top">
                <span className="contact-social-icon">
                  <SocialPlatformIcon id={id} size={24} />
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
      <section id="correos-contacto" className="contact-section contact-section-soft">
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
            {EMAIL_CHANNELS.map(({ id, badge, title, description, address, actionLabel }) => {
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
              <Link to="/solicitud" className="button button-ghost">
                Ir a la solicitud inicial <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
