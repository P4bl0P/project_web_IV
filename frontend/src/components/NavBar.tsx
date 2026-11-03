import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, LogOut, Settings, UserRound } from 'lucide-react';
import logo from '../assets/logoIV.jpeg';
import flower from '../assets/flor_lis.png';

const links = [
  { label: 'Inicio', to: '/home' },
  { label: 'Conócenos', to: '/about' },
  { label: 'Contacto', to: '/contact' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 800) setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [open]);

  const isActive = (to: string) => location.pathname === to || (to === '/home' && location.pathname === '/');
  const closeMobileMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="nav-container">
        <Link to="/home" className="brand" aria-label="Grupo IV Scout Montequinto">
          <img src={logo} alt="" className="brand-mark" />
          <span className="brand-copy">
            <strong>Grupo IV</strong>
            <span>Scout Montequinto</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Navegación principal">
          <Link to="/login" className="nav-flower" aria-label="Acceder al área privada"><img src={flower} alt="Acceso al área privada" /></Link>
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? 'nav-link active' : 'nav-link'} onClick={() => setManagementOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="nav-menu">
            <button type="button" className="nav-link nav-menu-trigger" onClick={() => setManagementOpen((value) => !value)} aria-expanded={managementOpen}>
              Gestión <ChevronDown size={15} className={managementOpen ? 'rotate-180' : ''} />
            </button>
            <div className={`nav-popover ${managementOpen ? 'is-open' : ''}`}>
              <Link to="/gestion"><Settings size={16} /> Panel de gestión</Link>
              <Link to="/editProfile"><UserRound size={16} /> Perfil</Link>
              <button type="button" onClick={() => navigate('/home')}><LogOut size={16} /> Cerrar sesión</button>
            </div>
          </div>
        </nav>

        <button ref={menuButtonRef} type="button" className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="mobile-navigation">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div id="mobile-navigation" className={`mobile-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="mobile-drawer-head">
          <span>Menú</span>
          <button type="button" className="mobile-close-button" onClick={closeMobileMenu} aria-label="Cerrar menú">
            <X size={19} />
          </button>
        </div>
        <nav aria-label="Navegación móvil">
          {links.map((link) => (
            <Link key={link.to} to={link.to} tabIndex={open ? 0 : -1} className={isActive(link.to) ? 'mobile-link active' : 'mobile-link'} onClick={closeMobileMenu}>{link.label}</Link>
          ))}
          <Link to="/gestion" tabIndex={open ? 0 : -1} className="mobile-link" onClick={closeMobileMenu}>Gestión <ChevronDown size={16} /></Link>
          <Link to="/editProfile" tabIndex={open ? 0 : -1} className="mobile-link" onClick={closeMobileMenu}>Perfil</Link>
        </nav>
      </div>
      {open && <button type="button" className="mobile-backdrop" onClick={closeMobileMenu} aria-label="Cerrar menú" />}
    </header>
  );
}
