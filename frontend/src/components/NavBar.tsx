import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, LogOut, Settings, UserRound } from 'lucide-react';
import logo from '../assets/logoIV.jpeg';

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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (to: string) => location.pathname === to || (to === '/home' && location.pathname === '/');

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

        <button type="button" className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`mobile-drawer ${open ? 'is-open' : ''}`}>
        <nav aria-label="Navegación móvil">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? 'mobile-link active' : 'mobile-link'} onClick={() => setOpen(false)}>{link.label}</Link>
          ))}
          <Link to="/gestion" className="mobile-link" onClick={() => setOpen(false)}>Gestión <ChevronDown size={16} /></Link>
          <Link to="/editProfile" className="mobile-link" onClick={() => setOpen(false)}>Perfil</Link>
        </nav>
      </div>
      {open && <button type="button" className="mobile-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}
    </header>
  );
}
