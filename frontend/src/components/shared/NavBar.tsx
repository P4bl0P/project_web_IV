import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Globe,
  Lock,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserRound,
  X,
} from 'lucide-react';
import { canAccessWebContent, isSuperAdmin, useAuth } from '../../auth';
import type { SharedImagesCatalog } from '../../config/images/sharedImages';

const links = [
  { label: 'Inicio', to: '/home' },
  { label: 'Conócenos', to: '/about' },
  { label: 'Contacto', to: '/contact' },
];

interface NavBarProps {
  images: SharedImagesCatalog;
}

const navFocusRing =
  'focus-visible:outline-3 focus-visible:outline-[#e22328]/35 focus-visible:outline-offset-[3px]';

const desktopLinkBase = `relative inline-flex cursor-pointer items-center gap-[5px] border-0 bg-transparent px-[14px] py-[11px] text-[13px] font-[650] no-underline transition-colors duration-200 ${navFocusRing} after:content-[''] after:absolute after:left-[14px] after:right-[14px] after:bottom-[3px] after:h-[2px] after:rounded-[2px] after:bg-[#e22328] after:transition-transform after:duration-200`;

const popoverItemClass = `flex w-full cursor-pointer items-center justify-between gap-[9px] rounded-[9px] border-0 bg-transparent px-[11px] py-[10px] text-left text-[12px] text-[#0c1933] no-underline hover:bg-[#f5f7fb] hover:text-[#01317b] ${navFocusRing}`;

const mobileLinkBase = `flex w-full cursor-pointer items-center justify-between gap-3 border-0 border-b border-[#eef1f6] bg-transparent px-[11px] py-4 text-left text-[15px] font-bold no-underline ${navFocusRing}`;

export default function NavBar({ images }: NavBarProps) {
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
    return () => {
      document.body.style.overflow = '';
    };
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

  const isActive = (to: string) =>
    location.pathname === to ||
    (to === '/home' && location.pathname === '/') ||
    (to === '/about' && location.pathname === '/conocenos') ||
    (to === '/contact' && location.pathname === '/contacto');

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
  const canWebContent = canAccessWebContent(user, 'canRead');

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e4e9f1]/85 bg-white/95 min-[801px]:bg-white/[0.82] backdrop-blur-[18px]">
      <div className="mx-auto flex h-[68px] w-[min(100%-32px,620px)] items-center gap-3 min-[801px]:h-[76px] min-[801px]:w-[min(1280px,calc(100%-48px))] min-[801px]:gap-[28px]">
        <Link
          to="/home"
          className="group inline-flex min-w-0 items-center gap-[11px] no-underline"
          aria-label="Grupo IV Scout Montequinto"
        >
          <img
            src={images.logo}
            alt=""
            className="h-[43px] w-[43px] rounded-[13px] object-cover shadow-[0_5px_15px_rgba(0,5,84,0.16)] transition-transform duration-300 ease-out group-hover:-rotate-4 group-hover:scale-105"
          />
          <span className="grid leading-[1.1]">
            <strong className="text-[15px] tracking-[-0.02em]">Grupo IV</strong>
            <span className="mt-1 whitespace-nowrap text-[11px] text-[#627089] min-[801px]:whitespace-normal">
              Scout Montequinto
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-end gap-[7px] min-[801px]:flex" aria-label="Navegación principal">
          {links.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`${desktopLinkBase} ${
                  active
                    ? 'text-[#000254] after:scale-x-100'
                    : 'text-[#53617a] after:scale-x-0 hover:text-[#000254] hover:after:scale-x-100'
                }`}
                aria-current={active ? 'page' : undefined}
                onClick={() => setManagementOpen(false)}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}

          {!loading && user && (
            <div className="relative" ref={managementMenuRef}>
              <button
                type="button"
                className={`${desktopLinkBase} text-[#53617a] after:scale-x-0 hover:text-[#000254] hover:after:scale-x-100`}
                onClick={() => setManagementOpen((value) => !value)}
                aria-expanded={managementOpen}
                aria-haspopup="menu"
              >
                Gestión{' '}
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${managementOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`absolute top-[calc(100%+12px)] right-0 w-max min-w-[215px] rounded-[15px] border border-[#e4e9f1] bg-white p-[7px] shadow-[0_18px_50px_rgba(0,5,84,0.09)] transition-all duration-200 ${
                  managementOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible -translate-y-[5px] opacity-0'
                }`}
                role="menu"
              >
                <Link to="/gestion" role="menuitem" className={popoverItemClass}>
                  <span className="inline-flex items-center gap-[9px]">
                    <Settings size={16} /> Panel de gestión
                  </span>
                </Link>
                <Link to="/perfil" role="menuitem" className={popoverItemClass}>
                  <span className="inline-flex items-center gap-[9px]">
                    <UserRound size={16} /> Mi perfil
                  </span>
                </Link>
                <Link
                  to="/gestion/contenido-web"
                  role="menuitem"
                  className={`${popoverItemClass} ${canWebContent ? '' : 'text-[#627089]'}`}
                >
                  <span className="inline-flex items-center gap-[9px]">
                    <Globe size={16} /> Contenido de la web
                  </span>
                  {!canWebContent && <Lock size={13} className="text-[#9aa7ba]" aria-label="Sin acceso" />}
                </Link>
                {isSuperAdmin(user) && (
                  <Link to="/gestion/administracion" role="menuitem" className={popoverItemClass}>
                    <span className="inline-flex items-center gap-[9px]">
                      <Shield size={16} /> Administración
                    </span>
                  </Link>
                )}
                <button type="button" role="menuitem" className={popoverItemClass} onClick={() => void handleLogout()}>
                  <span className="inline-flex items-center gap-[9px]">
                    <LogOut size={16} /> Cerrar sesión
                  </span>
                </button>
              </div>
            </div>
          )}

          <Link
            to={privateDestination}
            className="ml-3 inline-flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:-translate-y-px hover:border-[#e4e9f1] hover:bg-[#f5f7fb]"
            aria-label={privateLabel}
            title={user ? 'Área privada' : 'Iniciar sesión'}
          >
            <img src={images.florLis} alt="" className="h-[27px] w-[27px] object-contain" />
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-[5px] min-[801px]:hidden">
          <Link
            to={privateDestination}
            className="inline-flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:-translate-y-px hover:border-[#e4e9f1] hover:bg-[#f5f7fb]"
            aria-label={privateLabel}
            title={user ? 'Área privada' : 'Iniciar sesión'}
          >
            <img src={images.florLis} alt="" className="h-[25px] w-[25px] object-contain" />
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className={`relative z-[61] grid h-[44px] w-[44px] cursor-pointer place-items-center rounded-[12px] border border-[#e4e9f1] bg-white text-[#000254] ${navFocusRing}`}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`fixed inset-x-0 top-[68px] bottom-auto z-[60] max-h-[calc(100dvh-68px)] overflow-y-auto border-b border-[#e4e9f1] bg-white px-4 pt-[18px] pb-[21px] shadow-[0_18px_30px_rgba(0,5,84,0.12)] transition-[transform,opacity,visibility] duration-300 min-[801px]:hidden ${
          open
            ? 'visible pointer-events-auto translate-y-0 opacity-100'
            : 'invisible pointer-events-none -translate-y-[calc(100%+68px)] opacity-0'
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Navegación móvil">
          {links.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                ref={link === links[0] ? firstMobileLinkRef : undefined}
                to={link.to}
                tabIndex={open ? 0 : -1}
                className={`${mobileLinkBase} ${active ? 'text-[#e22328]' : 'text-[#0c1933]'}`}
                aria-current={active ? 'page' : undefined}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            );
          })}
          {!loading && user && (
            <div className="mt-3 border-t border-[#e4e9f1] pt-2">
              <span className="block px-[11px] pt-[7px] pb-[3px] text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#627089]">
                Área privada
              </span>
              <Link to="/gestion" tabIndex={open ? 0 : -1} className={`${mobileLinkBase} text-[#0c1933]`} onClick={closeMobileMenu}>
                Panel de gestión <Settings size={17} />
              </Link>
              <Link to="/perfil" tabIndex={open ? 0 : -1} className={`${mobileLinkBase} text-[#0c1933]`} onClick={closeMobileMenu}>
                Mi perfil <UserRound size={17} />
              </Link>
              <Link
                to="/gestion/contenido-web"
                tabIndex={open ? 0 : -1}
                className={`${mobileLinkBase} ${canWebContent ? 'text-[#0c1933]' : 'text-[#627089]'}`}
                onClick={closeMobileMenu}
              >
                <span>Contenido de la web</span>
                {canWebContent ? <Globe size={17} /> : <Lock size={16} className="text-[#9aa7ba]" />}
              </Link>
              {isSuperAdmin(user) && (
                <Link to="/gestion/administracion" tabIndex={open ? 0 : -1} className={`${mobileLinkBase} text-[#0c1933]`} onClick={closeMobileMenu}>
                  Administración <Shield size={17} />
                </Link>
              )}
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                className={`${mobileLinkBase} text-[#0c1933]`}
                onClick={() => void handleLogout()}
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </nav>
      </div>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[58] m-0 h-dvh w-screen rounded-none border-0 bg-[#000554]/[0.42] backdrop-blur-[2px] min-[801px]:hidden"
          onClick={closeMobileMenu}
          aria-label="Cerrar menú"
        />
      )}
    </header>
  );
}
