import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    } catch {
      setUser(null);
    }
  }, []);

  const handleUploadClick = () => {
    navigate("/upload");
    setMenuOpen(false);
  };

  return (
    <header className="w-full px-20 py-4 text-white">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img
            src="/logo-MedScanAI.png"
            alt="MedScanAI Logo"
            className="w-24 h-auto filter drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]"
          />
        </Link>

        {/* Hamburger icon */}
        <button
          className="z-30 block md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          <svg width="0" height="0">
            <defs>
              <linearGradient id="icon-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5de0e6" />
                <stop offset="100%" stopColor="#004aad" />
              </linearGradient>
            </defs>
          </svg>
          {menuOpen ? (
            <CloseIcon sx={{ fill: 'url(#icon-gradient)' }} fontSize="large" />
          ) : (
            <MenuIcon sx={{ fill: 'url(#icon-gradient)' }} fontSize="large" />
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden gap-6 text-sm font-bold md:flex font-machina">
          <NavItem to="/" label="Home" />
          <NavItem to="/about" label="About" />
          <NavItem to="/contact" label="Contact" />
          <button onClick={handleUploadClick} className="relative inline-flex items-center gap-2">
            <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-cyan-300 to-blue-700"></span>
            <Typography sx={{ fontFamily: 'Neue Machina, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
              Upload MRI Image
            </Typography>
          </button>

          {user ? (
            <>
              <NavItem to={user.role === "DOCTOR" ? "/doctor-dashboard" : "/patient-dashboard"} label="Dashboard" />
              <button onClick={handleLogout} className="relative inline-flex items-center gap-2">
                <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-cyan-300 to-blue-700"></span>
                <Typography sx={{ fontFamily: 'Neue Machina, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
                  Logout
                </Typography>
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login" label="Login" />
              <NavItem to="/signup" label="Sign Up" />
            </>
          )}
        </nav>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="p-6 mt-4 space-y-4 rounded-lg md:hidden bg-black/80">
          <NavItem to="/" label="Home" onClick={() => setMenuOpen(false)} />
          <button onClick={handleUploadClick} className="relative inline-flex items-center gap-2">
            <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-cyan-300 to-blue-700"></span>
            <Typography sx={{ fontFamily: 'Neue Machina, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
              Upload MRI Image
            </Typography>
          </button>
          <NavItem to="/about" label="About" onClick={() => setMenuOpen(false)} />
          <NavItem to="/contact" label="Contact" onClick={() => setMenuOpen(false)} />

          {user ? (
            <>
              <NavItem to={user.role === "DOCTOR" ? "/doctor-dashboard" : "/patient-dashboard"} label="Dashboard" onClick={() => setMenuOpen(false)} />
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="relative inline-flex items-center gap-2">
                <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-cyan-300 to-blue-700"></span>
                <Typography sx={{ fontFamily: 'Neue Machina, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
                  Logout
                </Typography>
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login" label="Login" onClick={() => setMenuOpen(false)} />
              <NavItem to="/signup" label="Sign Up" onClick={() => setMenuOpen(false)} />
            </>
          )}
        </div>
      )}
    </header>
  );
}

function NavItem({ to, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="relative inline-flex items-center gap-2">
      <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-cyan-300 to-blue-700"></span>
      <Typography sx={{ fontFamily: 'Neue Machina, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
        {label}
      </Typography>
    </Link>
  );
}
