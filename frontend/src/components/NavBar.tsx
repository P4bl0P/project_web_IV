import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, LogOut, Settings } from 'lucide-react';
import logo from '../assets/logoIV.jpeg';
import flower from '../assets/flor_lis.png';
import { useAuth } from '../auth';

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
  const { user, loading, logout } = useAuth();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const managementMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    firstMobileLinkRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const closeOnDesktop = () => { if (window.innerWidth > 800) setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [open]);

  useEffect(() => {
    const closeMenus = window.setTimeout(() => {
      setOpen(false);
      setManagementOpen(false);
    });
    return () => window.clearTimeout(closeMenus);
  }, [location.pathname]);

  useEffect(() => {
    if (!managementOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (managementMenuRef.current && !managementMenuRef.current.contains(event.target as Node)) {
        setManagementOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [managementOpen]);

  const isActive = (to: string) => location.pathname === to || (to === '/home' && location.pathname === '/');
  const closeMobileMenu = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };
  const handleLogout = async () => {
    await logout();
    setManagementOpen(false);
    setOpen(false);
    navigate('/home');
  };
  const privateDestination = user ? '/gestion' : '/login';
  const privateLabel = user ? `Abrir área privada de ${user.name}` : 'Acceder al área privada';

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
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? 'nav-link active' : 'nav-link'} aria-current={isActive(link.to) ? 'page' : undefined} onClick={() => setManagementOpen(false)}>
              <span>{link.label}</span>
            </Link>
          ))}
          {!loading && user && <div className="nav-menu">
            <button type="button" className="nav-link nav-menu-trigger" onClick={() => setManagementOpen((value) => !value)} aria-expanded={managementOpen} aria-haspopup="menu">
              Gestión <ChevronDown size={15} className={managementOpen ? 'rotate-180' : ''} />
            </button>
            <div ref={managementMenuRef} className={`nav-popover ${managementOpen ? 'is-open' : ''}`} role="menu">
              <Link to="/gestion" role="menuitem"><Settings size={16} /> Panel de gestión</Link>
              <button type="button" role="menuitem" onClick={() => void handleLogout()}><LogOut size={16} /> Cerrar sesión</button>
            </div>
          </div>}
          <Link to={privateDestination} className="nav-flower" aria-label={privateLabel} title={user ? 'Área privada' : 'Iniciar sesión'}>
            <img src={flower} alt="" />
          </Link>
        </nav>

        <div className="mobile-actions">
          <Link to={privateDestination} className="nav-flower" aria-label={privateLabel} title={user ? 'Área privada' : 'Iniciar sesión'}>
            <img src={flower} alt="" />
          </Link>
          <button ref={menuButtonRef} type="button" className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="mobile-navigation">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div id="mobile-navigation" className={`mobile-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
        <nav aria-label="Navegación móvil">
          {links.map((link) => (
            <Link key={link.to} ref={link === links[0] ? firstMobileLinkRef : undefined} to={link.to} tabIndex={open ? 0 : -1} className={isActive(link.to) ? 'mobile-link active' : 'mobile-link'} aria-current={isActive(link.to) ? 'page' : undefined} onClick={closeMobileMenu}>{link.label}</Link>
          ))}
          {!loading && user && <div className="mobile-private-section">
            <span className="mobile-section-label">Área privada</span>
            <Link to="/gestion" tabIndex={open ? 0 : -1} className="mobile-link" onClick={closeMobileMenu}>Panel de gestión <Settings size={17} /></Link>
            <button type="button" tabIndex={open ? 0 : -1} className="mobile-link" onClick={() => void handleLogout()}><LogOut size={16} /> Cerrar sesión</button>
          </div>}
        </nav>
      </div>
      {open && <button type="button" className="mobile-backdrop" onClick={closeMobileMenu} aria-label="Cerrar menú" />}
    </header>
  );
}
