import { useState, useEffect, useCallback, memo } from 'react';
import { Squash as Hamburger } from 'hamburger-react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, ChevronDown } from 'lucide-react';
// Asegúrate de tener estas imágenes en tu carpeta src/assets/
import logo from '../assets/logoIV.jpeg';
import loginIcon from '../assets/flor_lis.png';

const styles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes navbarSlideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .navbar-animated { animation: navbarSlideDown 0.6s ease-out; }
`;

interface NavButtonProps {
  text: string;
  to: string;
  onClick?: () => void;
}

const NavButton = memo(({ text, to, onClick }: NavButtonProps) => (
  <Link
    to={to}
    onClick={onClick}
    className='group relative block text-white px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden'
  >
    <span className='relative z-10 font-medium group-hover:scale-105 inline-block transition-transform duration-300'>
      {text}
    </span>
    <span className='absolute bottom-0 left-1/2 h-0.5 w-0 bg-white group-hover:w-full group-hover:left-0 transition-all duration-300' />
  </Link>
));
NavButton.displayName = 'NavButton';

const LogoButton = memo(() => (
  <Link to='/home' className='group relative'>
    <div className='relative'>
      <div className='absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 blur-md transition-all duration-500 scale-0 group-hover:scale-110' />
      <img
        src={logo}
        alt='Logo Grupo IV'
        className='h-10 rounded-full object-cover ml-2 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3'
      />
    </div>
  </Link>
));
LogoButton.displayName = 'LogoButton';

const LoginButton = memo(({ onClick }: { onClick?: () => void }) => (
  <Link to='/login' onClick={onClick} className='group relative'>
    <div className='absolute inset-0 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 scale-75 group-hover:scale-150' />
    <img
      src={loginIcon}
      alt='Login'
      className='h-8 cursor-pointer transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10'
    />
  </Link>
));
LoginButton.displayName = 'LoginButton';

const GestionMenu = memo(({ onClick, onLogout }: { onClick?: () => void, onLogout: () => void }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.gestion-menu')) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    onClick?.();
  }, [onClick]);

  return (
    <div className='relative gestion-menu'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 hover:bg-white/10 active:scale-95'
      >
        Gestión
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg overflow-hidden transform origin-top-right transition-all duration-200 ease-out
          ${open ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'}
        `}
      >
        <div className='py-1'>
          <Link to='/gestion' className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50' onClick={closeMenu}>
            <Settings size={18} className='text-indigo-600' />
            <span className='font-medium'>Ir a gestión</span>
          </Link>
          <Link to='/editProfile' className='flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50' onClick={closeMenu}>
            <User size={18} className='text-indigo-600' />
            <span className='font-medium'>Perfil</span>
          </Link>
          <div className='border-t border-gray-100 my-1'></div>
          <button onClick={() => { onLogout(); closeMenu(); }} className='flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-100 text-left'>
            <LogOut size={18} />
            <span className='font-medium'>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
});
GestionMenu.displayName = 'GestionMenu';

interface DrawerProps {
  onClick?: () => void;
  delay: number;
  isDrawerOpen?: boolean;
  onLogout: () => void;
}

const DrawerGestionMenu = memo(({ onClick, delay, isDrawerOpen, onLogout }: DrawerProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) setOpen(false);
  }, [isDrawerOpen]);

  return (
    <div className='mt-4 border-t border-white/20 pt-4' style={{ animation: `slideIn 0.4s ease-out ${delay}s both` }}>
      <button
        onClick={() => setOpen(!open)}
        className={`group relative w-full text-left text-white text-lg px-6 py-4 rounded-xl transition-all duration-300 ${open ? 'bg-white/15 translate-x-2' : 'hover:bg-white/10 hover:translate-x-2'}`}
      >
        <div className='flex items-center justify-between'>
          <span className='relative z-10 font-semibold'>Gestión</span>
          <svg className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className='pl-4 space-y-1 mt-2 border-l-2 border-white/20 ml-6'>
          <Link to='/gestion' className='block text-white/90 text-base px-6 py-3 rounded-lg hover:bg-white/15' onClick={onClick}>Ir a gestión</Link>
          <Link to='/editProfile' className='block text-white/90 text-base px-6 py-3 rounded-lg hover:bg-white/15' onClick={onClick}>Perfil</Link>
          <button onClick={() => { onLogout(); onClick?.(); }} className='w-full text-left text-white/90 text-base px-6 py-3 rounded-lg hover:bg-red-500/80'>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
});
DrawerGestionMenu.displayName = 'DrawerGestionMenu';

const DrawerNavButton = memo(({ text, to, onClick, delay }: NavButtonProps & { delay: number }) => (
  <Link to={to} onClick={onClick} className='group relative block text-white text-lg px-6 py-4 rounded-xl hover:bg-white/10' style={{ animation: `slideIn 0.4s ease-out ${delay}s both` }}>
    <span className='relative z-10'>{text}</span>
  </Link>
));
DrawerNavButton.displayName = 'DrawerNavButton';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado simulado de autenticación. Cambia a "true" para ver el menú de usuario.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const handleFakeLogout = useCallback(() => {
    setIsLoggedIn(false);
    navigate('/home');
  }, [navigate]);

  return (
    <>
      <style>{styles}</style>
      <nav className='fixed top-0 left-0 w-full z-50 navbar-animated'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-800 to-indigo-900 backdrop-blur-md' />
        <div className='relative flex items-center justify-between h-14 px-4 shadow-lg'>
          <div className='flex items-center'>
            <div className='md:hidden -ml-4 z-50'>
              <Hamburger toggled={isOpen} toggle={setIsOpen} size={24} duration={0.4} color='#fff' />
            </div>
            <LogoButton />
            <span className='ml-4 text-white font-bold text-sm hover:text-indigo-200'>Grupo IV Scout Montequinto</span>
          </div>
          <div className='hidden md:flex space-x-2 items-center'>
            <NavButton text='Inicio' to='/home' />
            <NavButton text='Conócenos' to='/about' />
            <NavButton text='Contacto' to='/contact' />
            {isLoggedIn ? <GestionMenu onLogout={handleFakeLogout} /> : <LoginButton />}
          </div>
        </div>

        {isOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden' onClick={closeDrawer} style={{ animation: 'fadeIn 0.5s ease-out' }} />
        )}

        <div className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-br from-[#1840C4] to-[#0f2a8a] shadow-2xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-500 ease-out md:hidden z-40 overflow-y-auto`}>
          <div className='relative flex justify-end items-center py-4 px-6 border-b border-white/10'>
            {isLoggedIn ? (
              <Link to='/home' onClick={closeDrawer}><img src={logo} alt='Logo' className='h-10 w-10 rounded-full' /></Link>
            ) : (
              <LoginButton onClick={closeDrawer} />
            )}
          </div>
          <div className='relative flex flex-col px-4 py-8 space-y-2'>
            <DrawerNavButton text='Inicio' to='/home' onClick={closeDrawer} delay={0.25} />
            <DrawerNavButton text='Conócenos' to='/about' onClick={closeDrawer} delay={0.3} />
            <DrawerNavButton text='Contacto' to='/contact' onClick={closeDrawer} delay={0.35} />
            {isLoggedIn && <DrawerGestionMenu onClick={closeDrawer} delay={0.4} isDrawerOpen={isOpen} onLogout={handleFakeLogout} />}
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;