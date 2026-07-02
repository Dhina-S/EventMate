import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaBell, FaBars, FaTimes, FaUser, FaSignOutAlt, FaTicketAlt, FaSun, FaMoon } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-wide hover:text-blue-200 transition">
          Event<span className="text-blue-300">Mate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="hover:text-blue-200 transition font-medium">Home</Link>
          <Link to="/events" className="hover:text-blue-200 transition font-medium">Events</Link>
          <Link to="/about" className="hover:text-blue-200 transition font-medium">About</Link>

          {/* 🌙 Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="relative w-14 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center px-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <span
              className={`absolute w-5 h-5 rounded-full bg-white shadow flex items-center justify-center transition-all duration-300 ${
                isDarkMode ? 'translate-x-7 bg-indigo-700' : 'translate-x-0 bg-yellow-300'
              }`}
            >
              {isDarkMode ? <FaMoon className="text-white text-[10px]" /> : <FaSun className="text-yellow-700 text-[10px]" />}
            </span>
          </button>

          {user ? (
            <>
              <Link to="/my-tickets" className="hover:text-blue-200 transition font-medium flex items-center gap-1">
                <FaTicketAlt className="text-sm" /> My Tickets
              </Link>
              <Link to="/notifications" className="relative hover:text-blue-200 transition">
                <FaBell className="text-lg" />
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition font-medium"
                >
                  <FaUser className="text-sm" />
                  <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full font-semibold transition shadow"
                >
                  <FaSignOutAlt className="text-sm" /> Logout
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-white text-blue-700 px-5 py-2 rounded-full font-semibold hover:bg-blue-50 transition shadow"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-blue-950 px-4 pb-4 flex flex-col gap-3 border-t border-blue-800">
          <Link to="/" className="py-2 hover:text-blue-300 transition" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/events" className="py-2 hover:text-blue-300 transition" onClick={() => setMenuOpen(false)}>Events</Link>
          <Link to="/about" className="py-2 hover:text-blue-300 transition" onClick={() => setMenuOpen(false)}>About</Link>
          {/* 🌙 Dark Mode Toggle (mobile) */}
          <button onClick={toggleTheme} className="flex items-center gap-2 py-2 text-left hover:text-blue-300 transition">
            {isDarkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-blue-300" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          {user ? (
            <>
              <Link to="/my-tickets" className="py-2 hover:text-blue-300 transition" onClick={() => setMenuOpen(false)}>My Tickets</Link>
              <Link to="/dashboard" className="py-2 hover:text-blue-300 transition" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/notifications" className="py-2 hover:text-blue-300 transition" onClick={() => setMenuOpen(false)}>Notifications</Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="text-left py-2 text-red-400 hover:text-red-300 transition font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="py-2 font-semibold text-blue-200 hover:text-white transition" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;