import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import flower from '../assets/flor_lis.png';
import logo from '../assets/logoIV.jpeg';
import { EMAIL_CHANNELS, MEETING_PLACE, SOCIAL_CHANNELS } from './publicContactData';
import { SocialPlatformIcon } from './ui/SocialIcons';

export default function Footer() {
  return (
    <footer className="site-footer" aria-label="Pie de página público">
      <div className="page-width site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/home" className="site-footer-logo">
              <img src={logo} alt="" className="brand-mark" />
              <span className="site-footer-logo-copy">
                <strong>Grupo IV</strong>
                <span>Scout Montequinto · San José de Calasanz</span>
              </span>
            </Link>
            <p className="site-footer-summary">
              Educando en el tiempo libre y en valores desde 1980 en Montequinto, Dos Hermanas (Sevilla).
            </p>
            <a
              href={MEETING_PLACE.mapsShortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-place"
            >
              <MapPin size={15} aria-hidden="true" />
              <span>{MEETING_PLACE.name}</span>
            </a>
          </div>

          <div className="site-footer-col">
            <h2 className="site-footer-heading">Correos electrónicos</h2>
            <div className="site-footer-list">
              {EMAIL_CHANNELS.map((email) => (
                <a key={email.id} href={`mailto:${email.address}`} className="site-footer-contact-link">
                  <span className="site-footer-icon-badge" aria-hidden="true">
                    <Mail size={16} />
                  </span>
                  <span className="site-footer-link-copy">
                    <strong>{email.shortLabel}</strong>
                    <span>{email.address}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="site-footer-col">
            <h2 className="site-footer-heading">Redes sociales</h2>
            <div className="site-footer-list">
              {SOCIAL_CHANNELS.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-social-link"
                >
                  <span className={`site-footer-icon-badge site-footer-icon-badge--${social.id}`} aria-hidden="true">
                    <SocialPlatformIcon id={social.id} size={18} />
                  </span>
                  <span className="site-footer-link-copy">
                    <strong>{social.platform}</strong>
                    <span>{social.handle}</span>
                  </span>
                  <ArrowUpRight size={15} className="site-footer-external-arrow" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copyright">
            © {new Date().getFullYear()} Grupo IV Scout San José de Calasanz · Montequinto (Dos Hermanas, Sevilla).
          </p>
          <span className="site-footer-motto">
            <img src={flower} alt="" />
            <span>Siempre listos · Escultismo desde 1980</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
